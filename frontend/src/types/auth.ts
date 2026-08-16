/** Mirrors backend AuthenticatedUser (jwt.strategy.ts). */
export type AuthenticatedUser = {
  userId: string
  email: string
  companyId: string
  roleId: string
  roleName: string
  /** Permission actions from the user's role (Owner may have all). */
  permissions: string[]
  isPlatformAdmin: boolean
  isPortalUser: boolean
  employeeId: string | null
  /** Backend OnboardingStep enum value; null for legacy / portal users. */
  onboardingStep:
    | "PRICING"
    | "ATTENDANCE"
    | "PAYROLL"
    | "BENEFITS"
    | "EMPLOYEES"
    | "COMPLETE"
    | null
  onboardingCompletedAt: string | null
  fullName: string | null
  phone: string | null
  jobTitle: string | null
  planId: string | null
  subscriptionStatus: "TRIAL" | "ACTIVE" | "PAST_DUE" | "SUSPENDED" | null
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  companyName: string
  email: string
  password: string
  establishmentNumber?: string
  planId?: string
  fullName?: string
  phone?: string
  jobTitle?: string
}

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
}

export type ForgotPasswordPayload = {
  email: string
}

export type VerifyResetOtpPayload = {
  email: string
  code: string
}

export type ResetPasswordPayload = {
  resetToken: string
  newPassword: string
}

/** POST /auth/login | /auth/register response body. */
export type AuthResponse = {
  accessToken: string
  user: AuthenticatedUser
}

export type RefreshResponse = {
  accessToken: string
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated"
