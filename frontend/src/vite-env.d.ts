/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend base URL, e.g. http://localhost:8000/api/v1 (default: /api/v1). */
  readonly VITE_API_URL?: string
  /** Set to "false" to disable MSW mocks in dev. */
  readonly VITE_API_MOCKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
