import { useEffect, useRef } from 'react'
import createGlobe, { type Arc, type Marker } from 'cobe'
import { useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

type Rgb = [number, number, number]

export type GlobeAppearance = {
  markers: Marker[]
  arcs: Arc[]
  /** Dark globe style (dark theme). */
  dark: boolean
  baseColor: Rgb
  glowColor: Rgb
  markerColor: Rgb
  arcColor: Rgb
}

type GlobeProps = GlobeAppearance & {
  className?: string
  /** Longitude (degrees) turned to the viewer at first. */
  focusLongitude?: number
  /** Accessible description of the picture. */
  label?: string
}

const AUTO_ROTATE_SPEED = 0.004 // rad per 60 fps frame
const FRAME_MS = 1000 / 30 // slow rotation does not need more than 30 fps
const THETA = 0.28

const style = (a: GlobeAppearance) => ({
  dark: a.dark ? 1 : 0,
  diffuse: a.dark ? 1.2 : 0.4,
  mapBrightness: a.dark ? 6 : 1.2,
  baseColor: a.baseColor,
  glowColor: a.glowColor,
  markerColor: a.markerColor,
  arcColor: a.arcColor,
  // Without `id` cobe adds no DOM anchors (CSS anchor labels) for markers and
  // arcs, which it would otherwise move — and restyle — on every frame
  markers: a.markers.map((m) => ({ ...m, id: undefined })),
  arcs: a.arcs.map((arc) => ({ ...arc, id: undefined })),
})

/**
 * cobe v2 has no onRender: the globe is redrawn with globe.update() from our
 * own requestAnimationFrame loop. One WebGL context per mount; appearance
 * changes (data, colors, theme) go through update(), never re-creation.
 * The loop runs only while the globe is on screen, the tab is visible and
 * motion is allowed; dragging (mouse and touch) turns it.
 */
export function Globe({
  className,
  focusLongitude = 0,
  label,
  ...appearance
}: GlobeProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const latest = useRef(appearance)
  latest.current = appearance
  const reducedRef = useRef(!!reduced)
  reducedRef.current = !!reduced

  const globeRef = useRef<ReturnType<typeof createGlobe> | null>(null)
  const phi = useRef(-(focusLongitude * Math.PI) / 180)
  const dragging = useRef(false)
  const lastX = useRef(0)
  const ensureLoop = useRef<() => void>(() => {})

  // Created once per mount
  // The canvas is created here, not by React: a WebGL context keeps its
  // enabled vertex attributes, so re-creating cobe on the same canvas
  // (StrictMode runs effects twice in dev) makes the first draw warn
  // "no buffer is bound to enabled attribute".
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const canvas = document.createElement('canvas')
    canvas.setAttribute('role', 'img')
    canvas.className =
      'size-full cursor-grab touch-pan-y opacity-0 transition-opacity duration-500 active:cursor-grabbing'
    host.append(canvas)
    const onDown = (e: PointerEvent) => {
      dragging.current = true
      lastX.current = e.clientX
      canvas.setPointerCapture(e.pointerId)
      ensureLoop.current()
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      phi.current += (e.clientX - lastX.current) / 200
      lastX.current = e.clientX
    }
    const onUp = () => {
      dragging.current = false
    }
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)
    canvas.addEventListener('pointercancel', onUp)
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    // Size in CSS pixels, from the ResizeObserver (never read per frame)
    let size = Math.max(canvas.offsetWidth, 1)
    let onScreen = true
    let frame = 0

    const globe = createGlobe(canvas, {
      width: size,
      height: size,
      devicePixelRatio: dpr,
      phi: phi.current,
      theta: THETA,
      mapSamples: 16000,
      opacity: 1,
      arcWidth: 0.6,
      arcHeight: 0.35,
      ...style(latest.current),
    })
    globeRef.current = globe

    const shouldRun = () =>
      onScreen && !document.hidden && (!reducedRef.current || dragging.current)
    let last = 0
    const tick = (now: number) => {
      frame = 0
      if (!shouldRun()) {
        last = 0
        return
      }
      frame = requestAnimationFrame(tick)
      const dt = now - last
      if (last && dt < FRAME_MS - 2) return
      if (!dragging.current && last) {
        phi.current += AUTO_ROTATE_SPEED * Math.min(dt / (1000 / 60), 4)
      }
      last = now
      globe.update({ phi: phi.current })
    }
    const start = () => {
      if (!frame && shouldRun()) frame = requestAnimationFrame(tick)
    }
    ensureLoop.current = start

    const resize = new ResizeObserver(([entry]) => {
      size = Math.max(Math.round(entry.contentRect.width), 1)
      globe.update({ width: size, height: size })
    })
    resize.observe(canvas)
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      if (onScreen) start()
    })
    visibility.observe(canvas)
    const onVisibility = () => start()
    document.addEventListener('visibilitychange', onVisibility)

    start()
    const fadeIn = requestAnimationFrame(() => {
      canvas.style.opacity = '1'
    })

    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(fadeIn)
      resize.disconnect()
      visibility.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      globeRef.current = null
      globe.destroy()
      // cobe wraps the canvas in a div: remove whatever it left in the host
      host.replaceChildren()
    }
  }, [])

  // The label follows the language without re-creating anything
  useEffect(() => {
    const canvas = hostRef.current?.querySelector('canvas')
    if (label) canvas?.setAttribute('aria-label', label)
  }, [label])

  // Data / colors / theme: update the live globe
  const { markers, arcs, dark, baseColor, glowColor, markerColor, arcColor } =
    appearance
  useEffect(() => {
    globeRef.current?.update(style(latest.current))
  }, [markers, arcs, dark, baseColor, glowColor, markerColor, arcColor])

  // Motion preference changed: start (or let the loop stop by itself)
  useEffect(() => {
    ensureLoop.current()
  }, [reduced])

  return (
    <div
      ref={hostRef}
      className={cn('relative mx-auto aspect-square w-full', className)}
    />
  )
}
