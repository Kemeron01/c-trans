import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { publicWarehousesQuery } from '@/api/account'
import { cssColorToRgb } from '@/lib/css-color'
import { Globe } from '@/components/ui/globe'

type Rgb = [number, number, number]
type Palette = {
  dark: boolean
  base: Rgb
  glow: Rgb
  accent: Rgb
}

/** Globe colors from the theme tokens; recomputed when `.dark` changes. */
function useGlobePalette(): Palette | null {
  const [palette, setPalette] = useState<Palette | null>(null)
  useEffect(() => {
    const root = document.documentElement
    const read = () =>
      setPalette({
        dark: root.classList.contains('dark'),
        base: cssColorToRgb('var(--background)'),
        glow: cssColorToRgb('var(--muted)'),
        accent: cssColorToRgb('var(--primary)'),
      })
    read()
    const observer = new MutationObserver(read)
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return palette
}

/**
 * Warehouses on a globe: one delivery line from every foreign warehouse to
 * the Uzbek one. Everything comes from the public warehouses API, so a new
 * warehouse shows up without code changes.
 */
export function DeliveryGlobe({ className }: { className?: string }) {
  const { t } = useTranslation()
  const warehouses = useQuery(publicWarehousesQuery()).data
  const palette = useGlobePalette()

  const { markers, arcs, focusLongitude } = useMemo(() => {
    const located = (warehouses ?? []).filter(
      (w) => w.latitude !== null && w.longitude !== null
    )
    const at = (w: (typeof located)[number]): [number, number] => [
      w.latitude as number,
      w.longitude as number,
    ]
    const foreign = located.filter((w) => w.kind === 'foreign')
    const local = located.filter((w) => w.kind === 'local')
    return {
      markers: located.map((w) => ({
        id: `w${w.id}`,
        location: at(w),
        size: w.kind === 'local' ? 0.09 : 0.06,
      })),
      arcs: foreign.flatMap((f) =>
        local.map((l) => ({
          id: `a${f.id}-${l.id}`,
          from: at(f),
          to: at(l),
        }))
      ),
      focusLongitude: local[0]?.longitude ?? 60,
    }
  }, [warehouses])

  if (!palette) return null
  return (
    <Globe
      className={className}
      label={t('landing.globeLabel')}
      markers={markers}
      arcs={arcs}
      dark={palette.dark}
      baseColor={palette.dark ? [0.25, 0.27, 0.32] : [1, 1, 1]}
      glowColor={palette.dark ? [0.1, 0.12, 0.2] : palette.glow}
      markerColor={palette.accent}
      arcColor={palette.accent}
      focusLongitude={focusLongitude}
    />
  )
}
