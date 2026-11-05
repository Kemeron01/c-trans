import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { publicWarehousesQuery } from '@/api/account'
import { useLocalized } from '@/hooks/use-localized'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'

const ITEM = 'grid gap-0.5 rounded-md p-3 text-sm hover:bg-accent'

/** Desktop navigation of the site header (the mobile one is a Sheet). */
export function SiteNav() {
  const { t } = useTranslation()
  const localized = useLocalized()
  const foreign = (useQuery(publicWarehousesQuery()).data ?? []).filter(
    (w) => w.kind === 'foreign'
  )
  const help = [
    { hash: 'calculator', label: t('nav.sections.calculator') },
    { hash: 'how', label: t('landing.howTitle') },
    { hash: 'faq', label: t('landing.faqTitle') },
  ]

  return (
    <NavigationMenu className='ms-4 max-md:hidden'>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>{t('site.nav.catalog')}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className='grid w-64 gap-1'>
              <li>
                <NavigationMenuLink asChild>
                  <Link to='/catalog' className={ITEM}>
                    <span className='font-medium'>
                      {t('siteNav.allCountries')}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {t('siteNav.catalogHint')}
                    </span>
                  </Link>
                </NavigationMenuLink>
              </li>
              {foreign.map((w) => (
                <li key={w.id}>
                  <NavigationMenuLink asChild>
                    <Link
                      to='/catalog'
                      search={{ warehouse: w.id }}
                      className={ITEM}
                    >
                      <span className='font-medium'>
                        {localized(w.country)}
                      </span>
                      <span className='text-xs text-muted-foreground'>
                        {w.city}
                      </span>
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link to='/send'>{t('site.nav.send')}</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
            <Link to='/orders'>{t('site.nav.orders')}</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>{t('siteNav.help')}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className='grid w-56 gap-1'>
              {help.map((h) => (
                <li key={h.hash}>
                  <NavigationMenuLink asChild>
                    <Link to='/' hash={h.hash} className={ITEM}>
                      {h.label}
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
