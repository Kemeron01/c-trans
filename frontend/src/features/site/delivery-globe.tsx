import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { publicWarehousesQuery } from '@/api/account'
import { cssColorToRgb } from '@/lib/css-color'
import { Globe } from '@/components/ui/globe'
import { buildGlobeData } from './globe-data'

type Rgb = [number, number, number]
type Palette = {
  dark: boolean
  base: Rgb
  glow: Rgb
  accent: Rgb
}

const DARK_BASE: Rgb = [0.25, 0.27, 0.32]
const DARK_GLOW: Rgb = [0.1, 0.12, 0.2]
const LIGHT_BASE: Rgb = [1, 1, 1]

/** Globe colors from the theme tokens; recomputed (once) when `.dark` changes. */
function useGlobePalette(): Palette | null {
  const [palette, setPalette] = useState<Palette | null>(null)
  useEffect(() => {
    const root = document.documentElement
    const read = () => {
      const dark = root.classList.contains('dark')
      setPalette((prev) => {
        // The observer fires several times per theme switch: keep identity
        if (prev && prev.dark === dark) return prev
        return {
          dark,
          base: dark ? DARK_BASE : LIGHT_BASE,
          glow: dark ? DARK_GLOW : cssColorToRgb('var(--muted)'),
          accent: cssColorToRgb('var(--brand)'),
        }
      })
    }
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
  const { markers, arcs, focusLongitude } = useMemo(
    () => buildGlobeData(warehouses ?? []),
    [warehouses]
  )

  if (!palette) return null
  return (
    <Globe
      className={className}
      label={t('landing.globeLabel')}
      markers={markers}
      arcs={arcs}
      dark={palette.dark}
      baseColor={palette.base}
      glowColor={palette.glow}
      markerColor={palette.accent}
      arcColor={palette.accent}
      focusLongitude={focusLongitude}
    />
  )
}
