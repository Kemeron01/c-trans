// A page's code is loaded lazily. After a deploy (or code changes in dev)
// an open tab may ask for a chunk that no longer exists; the server answers
// with index.html and the import fails. Reloading the page fetches the new
// version. Guarded so a really broken build can't loop forever.

const KEY = 'ct_chunk_reload_at'

export function isChunkLoadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return /dynamically imported module|Importing a module script failed|module script|Loading chunk|preload CSS/i.test(
    message
  )
}

/** Reloads unless we already did it in the last 10 seconds. */
export function reloadOnce() {
  try {
    const last = Number(sessionStorage.getItem(KEY) ?? 0)
    if (Date.now() - last < 10_000) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    // No storage: still reload once (worst case the error page stays)
  }
  window.location.reload()
  return true
}
