"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { useAuth } from "@/hooks/use-auth"
import { useAppMutation } from "@/lib/query/useAppMutation"
import { ApiError } from "@/lib/api-client"
import type { AuthenticatedUser, LoginPayload } from "@/types/auth"
import { Form } from "@/components/ui/form"
import { FormInput } from "@/components/form"
import { Button } from "@/components/ui/button"
import { AuthFormShell } from "@/components/auth/auth-form-shell"
import { resumeRouteForUser } from "@/lib/onboarding/steps"
import { getLocalOnboardingStep } from "@/lib/onboarding/draft"

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("أدخل بريدًا إلكترونيًا صالحًا"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
})

type LoginFormValues = z.infer<typeof loginSchema>

function resumePath(user: AuthenticatedUser) {
  return resumeRouteForUser({
    onboardingStep: user.onboardingStep,
    onboardingCompletedAt: user.onboardingCompletedAt,
    localStep: getLocalOnboardingStep(),
  })
}

export default function LoginPage() {
  const { login, status, user } = useAuth()
  const router = useRouter()
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  })

  React.useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(resumePath(user))
    }
  }, [status, user, router])

  const loginMutation = useAppMutation<AuthenticatedUser, LoginPayload>({
    mutationFn: (values) => login(values),
    showErrorToast: false,
    errorFallback: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    showSuccessToast: "تم تسجيل الدخول بنجاح",
    onSuccess: (loggedIn) => {
      setFormError(null)
      router.replace(resumePath(loggedIn))
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : "البريد الإلكتروني أو كلمة المرور غير صحيحة"
      setFormError(message)
      form.setError("email", { message: " " })
      form.setError("password", { message: " " })
    },
  })

  const isBusy = status === "authenticated" || loginMutation.isPending

  if (status === "authenticated") {
    return (
      <AuthFormShell>
        <p className="text-center text-sm text-muted-foreground">جارٍ التحويل…</p>
      </AuthFormShell>
    )
  }

  return (
    <AuthFormShell>
      <header className="mb-8 text-right">
        <h1 className="font-sans text-[32px] font-bold leading-none text-foreground">
          مرحبـــًا بك في{" "}
          <span className="text-primary">نجــــــــاز</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          سجل الدخول للوصول إلى حسابك وإدارة أعمالك بسهولة وأمان.
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => {
            setFormError(null)
            loginMutation.mutate(values)
          })}
          className="flex flex-col gap-4"
          noValidate
        >
          <FormInput
            name="email"
            label="البريد الإلكتروني"
            placeholder="ahmed.salem@nejaz.com"
            inputType="email"
            formType="input"
            required
            disabled={isBusy}
          />

          <FormInput
            name="password"
            label="كلمة المرور"
            placeholder="أدخل كلمة المرور"
            formType="input"
            password
            required
            disabled={isBusy}
          />

          {formError && (
            <p className="text-sm font-medium text-destructive" role="alert">
              {formError}
            </p>
          )}

          <div className="flex justify-start">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              نسيت كلمة المرور؟
            </Link>
          </div>

          <Button
            type="submit"
            disabled={isBusy || !form.formState.isValid}
            className="mt-2 h-12 w-full rounded-[6px] bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:bg-[#c8c8c8] disabled:text-white disabled:opacity-100"
          >
            {loginMutation.isPending ? "جارٍ الدخول…" : "تسجيل الدخول"}
          </Button>
        </form>
      </Form>
    </AuthFormShell>
  )
}
