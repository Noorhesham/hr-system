"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import {
  apiFetch,
  refreshAccessToken,
  setAccessToken,
} from "@/lib/api-client"
import type {
  AuthResponse,
  AuthStatus,
  AuthenticatedUser,
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
} from "@/types/auth"

type AuthContextValue = {
  user: AuthenticatedUser | null
  status: AuthStatus
  login: (payload: LoginPayload) => Promise<AuthenticatedUser>
  register: (payload: RegisterPayload) => Promise<AuthenticatedUser>
  logout: () => Promise<void>
  changePassword: (payload: ChangePasswordPayload) => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthenticatedUser | null>(null)
  const [status, setStatus] = React.useState<AuthStatus>("loading")
  const router = useRouter()
  const pathname = usePathname()

  const refreshSession = React.useCallback(async () => {
    const token = await refreshAccessToken()
    if (!token) {
      setUser(null)
      setStatus("unauthenticated")
      return
    }
    try {
      const me = await apiFetch<AuthenticatedUser>("/auth/me", {
        skipRefresh: true,
      })
      setUser({
        ...me,
        permissions: me.permissions ?? [],
      })
      setStatus("authenticated")
    } catch {
      setAccessToken(null)
      setUser(null)
      setStatus("unauthenticated")
    }
  }, [])

  React.useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  /**
   * Global onboarding lock: once finished, any /onboarding/* URL
   * (typed, bookmarked, or linked) redirects to the dashboard.
   */
  React.useEffect(() => {
    if (status !== "authenticated" || !user?.onboardingCompletedAt) return
    if (!pathname.startsWith("/onboarding")) return
    router.replace("/dashboard")
  }, [status, user?.onboardingCompletedAt, pathname, router])

  const login = React.useCallback(async (payload: LoginPayload) => {
    const data = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: payload,
      skipAuth: true,
      skipRefresh: true,
    })
    setAccessToken(data.accessToken)
    setUser({
      ...data.user,
      permissions: data.user.permissions ?? [],
    })
    setStatus("authenticated")
    return data.user
  }, [])

  const register = React.useCallback(async (payload: RegisterPayload) => {
    const data = await apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: payload,
      skipAuth: true,
      skipRefresh: true,
    })
    setAccessToken(data.accessToken)
    setUser({
      ...data.user,
      permissions: data.user.permissions ?? [],
    })
    setStatus("authenticated")
    return data.user
  }, [])

  const logout = React.useCallback(async () => {
    try {
      await apiFetch<{ success: boolean }>("/auth/logout", {
        method: "POST",
        skipRefresh: true,
      })
    } catch {
      // Always clear local session even if the server call fails.
    } finally {
      setAccessToken(null)
      setUser(null)
      setStatus("unauthenticated")
      router.replace("/login")
    }
  }, [router])

  const changePassword = React.useCallback(
    async (payload: ChangePasswordPayload) => {
      const data = await apiFetch<{ accessToken: string }>(
        "/auth/change-password",
        {
          method: "POST",
          body: payload,
        },
      )
      setAccessToken(data.accessToken)
    },
    [],
  )

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      login,
      register,
      logout,
      changePassword,
      refreshSession,
    }),
    [user, status, login, register, logout, changePassword, refreshSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
