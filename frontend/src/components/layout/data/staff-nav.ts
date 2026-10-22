import { type LinkProps } from '@tanstack/react-router'
import { type ru } from '@/locales/ru'
import {
  Bike,
  Calculator,
  Coins,
  Contact,
  Globe,
  Inbox,
  LayoutDashboard,
  MessageSquareText,
  Package,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserPlus,
  Users,
  Warehouse,
} from 'lucide-react'
import { type Section } from '@/lib/permissions'

export type StaffNavItem = {
  section: Section
  url: LinkProps['to']
  icon: React.ElementType
}

export type StaffNavGroup = {
  group: keyof typeof ru.nav.groups
  items: StaffNavItem[]
}

// Sidebar of the admin panel. Items the current user cannot open are
// filtered out by useStaffNav (see lib/permissions.ts).
export const staffNav: StaffNavGroup[] = [
  {
    group: 'main',
    items: [{ section: 'dashboard', url: '/admin', icon: LayoutDashboard }],
  },
  {
    group: 'work',
    items: [
      { section: 'leads', url: '/admin/leads', icon: Inbox },
      { section: 'orders', url: '/admin/orders', icon: Package },
      { section: 'shipments', url: '/admin/shipments', icon: Truck },
      { section: 'calculator', url: '/admin/calculator', icon: Calculator },
    ],
  },
  {
    group: 'warehouse',
    items: [
      { section: 'tariffs', url: '/admin/tariffs', icon: Coins },
      { section: 'courier_tariffs', url: '/admin/courier-tariffs', icon: Bike },
      { section: 'catalog', url: '/admin/catalog', icon: ShoppingBag },
      { section: 'workers', url: '/admin/workers', icon: Users },
    ],
  },
  {
    group: 'customers',
    items: [
      { section: 'clients', url: '/admin/clients', icon: Contact },
      { section: 'reviews', url: '/admin/reviews', icon: MessageSquareText },
    ],
  },
  {
    group: 'system',
    items: [
      { section: 'countries', url: '/admin/countries', icon: Globe },
      { section: 'warehouses', url: '/admin/warehouses', icon: Warehouse },
      { section: 'admins', url: '/admin/admins', icon: ShieldCheck },
      { section: 'user_requests', url: '/admin/user-requests', icon: UserPlus },
    ],
  },
]
