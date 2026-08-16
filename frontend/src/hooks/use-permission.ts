"use client"

import { useAuth } from "@/hooks/use-auth"
import {
  COMPANY_OWNER_ROLE,
  type PermissionAction,
} from "@/lib/permissions"

/** Permission helpers for the current session user. */
export function usePermission() {
  const { user } = useAuth()

  function can(action: PermissionAction | PermissionAction[]) {
    if (!user) return false
    if (user.roleName === COMPANY_OWNER_ROLE || user.isPlatformAdmin) return true
    const list = Array.isArray(action) ? action : [action]
    const owned = user.permissions ?? []
    return list.some((p) => owned.includes(p))
  }

  return { can, user }
}
