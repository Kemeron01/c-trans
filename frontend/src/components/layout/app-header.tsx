import { ConfigDrawer } from '@/components/config-drawer'
import { LanguageSwitch } from '@/components/language-switch'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Header } from './header'

/** Standard header of admin panel pages. */
export function AppHeader() {
  return (
    <Header fixed>
      <Search className='me-auto' />
      <LanguageSwitch />
      <ThemeSwitch />
      <ConfigDrawer />
    </Header>
  )
}
