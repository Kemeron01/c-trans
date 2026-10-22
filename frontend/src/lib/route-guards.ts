import { AxiosError } from 'axios'
import { type QueryClient } from '@tanstack/react-query'
import { type ParsedLocation, redirect } from '@tanstack/react-router'
import { meQueryOptions } from '@/api/auth'
import { type CurrentUser } from '@/api/types'
import { useAuthStore } from '@/stores/auth-store'
import { staffNav } from '@/components/layout/data/staff-nav'
import { canAccess, isStaff, type Section } from './permissions'

function toStaffSignIn(location: ParsedLocation) {
  return redirect({
    to: '/admin/sign-in',
    search: { redirect: location.href },
  })
}

/** beforeLoad of the /admin layout: signed-in staff only. */
export async function loadStaffUser(
  queryClient: QueryClient,
  location: ParsedLocation
): Promise<CurrentUser> {
  if (!useAuthStore.getState().accessToken) throw toStaffSignIn(location)

  let user: CurrentUser
  try {
    user = await queryClient.ensureQueryData(meQueryOptions())
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 401) {
      useAuthStore.getState().reset()
      throw toStaffSignIn(location)
    }
    throw error
  }

  if (!isStaff(user)) throw redirect({ to: '/403' })
  return user
}

/** beforeLoad of a section route. */
export function requireSection(user: CurrentUser, section: Section) {
  if (!canAccess(user, section)) throw redirect({ to: '/403' })
}

/** First sidebar item the user can open: where /admin sends a worker. */
export function firstAllowedUrl(user: CurrentUser) {
  return staffNav
    .flatMap((group) => group.items)
    .find((item) => canAccess(user, item.section))?.url
}
