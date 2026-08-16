"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check } from "lucide-react"

import { useAppMutation } from "@/lib/query/useAppMutation"
import {
  clearForgotPasswordSession,
  getForgotPasswordResetToken,
  isForgotPasswordVerified,
  resetPassword,
} from "@/lib/auth/forgot-password"
import { Form } from "@/components/ui/form"
import { FormInput } from "@/components/form"
import { Button } from "@/components/ui/button"
import { AuthBackLink, AuthFormShell } from "@/components/auth/auth-form-shell"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .regex(
        /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "يجب أن تحتوي على حرف صغير وكبير ورقم",
      ),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

const REDIRECT_MS = 2500

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = React.useState(false)
  const [successOpen, setSuccessOpen] = React.useState(false)

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onChange",
  })

  React.useEffect(() => {
    if (!isForgotPasswordVerified()) {
      router.replace("/forgot-password")
      return
    }
    setReady(true)
  }, [router])

  const resetMutation = useAppMutation<
    { success: true },
    { resetToken: string; password: string }
  >({
    mutationFn: ({ resetToken, password }) =>
      resetPassword(resetToken, password),
    showErrorToast: true,
    errorFallback: "تعذر تغيير كلمة المرور",
    showSuccessToast: false,
    onSuccess: () => {
      clearForgotPasswordSession()
      setSuccessOpen(true)
    },
  })

  React.useEffect(() => {
    if (!successOpen) return
    const id = window.setTimeout(() => {
      router.replace("/login")
    }, REDIRECT_MS)
    return () => window.clearTimeout(id)
  }, [successOpen, router])

  if (!ready) {
    return (
      <AuthFormShell>
        <p className="text-center text-sm text-muted-foreground">جارٍ التحميل…</p>
      </AuthFormShell>
    )
  }

  const busy = resetMutation.isPending || successOpen

  return (
    <AuthFormShell>
      {/* Screen 1 — reset form */}
      <AuthBackLink href="/forgot-password" className="mb-8 self-start" />

      <header className="mb-8 text-right">
        <h1 className="font-sans text-[32px] font-bold leading-[1.2] text-foreground">
          إعادة تعيين كلمة{" "}
          <span className="text-primary">المــــــــرور؟</span>
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          أنشئ كلمة مرور جديدة لحسابك. احرص على اختيار كلمة مرور قوية للحفاظ على
          أمان حسابك.
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => {
            const resetToken = getForgotPasswordResetToken()
            if (!resetToken) {
              router.replace("/forgot-password")
              return
            }
            resetMutation.mutate({
              resetToken,
              password: values.password,
            })
          })}
          className="flex flex-col gap-5"
          noValidate
        >
          <FormInput
            name="password"
            label="كلمة المرور"
            placeholder="أدخل كلمة المرور"
            formType="input"
            password
            required
            disabled={busy}
          />

          <FormInput
            name="confirmPassword"
            label="تأكيد كلمة المرور"
            placeholder="أعد إدخال كلمة المرور"
            formType="input"
            password
            required
            disabled={busy}
          />

          <Button
            type="submit"
            disabled={!form.formState.isValid || busy}
            className="mt-2 h-12 w-full rounded-[6px] bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:bg-[#c8c8c8] disabled:text-white disabled:opacity-100"
          >
            {resetMutation.isPending
              ? "جارٍ التغيير…"
              : "تغيير كلمة المرور"}
          </Button>
        </form>
      </Form>

      {/* Screen 2 — success modal, then auto-redirect to login */}
      <AlertDialog
        open={successOpen}
        onOpenChange={(open) => {
          // Keep open until redirect — no manual dismiss
          if (open) setSuccessOpen(true)
        }}
      >
        <AlertDialogContent
          overlayClassName="bg-black/45 supports-backdrop-filter:backdrop-blur-[2px]"
          className="max-w-[340px] gap-3 rounded-2xl px-6 py-8 shadow-xl sm:max-w-[340px]"
        >
          <AlertDialogHeader className="place-items-center gap-4 text-center sm:place-items-center sm:text-center">
            <AlertDialogMedia className="mb-0 size-14 rounded-full bg-primary text-white shadow-sm">
              <Check className="size-7" strokeWidth={2.75} />
            </AlertDialogMedia>
            <div className="space-y-2">
              <AlertDialogTitle className="text-center text-base font-bold leading-relaxed text-foreground">
                تم تغيير كلمة المرور بنجاح
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-sm leading-relaxed text-muted-foreground">
                سيتم نقلك إلى صفحة تسجيل الدخول تلقائياً
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </AuthFormShell>
  )
}
