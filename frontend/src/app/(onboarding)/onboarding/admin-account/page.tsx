"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Form } from "@/components/ui/form"
import { FormInput } from "@/components/form"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"
import { OnboardingFooter } from "@/components/onboarding/onboarding-footer"
import { useAuth } from "@/hooks/use-auth"
import { apiFetch, ApiError } from "@/lib/api-client"
import {
  getOnboardingDraft,
  patchOnboardingDraft,
  setLocalOnboardingStep,
} from "@/lib/onboarding/draft"

const adminAccountSchema = z
  .object({
    jobTitle: z.string().min(1, "المسمى الوظيفي مطلوب"),
    fullName: z.string().min(1, "الاسم الكامل مطلوب"),
    phone: z
      .string()
      .min(1, "رقم الجوال مطلوب")
      .refine((val) => {
        const digits = val.replace(/\D/g, "")
        return digits.length >= 8 && digits.length <= 15
      }, "أدخل رقم جوال صحيح"),
    email: z
      .string()
      .min(1, "البريد الإلكتروني مطلوب")
      .email("أدخل بريدًا إلكترونيًا صالحًا"),
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

type AdminAccountValues = z.infer<typeof adminAccountSchema>

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[6px] bg-[#EAF7EA] px-4 py-2 text-sm font-bold text-primary">
      {children}
    </div>
  )
}

export default function OnboardingAdminAccountPage() {
  const router = useRouter()
  const { register, login, user, status } = useAuth()
  const draft = getOnboardingDraft()
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(true)
  const [agreedToTerms, setAgreedToTerms] = React.useState(false)
  const [pending, setPending] = React.useState(false)

  // Redirect if already authenticated or registered
  React.useEffect(() => {
    if (status === "authenticated" || user != null || draft.registered) {
      router.replace("/onboarding/pricing")
      return
    }
    if (!draft.company?.companyName) {
      router.replace("/onboarding/company-profile")
    }
  }, [status, user, draft.registered, draft.company?.companyName, router])

  const form = useForm<AdminAccountValues>({
    resolver: zodResolver(adminAccountSchema),
    defaultValues: {
      jobTitle: draft.admin?.jobTitle ?? "",
      fullName: draft.admin?.fullName ?? "",
      phone: draft.admin?.phone ?? "",
      email: draft.admin?.email ?? "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  })

  // If already logged in, show loader while redirecting to avoid flashing the form
  if (status === "loading" || status === "authenticated" || user != null || draft.registered) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-4 p-12 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">جاري المتابعة إلى الخطوة التالية...</p>
      </div>
    )
  }

  async function onSubmit(values: AdminAccountValues) {
    const company = getOnboardingDraft().company
    if (!company?.companyName) {
      router.replace("/onboarding/company-profile")
      return
    }

    setPending(true)
    try {
      await register({
        companyName: company.companyName,
        email: values.email.trim().toLowerCase(),
        password: values.password,
        fullName: values.fullName,
        phone: values.phone,
        jobTitle: values.jobTitle,
      })

      const logoUrl = company.logoUrl

      try {
        await apiFetch("/company", {
          method: "PATCH",
          body: {
            name: company.companyName,
            website: company.website,
            industry: company.industry,
            ...(logoUrl ? { logoUrl } : {}),
          },
        })
      } catch {}

      patchOnboardingDraft({
        company: { ...company, logoUrl },
        admin: {
          fullName: values.fullName,
          jobTitle: values.jobTitle,
          email: values.email,
          phone: values.phone,
        },
        registered: true,
      })
      setLocalOnboardingStep("pricing")

      toast.success("تم إنشاء الحساب بنجاح")
      router.push("/onboarding/pricing")
    } catch (err: unknown) {
      const isAlreadyRegistered =
        (err instanceof ApiError && err.status === 409) ||
        (err instanceof Error &&
          (err.message.includes("already registered") ||
            err.message.includes("مسجل بالفعل") ||
            err.message.includes("Conflict") ||
            err.message.includes("409")))

      if (isAlreadyRegistered) {
        try {
          // Email already exists - attempt automatic login with the provided credentials!
          await login({
            email: values.email.trim().toLowerCase(),
            password: values.password,
          })

          const logoUrl = company.logoUrl
          try {
            await apiFetch("/company", {
              method: "PATCH",
              body: {
                name: company.companyName,
                website: company.website,
                industry: company.industry,
                ...(logoUrl ? { logoUrl } : {}),
              },
            })
          } catch {}

          patchOnboardingDraft({
            company: { ...company, logoUrl },
            admin: {
              fullName: values.fullName,
              jobTitle: values.jobTitle,
              email: values.email,
              phone: values.phone,
            },
            registered: true,
          })
          setLocalOnboardingStep("pricing")

          toast.success("تم تسجيل الدخول واستكمال الخطوات بنجاح")
          router.push("/onboarding/pricing")
          return
        } catch {
          toast.error(
            "هذا البريد الإلكتروني مسجل بالفعل ولكن كلمة المرور غير مطابقة. يمكنك تسجيل الدخول بحسابك للمتابعة.",
          )
          return
        }
      }

      toast.error(
        err instanceof Error ? err.message : "تعذر إنشاء الحساب",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <OnboardingShell step={3}>
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          إنشاء حساب مسؤول النظام
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          سيكون هذا الحساب هو المسؤول الرئيسي عن إدارة الشركة والموظفين
          والإعدادات والصلاحيات داخل النظام.
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
          noValidate
        >
          <SectionLabel>البيانات الشخصية</SectionLabel>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              name="jobTitle"
              label="المسمى الوظيفي"
              placeholder="مثال: مدير الموارد البشرية"
              formType="input"
              required
            />
            <FormInput
              name="fullName"
              label="الاسم الكامل"
              placeholder="ادخل اسمك الكامل"
              formType="input"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              name="phone"
              label="رقم الجوال"
              placeholder="50 123 4567"
              formType="phone"
              required
            />
            <FormInput
              name="email"
              label="البريد الالكتروني"
              placeholder="admin@company.com"
              formType="input"
              inputType="email"
              required
            />
          </div>

          <SectionLabel>إعداد كلمة المرور</SectionLabel>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              name="password"
              label="كلمة المرور"
              placeholder="أدخل كلمة المرور"
              formType="input"
              password
              required
            />
            <FormInput
              name="confirmPassword"
              label="تأكيد كلمة المرور"
              placeholder="أعد إدخال كلمة المرور"
              formType="input"
              password
              required
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-[6px] border border-border p-4">
            <div>
              <p className="font-medium text-foreground">
                تفعيل المصادقة الثنائية (2FA)
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                تساعد المصادقة الثنائية في حماية حسابك من الوصول غير المصرح
                به. (سيتم تفعيلها من الإعدادات لاحقاً)
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={setTwoFactorEnabled}
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-foreground">
            <Checkbox
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              className="mt-0.5"
            />
            <span>
              أوافق على{" "}
              <a href="#" className="text-primary underline">
                الشروط والأحكام
              </a>{" "}
              و
              <a href="#" className="text-primary underline">
                سياسة الخصوصية
              </a>{" "}
              الخاصة بمنصة جاهـــــز.
            </span>
          </label>

          <OnboardingFooter
            onBack={() => router.push("/onboarding/company-profile")}
            nextType="submit"
            nextDisabled={!form.formState.isValid || !agreedToTerms}
            nextPending={pending}
          />

          <div className="text-center text-sm text-muted-foreground">
            لديك حساب بالفعل؟{" "}
            <Link
              href="/login"
              className="font-semibold text-primary underline hover:text-primary/80"
            >
              تسجيل الدخول
            </Link>
          </div>
        </form>
      </Form>
    </OnboardingShell>
  )
}
