import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, Outlet, useNavigate } from '@tanstack/react-router'
import { LayoutDashboard, Menu, ShoppingCart, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Logo } from '@/assets/logo'
import { meQueryOptions } from '@/api/auth'
import { useAuthStore } from '@/stores/auth-store'
import { useCartStore } from '@/stores/cart-store'
import { isStaff } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { IconTooltip } from '@/components/icon-tooltip'
import { LanguageSwitch } from '@/components/language-switch'
import { SignOutDialog } from '@/components/sign-out-dialog'
import { ThemeSwitch } from '@/components/theme-switch'
import { NotificationsBell } from './notifications-bell'
import { SiteNav } from './site-nav'

const NAV = [
  { to: '/catalog', key: 'site.nav.catalog' },
  { to: '/send', key: 'site.nav.send' },
  { to: '/orders', key: 'site.nav.orders' },
] as const

/** Client platform shell: header with navigation, cart and account. */
export function SiteLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.accessToken)
  // Public pages: an expired token must not throw the visitor to sign-in
  const me = useQuery({
    ...meQueryOptions(),
    enabled: !!token,
    meta: { publicPage: true },
  })
  const user = token ? me.data : undefined
  const cartCount = useCartStore((s) =>
    s.lines.reduce((n, l) => n + l.quantity, 0)
  )
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const links = (onClick?: () => void) =>
    NAV.map((item) => (
      <Link
        key={item.to}
        to={item.to}
        onClick={onClick}
        className='rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground [&.active]:text-foreground'
      >
        {t(item.key)}
      </Link>
    ))

  return (
    <div className='flex min-h-svh flex-col'>
      <header className='sticky top-0 z-40 border-b bg-background/90 backdrop-blur'>
        <div className='mx-auto flex h-16 max-w-6xl items-center gap-2 px-4'>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <IconTooltip label={t('site.menu')}>
              <SheetTrigger asChild>
                <Button variant='ghost' size='icon' className='md:hidden'>
                  <Menu />
                  <span className='sr-only'>{t('site.menu')}</span>
                </Button>
              </SheetTrigger>
            </IconTooltip>
            <SheetContent side='left' className='w-64 p-4'>
              <SheetTitle>{t('common.appName')}</SheetTitle>
              <nav className='mt-4 grid'>{links(() => setMenuOpen(false))}</nav>
            </SheetContent>
          </Sheet>
          <Link to='/' className='flex items-center gap-2 font-semibold'>
            <Logo />
            <span className='max-sm:hidden'>{t('common.appName')}</span>
          </Link>
          <SiteNav />

          <div className='ms-auto flex items-center gap-1'>
            <LanguageSwitch />
            <ThemeSwitch />
            <IconTooltip label={t('site.nav.cart')}>
              <Button
                asChild
                variant='ghost'
                size='icon'
                className='relative rounded-full'
              >
                <Link to='/cart'>
                  <ShoppingCart />
                  {cartCount > 0 && (
                    <span className='absolute end-0.5 top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground'>
                      {cartCount}
                    </span>
                  )}
                  <span className='sr-only'>{t('site.nav.cart')}</span>
                </Link>
              </Button>
            </IconTooltip>
            {user && !isStaff(user) && <NotificationsBell />}
            {user && isStaff(user) && (
              <Button asChild variant='outline' size='sm'>
                <Link to='/admin'>
                  <LayoutDashboard /> {t('common.adminPanel')}
                </Link>
              </Button>
            )}
            {user && !isStaff(user) && (
              <DropdownMenu modal={false}>
                <IconTooltip label={t('site.account')}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='rounded-full'
                    >
                      <User />
                      <span className='sr-only'>{t('site.account')}</span>
                    </Button>
                  </DropdownMenuTrigger>
                </IconTooltip>
                <DropdownMenuContent align='end' className='w-56'>
                  <DropdownMenuLabel className='font-normal'>
                    <div className='font-medium'>
                      {user.full_name || user.phone}
                    </div>
                    <div className='font-mono text-xs text-muted-foreground'>
                      {user.client_code}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to='/account'>{t('site.account')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to='/orders'>{t('site.nav.orders')}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant='destructive'
                    onClick={() => setSigningOut(true)}
                  >
                    {t('auth.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {!user && (
              <InteractiveHoverButton
                type='button'
                className='ms-1 py-1.5 text-sm'
                onClick={() => navigate({ to: '/sign-in' })}
              >
                {t('site.signIn')}
              </InteractiveHoverButton>
            )}
          </div>
        </div>
      </header>

      <main className='mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-10'>
        <Outlet />
      </main>

      <footer className='border-t'>
        <div className='mx-auto flex max-w-6xl flex-wrap justify-between gap-2 px-4 py-6 text-sm text-muted-foreground'>
          <span>
            © {new Date().getFullYear()} {t('common.appName')}
          </span>
          <Link to='/admin' className='hover:text-foreground'>
            {t('landing.staffLogin')}
          </Link>
        </div>
      </footer>
      <SignOutDialog
        open={signingOut}
        onOpenChange={setSigningOut}
        redirectTo='/'
      />
    </div>
  )
}
