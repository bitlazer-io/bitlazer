// env.d.ts
interface ImportMetaEnv {
  readonly VITE_NODE_ENV: string
  // add more environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
