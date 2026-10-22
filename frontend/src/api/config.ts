export const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

/** MSW mocks run only in dev and can be turned off with VITE_API_MOCKS=false. */
export const API_MOCKS_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_API_MOCKS !== 'false'
