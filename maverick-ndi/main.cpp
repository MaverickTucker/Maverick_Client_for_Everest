#include <Processing.NDI.Lib.h>
#include <App.h>
#include <libusockets.h>
#include <turbojpeg.h>
#include <iostream>
#include <vector>
#include <string>
#include <chrono>
#include <thread>
#include <mutex>
#include <atomic>
#include <sstream>

// Simple Base64 encoder helper
static const std::string base64_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
std::string base64_encode(unsigned char const* bytes_to_encode, unsigned int in_len) {
    std::string ret;
    int i = 0;
    unsigned char char_array_3[3], char_array_4[4];
    while (in_len--) {
        char_array_3[i++] = *(bytes_to_encode++);
        if (i == 3) {
            char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
            char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
            char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
            char_array_4[3] = char_array_3[2] & 0x3f;
            for (i = 0; (i < 4); i++) ret += base64_chars[char_array_4[i]];
            i = 0;
        }
    }
    if (i) {
        for (int j = i; j < 3; j++) char_array_3[j] = '\0';
        char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
        char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
        char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
        for (int j = 0; (j < i + 1); j++) ret += base64_chars[char_array_4[j]];
        while ((i++ < 3)) ret += '=';
    }
    return ret;
}

struct JpegResult {
    uint8_t* data;
    unsigned long size;
};

JpegResult encodeJPEG(uint8_t* rgba, int w, int h, int pitch, NDIlib_FourCC_video_type_e fourCC, int quality = 70) {
    if (!rgba || w <= 0 || h <= 0 || pitch <= 0) return { nullptr, 0 };
    
    TJPF pixelFormat = TJPF_BGRX;
    bool isYUV = false;

    switch (fourCC) {
        case NDIlib_FourCC_video_type_BGRX:
        case NDIlib_FourCC_video_type_BGRA:
            pixelFormat = TJPF_BGRX;
            break;
        case NDIlib_FourCC_video_type_RGBX:
        case NDIlib_FourCC_video_type_RGBA:
            pixelFormat = TJPF_RGBA;
            break;
        case NDIlib_FourCC_video_type_UYVY:
            isYUV = true;
            std::cerr << "[NDI Bridge] Received UYVY frame but requested BGRX. Skipping encode." << std::endl;
            break;
        default:
            pixelFormat = TJPF_BGRX; // Fallback
            break;
    }

    tjhandle tj = tjInitCompress();
    if (!tj) return { nullptr, 0 };
    
    uint8_t* jpegBuf = nullptr;
    unsigned long jpegSize = 0;
    int result = -1;

    if (isYUV) {
        // UYVY handling (YUV 4:2:2)
        // For simplicity and stability, we'll use tjCompressFromYUV if we have planes, 
        // but UYVY is interleaved. TurboJPEG can handle interleaved YUV in some versions,
        // but the safest way is to let NDI convert it or use a manual conversion.
        // Given NDI SDK can convert, we prefer the receiver to do it.
        // If we get here, we'll try to treat it as a special case or skip.
        tjDestroy(tj);
        return { nullptr, 0 }; 
    } else {
        result = tjCompress2(tj, rgba, w, h, pitch, pixelFormat, &jpegBuf, &jpegSize, TJSAMP_420, quality, 0);
    }

    tjDestroy(tj);
    if (result == 0 && jpegBuf) {
        return { jpegBuf, jpegSize };
    }
    if (jpegBuf) tjFree(jpegBuf);
    return { nullptr, 0 };
}

// Global state
std::atomic<bool> exit_flag(false);
std::mutex state_mutex;
NDIlib_recv_instance_t pNDI_recv = nullptr;
NDIlib_find_instance_t pNDI_find = nullptr;
uWS::App* global_app = nullptr;
uWS::Loop* main_loop = nullptr;

struct TimerData {
    NDIlib_find_instance_t find;
    uWS::App* app;
};

void broadcast(const std::string& msg) {
    if (!global_app || !main_loop) return;
    main_loop->defer([msg]() {
        if (global_app) {
            global_app->publish("frames", msg, uWS::OpCode::TEXT);
        }
    });
}

void broadcastBinary(uint8_t* data, unsigned long size) {
    if (!global_app || !main_loop || !data || size == 0) {
        if (data) tjFree(data);
        return;
    }
    // We must copy the data to pass it to the main loop if we want to be safe, 
    // or use a shared pointer. Given uWS publish behavior, we'll copy into a string or vector.
    std::string buffer((char*)data, size);
    tjFree(data);

    main_loop->defer([buffer]() {
        if (global_app) {
            std::cout << "[NDI Bridge] Publishing binary frame: " << buffer.size() << " bytes" << std::endl;
            global_app->publish("frames", buffer, uWS::OpCode::BINARY);
        }
    });
}

void switchNDISource(const std::string& name) {
    std::lock_guard<std::mutex> lock(state_mutex);
    if (pNDI_recv) {
        NDIlib_recv_destroy(pNDI_recv);
        pNDI_recv = nullptr;
    }
    if (name.empty()) return;

    NDIlib_recv_create_v3_t recv_desc;
    recv_desc.source_to_connect_to.p_ndi_name = name.c_str();
    recv_desc.color_format = NDIlib_recv_color_format_BGRX_BGRA;
    recv_desc.bandwidth = NDIlib_recv_bandwidth_highest;
    recv_desc.allow_video_fields = false;
    recv_desc.p_ndi_recv_name = "Maverick Preview Receiver";
    pNDI_recv = NDIlib_recv_create_v3(&recv_desc);
    
    if (pNDI_recv) {
        std::cout << "[NDI] Connected to source: " << name << std::endl;
    } else {
        std::cerr << "[NDI] Failed to connect to source or source name empty. Name: '" << name << "'" << std::endl;
    }
}

void onDiscoveryTimer(struct us_timer_t* t) {
    TimerData* data = (TimerData*)us_timer_ext(t);
    if (!data || !data->find || !data->app) return;

    uint32_t no_sources = 0;
    const NDIlib_source_t* p_sources = NDIlib_find_get_current_sources(data->find, &no_sources);
    
    std::stringstream ss;
    ss << "{\"type\":\"SOURCE_LIST\",\"sources\":[";
    if (p_sources) {
        for (uint32_t i = 0; i < no_sources; i++) {
            ss << "{\"name\":\"" << (p_sources[i].p_ndi_name ? p_sources[i].p_ndi_name : "Unknown") 
               << "\",\"address\":\"" << (p_sources[i].p_ip_address ? p_sources[i].p_ip_address : "Unknown") << "\"}";
            if (i < no_sources - 1) ss << ",";
        }
    }
    ss << "]}";
    data->app->publish("frames", ss.str(), uWS::OpCode::TEXT);
}

int main() {
    if (!NDIlib_initialize()) return 1;

    pNDI_find = NDIlib_find_create_v2();
    if (!pNDI_find) return 1;

    std::thread capture_thread([]() {
        auto last_frame_time = std::chrono::steady_clock::now();
        while (!exit_flag) {
            bool frame_captured = false;
            NDIlib_video_frame_v2_t video_frame;
            NDIlib_recv_instance_t local_recv = nullptr;

            {
                std::lock_guard<std::mutex> lock(state_mutex);
                local_recv = pNDI_recv;
                if (local_recv) {
                    if (NDIlib_recv_capture_v3(local_recv, &video_frame, nullptr, nullptr, 40) == NDIlib_frame_type_video) {
                        frame_captured = true;
                    }
                }
            }

            if (frame_captured) {
                // std::cout << "[NDI Bridge] Frame captured: " << video_frame.xres << "x" << video_frame.yres << std::endl;
                auto now = std::chrono::steady_clock::now();
                if (std::chrono::duration_cast<std::chrono::milliseconds>(now - last_frame_time).count() > 33) { // 30fps cap
                    JpegResult jpeg = encodeJPEG(video_frame.p_data, video_frame.xres, video_frame.yres, video_frame.line_stride_in_bytes, video_frame.FourCC);
                    if (jpeg.data) {
                        broadcastBinary(jpeg.data, jpeg.size);
                    } else {
                        // std::cerr << "[NDI Bridge] JPEG encoding failed" << std::endl;
                    }
                    last_frame_time = now;
                }
                NDIlib_recv_free_video_v2(local_recv, &video_frame);
            } else {
                std::this_thread::sleep_for(std::chrono::milliseconds(10));
            }
        }
    });

    uWS::App app;
    global_app = &app;
    main_loop = uWS::Loop::get();

    struct us_loop_t* loop_ptr = (struct us_loop_t*)main_loop;
    struct us_timer_t* discovery_timer = us_create_timer(loop_ptr, 0, sizeof(TimerData));
    TimerData* t_data = (TimerData*)us_timer_ext(discovery_timer);
    t_data->find = pNDI_find;
    t_data->app = &app;
    us_timer_set(discovery_timer, onDiscoveryTimer, 2000, 2000);

    app.ws<int>("/*", {
        .open = [](auto* ws) {
            std::cout << "[WS] Client connected" << std::endl;
            ws->subscribe("frames");
        },
        .message = [](auto* ws, std::string_view msg, uWS::OpCode) {
            std::cout << "[WS] Message received: " << msg << std::endl;
            if (msg.find("SELECT_SOURCE") != std::string::npos) {
                size_t pos = msg.find("\"name\":\"");
                if (pos != std::string::npos) {
                    std::string name = std::string(msg.substr(pos + 8));
                    name = name.substr(0, name.find("\""));
                    switchNDISource(name);
                }
            }
        }
    }).listen(8192, [](auto* listen_socket) {
        if (listen_socket) std::cout << "NDI Bridge listening on port 8192" << std::endl;
    }).run();

    exit_flag = true;
    capture_thread.join();
    
    NDIlib_find_destroy(pNDI_find);
    NDIlib_destroy();
    return 0;
}
