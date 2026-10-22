import { clearCookies } from '@/test-utils/cookies'
import { beforeEach, describe, expect, it, vi } from 'vitest'

async function importAuthStore() {
  const { useAuthStore } = await import('./auth-store')
  return useAuthStore
}

describe('useAuthStore', () => {
  beforeEach(() => {
    clearCookies()
    vi.resetModules()
  })

  it('starts with an empty access token when nothing is persisted', async () => {
    const useAuthStore = await importAuthStore()

    expect(useAuthStore.getState().accessToken).toBe('')
  })

  it('persists access token so a new store instance reads it back', async () => {
    const useAuthStore = await importAuthStore()
    useAuthStore.getState().setAccessToken('header.payload=;sig')

    vi.resetModules()
    const useAuthStoreAfterReload = await importAuthStore()

    expect(useAuthStoreAfterReload.getState().accessToken).toBe(
      'header.payload=;sig'
    )
  })

  it('reset clears the access token and drops persistence', async () => {
    const useAuthStore = await importAuthStore()
    useAuthStore.getState().setAccessToken('will-be-cleared')

    useAuthStore.getState().reset()

    expect(useAuthStore.getState().accessToken).toBe('')

    vi.resetModules()
    const useAuthStoreAfterReload = await importAuthStore()

    expect(useAuthStoreAfterReload.getState().accessToken).toBe('')
  })
})
