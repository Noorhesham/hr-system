"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Check, ShieldCheck, Sparkles } from "lucide-react"

import { useAuth } from "@/hooks/use-auth"
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { FormInput } from "@/components/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { AuthFormShell } from "@/components/auth/auth-form-shell"
import { patchOnboardingDraft } from "@/lib/onboarding/draft"

const signupSchema = z
  .object({
    companyName: z
      .string()
      .min(2, "اسم المنشأة يجب أن يكون حرفين على الأقل")
      .max(120, "اسم المنشأة يجب ألا يتجاوز 120 حرفًا"),
    fullName: z
      .string()
      .min(2, "الاسم بالكامل يجب أن يكون حرفين على الأقل")
      .max(120, "الاسم يجب ألا يتجاوز 120 حرفًا"),
    email: z
      .string()
      .min(1, "البريد الإلكتروني مطلوب")
      .email("يرجى إدخال بريد إلكتروني صالح"),
    phone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^(\+?966|0)?5\d{8}$/.test(val.replace(/[\s-]/g, "")),
        "يرجى إدخال رقم جوال صالح (مثال: 05XXXXXXXX)",
      ),
    password: z
      .string()
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .regex(
        /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "يجب أن تحتوي كلمة المرور على حرف كبير، حرف صغير، ورقم",
      ),
    confirmPassword: z.string().min(1, "يرجى تأكيد كلمة المرور"),
    agreedToTerms: z.boolean().refine((val) => val === true, {
      message: "يجب الموافقة على الشروط والأحكام للمتابعة",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirmPassword"],
  })

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const { register: registerAccount, user, status } = useAuth()
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Redirect if already logged in
  React.useEffect(() => {
    if (status === "authenticated" && user) {
      if (user.onboardingStep != null && !user.onboardingCompletedAt) {
        router.replace("/onboarding/pricing")
      } else {
        router.replace("/dashboard")
      }
    }
  }, [status, user, router])

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      companyName: "",
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      agreedToTerms: false,
    },
    mode: "onChange",
  })

  const passwordValue = form.watch("password") || ""
  const hasMinLen = passwordValue.length >= 8
  const hasLower = /[a-z]/.test(passwordValue)
  const hasUpper = /[A-Z]/.test(passwordValue)
  const hasNumber = /\d/.test(passwordValue)

  async function onSubmit(values: SignupFormValues) {
    setFormError(null)
    setIsSubmitting(true)

    try {
      await registerAccount({
        companyName: values.companyName.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        fullName: values.fullName.trim(),
        phone: values.phone?.trim() || undefined,
        jobTitle: "مالك المنشأة",
      })

      // Sync onboarding draft state
      patchOnboardingDraft({
        company: {
          companyName: values.companyName.trim(),
          website: "",
          industry: "",
        },
        admin: {
          fullName: values.fullName.trim(),
          email: values.email.trim().toLowerCase(),
          phone: values.phone?.trim() || "",
          jobTitle: "مالك المنشأة",
        },
        registered: true,
      })

      toast.success("تم إنشاء الحساب بنجاح! مرحبًا بك في جاهز")
      router.push("/onboarding/pricing")
    } catch (err: unknown) {
      let message = "تعذر إنشاء الحساب، يرجى المحاولة مرة أخرى."
      if (err instanceof Error) {
        if (
          err.message.includes("already registered") ||
          err.message.includes("Conflict") ||
          err.message.includes("409")
        ) {
          message = "البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول أو استخدام بريد آخر."
        } else {
          message = err.message
        }
      }
      setFormError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "loading" || (status === "authenticated" && user)) {
    return (
      <AuthFormShell>
        <p className="text-center text-sm text-muted-foreground">جارٍ التحميل…</p>
      </AuthFormShell>
    )
  }

  return (
    <AuthFormShell className="py-8">
      <header className="mb-6 text-right">
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" />
          <span>ابدأ تجربتك المجانية لمدة 14 يومًا</span>
        </div>
        <h1 className="font-sans text-[28px] font-bold leading-tight text-foreground lg:text-[32px]">
          مرحبـــًا بك في{" "}
          <span className="text-primary">جاهز</span>
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          أنشئ حساب منشأتك الآن وابدأ في إدارة الموظفين والرواتب والحضور بكل سهولة.
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          {/* Company Name */}
          <FormInput
            name="companyName"
            label="اسم المنشأة / الشركة"
            placeholder="مثال: شركة جاهز للتقنية"
            formType="input"
            required
            disabled={isSubmitting}
          />

          {/* Full Name & Phone in 2 cols */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              name="fullName"
              label="الاسم بالكامل للمسؤول"
              placeholder="مثال: أحمد الحربي"
              formType="input"
              required
              disabled={isSubmitting}
            />
            <FormInput
              name="phone"
              label="رقم الجوال"
              placeholder="05XXXXXXXX"
              formType="input"
              disabled={isSubmitting}
            />
          </div>

          {/* Email */}
          <FormInput
            name="email"
            label="البريد الإلكتروني للعمل"
            placeholder="admin@company.com"
            inputType="email"
            formType="input"
            required
            disabled={isSubmitting}
          />

          {/* Password & Confirm in 2 cols */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              name="password"
              label="كلمة المرور"
              placeholder="••••••••"
              formType="input"
              password
              required
              disabled={isSubmitting}
            />
            <FormInput
              name="confirmPassword"
              label="تأكيد كلمة المرور"
              placeholder="••••••••"
              formType="input"
              password
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Password rules hints */}
          <div className="rounded-lg border border-border/80 bg-muted/40 p-3 text-xs text-muted-foreground">
            <p className="mb-1.5 font-medium text-foreground">متطلبات كلمة المرور:</p>
            <div className="grid grid-cols-2 gap-1.5">
              <span className={`inline-flex items-center gap-1 ${hasMinLen ? "font-medium text-emerald-600" : ""}`}>
                <Check className={`size-3.5 ${hasMinLen ? "opacity-100" : "opacity-30"}`} />
                8 أحرف على الأقل
              </span>
              <span className={`inline-flex items-center gap-1 ${hasNumber ? "font-medium text-emerald-600" : ""}`}>
                <Check className={`size-3.5 ${hasNumber ? "opacity-100" : "opacity-30"}`} />
                رقم واحد على الأقل
              </span>
              <span className={`inline-flex items-center gap-1 ${hasUpper ? "font-medium text-emerald-600" : ""}`}>
                <Check className={`size-3.5 ${hasUpper ? "opacity-100" : "opacity-30"}`} />
                حرف كبير بالإنجليزية (A-Z)
              </span>
              <span className={`inline-flex items-center gap-1 ${hasLower ? "font-medium text-emerald-600" : ""}`}>
                <Check className={`size-3.5 ${hasLower ? "opacity-100" : "opacity-30"}`} />
                حرف صغير بالإنجليزية (a-z)
              </span>
            </div>
          </div>

          {/* Terms checkbox */}
          <FormField
            control={form.control}
            name="agreedToTerms"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-start gap-2.5 pt-1">
                  <Checkbox
                    id="agreedToTerms"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor="agreedToTerms"
                    className="cursor-pointer text-xs leading-relaxed text-muted-foreground"
                  >
                    أوافق على{" "}
                    <span className="font-medium text-primary hover:underline">
                      الشروط والأحكام
                    </span>{" "}
                    و
                    <span className="font-medium text-primary hover:underline">
                      سياسة الخصوصية
                    </span>{" "}
                    الخاصة بمنصة جاهز.
                  </label>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {formError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {formError}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || !form.formState.isValid}
            className="mt-2 h-12 w-full rounded-[6px] bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:bg-[#c8c8c8] disabled:text-white disabled:opacity-100"
          >
            {isSubmitting ? "جارٍ إنشاء الحساب…" : "إنشاء الحساب والبدء"}
          </Button>

          <div className="mt-3 text-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟{" "}
            <Link
              href="/login"
              className="font-semibold text-primary hover:underline"
            >
              تسجيل الدخول
            </Link>
          </div>
        </form>
      </Form>
    </AuthFormShell>
  )
}
