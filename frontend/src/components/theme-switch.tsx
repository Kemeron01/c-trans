import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler'
import { buttonVariants } from '@/components/ui/button'
import { IconTooltip } from '@/components/icon-tooltip'

/**
 * Light/dark toggle for every header. Controlled: ThemeProvider owns the
 * theme (cookie, `.dark` class); the toggler only animates and reports the
 * choice. "System" is picked in the settings drawer.
 */
export function ThemeSwitch() {
  const { t } = useTranslation()
  const { resolvedTheme, setTheme } = useTheme()

  /* Update theme-color meta tag when the theme changes */
  useEffect(() => {
    const themeColor = resolvedTheme === 'dark' ? '#020817' : '#fff'
    const metaThemeColor = document.querySelector("meta[name='theme-color']")
    if (metaThemeColor) metaThemeColor.setAttribute('content', themeColor)
  }, [resolvedTheme])

  return (
    <IconTooltip label={t('theme.toggle')}>
      <AnimatedThemeToggler
        theme={resolvedTheme}
        onThemeChange={setTheme}
        label={t('theme.toggle')}
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'scale-95 rounded-full [&_svg]:size-[1.2rem]'
        )}
      />
    </IconTooltip>
  )
}
