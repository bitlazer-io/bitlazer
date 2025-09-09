/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NODE_ENV: string
  readonly VITE_ARBISCAN_API_KEY: string
  readonly VITE_ARBISCAN_API_URL: string
  readonly VITE_BITLAZER_EXPLORER_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
