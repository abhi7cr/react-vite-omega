/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly AMPLIFY_BACKEND_URL: string
  readonly AMPLIFY_BACKEND_PUBLISHABLE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
