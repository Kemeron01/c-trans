import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { AxiosError } from 'axios'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { API_MOCKS_ENABLED } from '@/api/config'
import { useAuthStore } from '@/stores/auth-store'
import { reloadOnce } from '@/lib/chunk-reload'
import { handleServerError } from '@/lib/handle-server-error'
import i18n from '@/lib/i18n'
import { FontProvider } from './context/font-provider'
import { ThemeProvider } from './context/theme-provider'
// Generated Routes
import { routeTree } from './routeTree.gen'
// Styles
import './styles/index.css'

// Lazy chunk of an older build is gone (new deploy): load the new version
window.addEventListener('vite:preloadError', (event) => {
  if (reloadOnce()) event.preventDefault()
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // eslint-disable-next-line no-console
        if (import.meta.env.DEV) console.log({ failureCount, error })

        if (failureCount >= 0 && import.meta.env.DEV) return false
        if (failureCount > 3 && import.meta.env.PROD) return false

        return !(
          error instanceof AxiosError &&
          [401, 403].includes(error.response?.status ?? 0)
        )
      },
      refetchOnWindowFocus: import.meta.env.PROD,
      staleTime: 10 * 1000, // 10s
    },
    mutations: {
      onError: (error) => {
        handleServerError(error)

        if (error instanceof AxiosError) {
          if (error.response?.status === 304) {
            toast.error(i18n.t('errors.notModified'))
          }
        }
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          if (!useAuthStore.getState().accessToken) return
          // Public pages (site header): just forget the stale session
          if (query.meta?.publicPage) {
            useAuthStore.getState().reset()
            return
          }
          toast.error(i18n.t('auth.sessionExpired'))
          useAuthStore.getState().reset()
          const redirect = router.history.location.href
          // Staff and clients have separate sign-in pages
          router.navigate({
            to: redirect.startsWith('/admin') ? '/admin/sign-in' : '/sign-in',
            search: { redirect },
          })
        }
        if (error.response?.status === 500) {
          toast.error(i18n.t('errors.serverError'))
          // Only navigate to error page in production to avoid disrupting HMR in development
          if (import.meta.env.PROD) {
            router.navigate({ to: '/500' })
          }
        }
      }
    },
  }),
})

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

async function enableMocking() {
  // `import.meta.env.DEV` inline (not only via API_MOCKS_ENABLED) lets the
  // bundler drop MSW from the production build.
  if (!import.meta.env.DEV || !API_MOCKS_ENABLED) return
  const { worker } = await import('./api/mocks/browser')
  await worker.start({ onUnhandledFrame: 'bypass', quiet: true })
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  enableMocking().then(() => {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <FontProvider>
              <RouterProvider router={router} />
            </FontProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </StrictMode>
    )
  })
}
