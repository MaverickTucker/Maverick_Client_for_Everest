cmake_minimum_required(VERSION 3.16)
project(ndi-bridge)

set(CMAKE_CXX_STANDARD 20)

# Absolute paths
set(NDI_INC "${CMAKE_CURRENT_SOURCE_DIR}/local_deps/include")
set(NDI_LIB "${CMAKE_CURRENT_SOURCE_DIR}/local_deps/lib/Processing.NDI.Lib.x64.lib")
set(VCPKG_ROOT "${CMAKE_CURRENT_SOURCE_DIR}/../vcpkg/packages")
set(TURBO_INC "${VCPKG_ROOT}/libjpeg-turbo_x64-windows/include")
set(TURBO_LIB "${VCPKG_ROOT}/libjpeg-turbo_x64-windows/lib/turbojpeg.lib")
set(ZLIB_INC "${VCPKG_ROOT}/zlib_x64-windows/include")
set(ZLIB_LIB "${VCPKG_ROOT}/zlib_x64-windows/lib/zlib.lib")
set(LIBUV_INC "${VCPKG_ROOT}/libuv_x64-windows/include")
set(LIBUV_LIB "${VCPKG_ROOT}/libuv_x64-windows/lib/uv.lib")

# uSockets source
file(GLOB US_SOURCES 
    "third_party/uSockets/src/*.c"
    "third_party/uSockets/src/eventing/*.c"
    "third_party/uSockets/src/crypto/*.c"
)

add_executable(ndi-bridge-v2 main.cpp ${US_SOURCES})

# Uniform include paths
target_include_directories(ndi-bridge-v2 PRIVATE 
    "${NDI_INC}"
    "${TURBO_INC}"
    "${ZLIB_INC}"
    "${LIBUV_INC}"
    "third_party/uWebSockets/src"
    "third_party/uSockets/src"
)

# Uniform linking
target_link_libraries(ndi-bridge-v2 PRIVATE 
    "${NDI_LIB}"
    "${TURBO_LIB}"
    "${ZLIB_LIB}"
    "${LIBUV_LIB}"
    ws2_32
    crypt32
    advapi32
    iphlpapi
    userenv
    psapi
)

# Definitions
target_compile_definitions(ndi-bridge-v2 PRIVATE LIBUS_NO_SSL LIBUS_USE_LIBUV)
