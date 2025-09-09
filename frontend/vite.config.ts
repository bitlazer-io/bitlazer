import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import obfuscatorPlugin from './plugins/vite-plugin-javascript-obfuscator'

// https://vitejs.dev/config/
export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  plugins: [
    react(),
    tsconfigPaths(),

    ['development', 'stage'].includes(process.env.VITE_NODE_ENV!)
      ? obfuscatorPlugin({
          include: '**/*.js', // Adjust the pattern to include files you want to obfuscate
          exclude: 'node_modules/**',
          obfuscatorOptions: {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 1,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 1,
            debugProtection: true,
            debugProtectionInterval: true,
            disableConsoleOutput: true,
            identifierNamesGenerator: 'mangled-shuffled',
            log: false,
            numbersToExpressions: true,
            renameGlobals: false,
            selfDefending: true,
            simplify: true,
            splitStrings: true,
            renameProperties: false,
            renamePropertiesMode: false,
            splitStringsChunkLength: 3,
            stringArray: true,
            stringArrayCallsTransform: true,
            stringArrayCallsTransformThreshold: 1,
            stringArrayEncoding: ['base64', 'rc4'],
            stringArrayIndexShift: true,
            stringArrayRotate: true,
            stringArrayShuffle: true,
            stringArrayWrappersCount: 5,
            stringArrayWrappersChainedCalls: true,
            stringArrayWrappersType: 'function',
            stringArrayThreshold: 1,
            transformObjectKeys: true,
            unicodeEscapeSequence: true,
          },
        })
      : [],
  ],
  define: {
    'process.env': {
      VITE_NODE_ENV: process.env.VITE_NODE_ENV,
      VITE_ARBISCAN_API_KEY: process.env.VITE_ARBISCAN_API_KEY || '',
      VITE_ARBISCAN_API_URL: process.env.VITE_ARBISCAN_API_URL || 'https://api.arbiscan.io/api',
      VITE_BITLAZER_EXPLORER_API_URL:
        process.env.VITE_BITLAZER_EXPLORER_API_URL || 'https://bitlazer.calderaexplorer.xyz/api',
    },
  },
  server: {
    host: '127.0.0.1',
    port: 3000, // specify the port number here
  },
  build: {
    sourcemap: false,
  },
})
