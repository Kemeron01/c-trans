import { useEffect, useRef } from 'react'
import createGlobe, { type Arc, type Marker } from 'cobe'
import { useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'

type Rgb = [number, number, number]

type GlobeProps = {
  className?: string
  markers: Marker[]
  arcs: Arc[]
  /** Dark globe style (dark theme). */
  dark?: boolean
  baseColor: Rgb
  glowColor: Rgb
  markerColor: Rgb
  arcColor: Rgb
  /** Longitude (degrees) turned to the viewer at first. */
  focusLongitude?: number
  /** Accessible description of the picture. */
  label?: string
}

const AUTO_ROTATE_SPEED = 0.004 // rad per frame
const THETA = 0.28

// cobe v2 has no onRender: the canvas is redrawn with globe.update() from our
// own requestAnimationFrame loop. Dragging (mouse and touch) turns the globe;
// auto-rotation is off with prefers-reduced-motion.
export function Globe({
  className,
  markers,
  arcs,
  dark = false,
  baseColor,
  glowColor,
  markerColor,
  arcColor,
  focusLongitude = 0,
  label,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = useReducedMotion()
  // Rotation the user added by dragging, kept across effect re-runs
  const dragPhi = useRef(0)
  const phiRef = useRef(-(focusLongitude * Math.PI) / 180)
  const dragStart = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const size = () => Math.max(canvas.offsetWidth, 1) * dpr

    const globe = createGlobe(canvas, {
      width: size(),
      height: size(),
      devicePixelRatio: dpr,
      phi: phiRef.current + dragPhi.current,
      theta: THETA,
      dark: dark ? 1 : 0,
      diffuse: dark ? 1.2 : 0.4,
      mapSamples: 16000,
      mapBrightness: dark ? 6 : 1.2,
      baseColor,
      markerColor,
      glowColor,
      markers,
      arcs,
      arcColor,
      arcWidth: 0.6,
      arcHeight: 0.35,
    })

    const resize = new ResizeObserver(() =>
      globe.update({ width: size(), height: size() })
    )
    resize.observe(canvas)

    let frame = 0
    const tick = () => {
      if (!reduced && dragStart.current === null) {
        phiRef.current += AUTO_ROTATE_SPEED
      }
      globe.update({
        phi: phiRef.current + dragPhi.current,
        width: size(),
        height: size(),
      })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    const fadeIn = requestAnimationFrame(() => {
      canvas.style.opacity = '1'
    })

    return () => {
      cancelAnimationFrame(frame)
      cancelAnimationFrame(fadeIn)
      resize.disconnect()
      globe.destroy()
    }
  }, [
    markers,
    arcs,
    dark,
    baseColor,
    glowColor,
    markerColor,
    arcColor,
    reduced,
  ])

  return (
    <div className={cn('relative mx-auto aspect-square w-full', className)}>
      <canvas
        ref={canvasRef}
        role='img'
        aria-label={label}
        className='size-full cursor-grab touch-pan-y opacity-0 transition-opacity duration-500 active:cursor-grabbing'
        onPointerDown={(e) => {
          dragStart.current = e.clientX
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (dragStart.current === null) return
          dragPhi.current += (e.clientX - dragStart.current) / 200
          dragStart.current = e.clientX
        }}
        onPointerUp={() => (dragStart.current = null)}
        onPointerCancel={() => (dragStart.current = null)}
      />
    </div>
  )
}
