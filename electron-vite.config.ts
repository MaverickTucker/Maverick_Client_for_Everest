import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import obfuscator from 'rollup-plugin-javascript-obfuscator'

export default defineConfig({
    main: {
        plugins: [
            externalizeDepsPlugin(),
            obfuscator({
                compact: true,
                controlFlowFlattening: true,
                deadCodeInjection: true,
                debugProtection: true,
                stringArray: true,
                stringArrayEncoding: ['rc4']
            })
        ]
    },
    preload: {
        plugins: [externalizeDepsPlugin()]
    },
    renderer: {
        resolve: {
            alias: {
                '@renderer': resolve('src/renderer')
            }
        },
        plugins: [
            react(),
            obfuscator({
                compact: true,
                controlFlowFlattening: false,
                stringArray: true
            })
        ]
    }
})
