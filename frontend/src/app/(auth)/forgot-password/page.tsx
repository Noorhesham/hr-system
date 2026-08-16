"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { TriangleAlert, XIcon, KeyRound } from "lucide-react"

import { useAppMutation } from "@/lib/query/useAppMutation"
import {
  getForgotPasswordEmail,
  maskEmail,
  requestPasswordReset,
  setForgotPasswordEmail,
  setForgotPasswordResetToken,
  verifyResetOtp,
} from "@/lib/auth/forgot-password"
import { ApiError } from "@/lib/api-client"
import { Form } from "@/components/ui/form"
import { FormInput } from "@/components/form"
import { Button } from "@/components/ui/button"
import { AuthBackLink, AuthFormShell } from "@/components/auth/auth-form-shell"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

const emailSchema = z.object({
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("أدخل بريدًا إلكترونيًا صالحًا"),
})

type EmailFormValues = z.infer<typeof emailSchema>

const RESEND_SECONDS = 60

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [otpOpen, setOtpOpen] = React.useState(false)
  const [pendingEmail, setPendingEmail] = React.useState("")
  const [otp, setOtp] = React.useState("")
  const [otpError, setOtpError] = React.useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = React.useState(0)
  const [devOtpHint, setDevOtpHint] = React.useState<string | null>(null)

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: getForgotPasswordEmail() ?? "" },
    mode: "onChange",
  })

  React.useEffect(() => {
    if (secondsLeft <= 0) return
    const id = window.setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [secondsLeft])

  const requestCodeMutation = useAppMutation<
    { success: true; message: string; devOtp?: string },
    string
  >({
    mutationFn: (email) => requestPasswordReset(email),
    showErrorToast: true,
    errorFallback: "تعذر إرسال الرمز",
    showSuccessToast: false,
    onSuccess: (data) => {
      setConfirmOpen(false)
      setOtp("")
      setOtpError(null)
      setDevOtpHint(data.devOtp ?? null)
      setSecondsLeft(RESEND_SECONDS)
      setOtpOpen(true)
    },
  })

  const verifyOtpMutation = useAppMutation<
    { resetToken: string },
    { email: string; code: string }
  >({
    mutationFn: ({ email, code }) => verifyResetOtp(email, code),
    showErrorToast: false,
    errorFallback: "رمز التحقق غير صحيح",
    onSuccess: (data) => {
      setForgotPasswordResetToken(data.resetToken)
      setOtpOpen(false)
      router.push("/reset-password")
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : err.message || "رمز التحقق غير صحيح"
      setOtpError(message)
    },
  })

  function onEmailSubmit(values: EmailFormValues) {
    const email = values.email.trim().toLowerCase()
    setPendingEmail(email)
    setForgotPasswordEmail(email)
    setConfirmOpen(true)
  }

  function handleConfirmSend() {
    requestCodeMutation.mutate(pendingEmail)
  }

  function handleResend() {
    if (secondsLeft > 0 || !pendingEmail) return
    requestCodeMutation.mutate(pendingEmail)
  }

  function handleVerify() {
    setOtpError(null)
    verifyOtpMutation.mutate({ email: pendingEmail, code: otp })
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0")
  const ss = String(secondsLeft % 60).padStart(2, "0")

  return (
    <AuthFormShell>
      <AuthBackLink className="mb-8 self-start" />

      <header className="mb-8 text-right">
        <h1 className="font-sans text-[32px] font-bold leading-none text-foreground">
          نسيت كلمة{" "}
          <span className="text-primary">المــــــــرور؟</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          أدخل البريد الالكتروني المسجل لدينا، وسنرسل إليك رمز تحقق لإعادة تعيين
          كلمة المرور.
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onEmailSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <FormInput
            name="email"
            label="البريد الالكتروني"
            placeholder="ahmed.salem@nejaz.com"
            inputType="email"
            formType="input"
            required
            disabled={requestCodeMutation.isPending}
          />

          <Button
            type="submit"
            disabled={!form.formState.isValid || requestCodeMutation.isPending}
            className="mt-2 h-12 w-full rounded-[6px] bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:bg-[#c8c8c8] disabled:text-white disabled:opacity-100"
          >
            إرسال الرمز
          </Button>
        </form>
      </Form>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="max-w-[400px] gap-5 rounded-2xl p-6 sm:max-w-[400px]">
          <button
            type="button"
            className="absolute start-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
            onClick={() => setConfirmOpen(false)}
            aria-label="إغلاق"
          >
            <XIcon className="size-4" />
          </button>

          <AlertDialogHeader className="place-items-center gap-3 text-center sm:place-items-center sm:text-center">
            <AlertDialogMedia className="mb-0 size-12 rounded-xl bg-[#FFF0E6] text-[#E07A3A]">
              <TriangleAlert className="size-6" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-center text-base font-bold leading-relaxed">
              سيتم إرسال رمز التحقق إلى البريد الإلكتروني
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base font-semibold text-foreground">
              {maskEmail(pendingEmail)}
            </AlertDialogDescription>
            <p className="text-center text-sm text-muted-foreground">
              هل ترغب في المتابعة؟
            </p>
          </AlertDialogHeader>

          <AlertDialogFooter className="mx-0 mb-0 grid grid-cols-2 gap-3 border-0 bg-transparent p-0 sm:flex-row">
            <AlertDialogAction
              className="h-11 rounded-[6px] bg-primary hover:bg-primary/90"
              disabled={requestCodeMutation.isPending}
              onClick={(e) => {
                e.preventDefault()
                handleConfirmSend()
              }}
            >
              {requestCodeMutation.isPending ? "جارٍ الإرسال…" : "إرسال الرمز"}
            </AlertDialogAction>
            <AlertDialogCancel
              className="h-11 rounded-[6px]"
              disabled={requestCodeMutation.isPending}
            >
              تعديل البريد الإلكتروني
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={otpOpen} onOpenChange={setOtpOpen}>
        <DialogContent
          className="max-w-[420px] gap-5 rounded-2xl p-6 sm:max-w-[420px]"
          showCloseButton
        >
          <DialogHeader className="items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-[#EEF0FF] text-[#3B4CCA]">
              <KeyRound className="size-6" />
            </div>
            <DialogTitle className="text-lg font-bold">
              التحقق من الرمز
            </DialogTitle>
            <DialogDescription className="text-center text-sm leading-relaxed">
              أدخل رمز التحقق المكون من 6 أرقام الذي تم إرساله إلى البريد
              الإلكتروني الخاص بك
            </DialogDescription>
          </DialogHeader>

          {devOtpHint && (
            <p
              className="rounded-[6px] bg-muted px-3 py-2 text-center text-xs text-muted-foreground"
              dir="ltr"
            >
              Dev OTP:{" "}
              <span className="font-mono font-semibold">{devOtpHint}</span>
            </p>
          )}

          <div className="flex flex-col items-center gap-4" dir="ltr">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(v) => {
                setOtp(v)
                setOtpError(null)
              }}
              containerClassName="justify-center gap-2"
            >
              <InputOTPGroup className="gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className="size-11 rounded-[6px] border border-input text-base first:rounded-[6px] first:border last:rounded-[6px]"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            {otpError && (
              <p className="text-sm font-medium text-destructive" role="alert">
                {otpError}
              </p>
            )}
          </div>

          <Button
            type="button"
            className="h-12 w-full rounded-[6px] bg-primary text-base font-semibold hover:bg-primary/90"
            disabled={otp.length !== 6 || verifyOtpMutation.isPending}
            onClick={handleVerify}
          >
            {verifyOtpMutation.isPending ? "جارٍ التحقق…" : "التحقق من الرمز"}
          </Button>

          <p className="text-center text-sm text-muted-foreground" dir="rtl">
            {secondsLeft > 0 ? (
              <>
                إعادة الإرسال خلال {mm}:{ss}
              </>
            ) : (
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={handleResend}
                disabled={requestCodeMutation.isPending}
              >
                إعادة إرسال الرمز
              </button>
            )}
          </p>
        </DialogContent>
      </Dialog>
    </AuthFormShell>
  )
}
