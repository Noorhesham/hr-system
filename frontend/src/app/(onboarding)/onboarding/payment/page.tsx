"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Check,
  CheckCircle2,
  Download,
  Info,
  Loader2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { BillingHeader } from "@/components/onboarding/billing-header"
import { Form } from "@/components/ui/form"
import { FormInput } from "@/components/form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiError, apiFetch } from "@/lib/api-client"
import { advanceOnboardingTo } from "@/lib/onboarding/advance"
import {
  clearLastSubscription,
  getLastSubscription,
  getSelectedPlan,
  setLastSubscription,
  setLocalOnboardingStep,
  type SubscriptionResultDraft,
} from "@/lib/onboarding/draft"
import {
  PLAN_UI_CONFIG,
  SUPPORT_MAILTO,
  formatEmployeeCap,
  formatSar,
  priceForCycle,
} from "@/lib/onboarding/plans-ui"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

const COUNTRIES = [
  { value: "SA", label: "المملكة العربية السعودية" },
  { value: "AE", label: "الإمارات العربية المتحدة" },
  { value: "BH", label: "البحرين" },
  { value: "KW", label: "الكويت" },
  { value: "OM", label: "عُمان" },
  { value: "QA", label: "قطر" },
  { value: "EG", label: "مصر" },
] as const

const paymentSchema = z.object({
  cardHolderName: z.string().trim().min(2, "اسم حامل البطاقة مطلوب"),
  cardNumber: z
    .string()
    .min(1, "رقم البطاقة مطلوب")
    .refine((v) => v.replace(/\D/g, "").length >= 12, {
      message: "رقم البطاقة غير صالح",
    }),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV يجب أن يكون 3 أو 4 أرقام"),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "الصيغة يجب أن تكون MM/YY"),
  billingAddress: z.string().trim().min(3, "عنوان الفوترة مطلوب"),
  city: z.string().trim().min(2, "المدينة مطلوبة"),
  postalCode: z.string().trim().min(3, "الرمز البريدي مطلوب"),
  country: z.string().min(1, "الدولة مطلوبة"),
  savePaymentMethod: z.boolean(),
})

type PaymentValues = z.infer<typeof paymentSchema>

type SubscribeResponse = {
  subscriptionNumber: string
  invoiceNumber: string
  planId: string
  planName: string
  billingCycle: "MONTHLY" | "ANNUAL"
  subtotal: number
  discountApplied: number
  promoCode: string | null
  amount: number
  currency: string
  paidAt: string
  nextBillingDate: string
  status: string
  maxEmployees: number
  cardHolderName: string
}

type View = "form" | "success" | "failed"

function labelForPlanName(name: string | undefined): string {
  const idx = PLAN_UI_CONFIG.findIndex(
    (p) => p.nameHint.toLowerCase() === (name ?? "").toLowerCase(),
  )
  if (idx >= 0) return PLAN_UI_CONFIG[idx]!.label
  return name ?? "الباقة"
}

function formatDateAr(iso: string | undefined): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

function downloadReceipt(result: SubscriptionResultDraft, subscriber: string) {
  const lines = [
    "فاتورة اشتراك نجاز (تجريبي)",
    "================================",
    `المشترك: ${subscriber}`,
    `رقم الاشتراك: ${result.subscriptionNumber ?? "—"}`,
    `رقم الفاتورة: ${result.invoiceNumber ?? "—"}`,
    `الباقة: ${labelForPlanName(result.planName)}`,
    `الدورة: ${result.billingCycle === "ANNUAL" ? "سنوي" : "شهري"}`,
    `المبلغ: ${formatSar(result.amount ?? 0)}`,
    `تاريخ الدفع: ${formatDateAr(result.paidAt)}`,
    `الفوترة التالية: ${formatDateAr(result.nextBillingDate)}`,
    `الحالة: ${result.status ?? "PAID"}`,
  ]
  const blob = new Blob([lines.join("\n")], {
    type: "text/plain;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${result.invoiceNumber ?? "invoice"}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

export default function OnboardingPaymentPage() {
  const router = useRouter()
  const { user, refreshSession } = useAuth()
  const selected = getSelectedPlan()

  const [view, setView] = React.useState<View>("form")
  const [result, setResult] = React.useState<SubscriptionResultDraft | null>(
    null,
  )
  const [pending, setPending] = React.useState(false)
  const [promoInput, setPromoInput] = React.useState("")
  const [appliedPromo, setAppliedPromo] = React.useState<string | null>(null)

  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardHolderName: user?.fullName ?? "",
      cardNumber: "",
      cvv: "",
      expiry: "",
      billingAddress: "",
      city: "",
      postalCode: "",
      country: "SA",
      savePaymentMethod: true,
    },
    mode: "onChange",
  })

  const country = form.watch("country")

  React.useEffect(() => {
    if (!selected?.planId) {
      router.replace("/onboarding/pricing")
      return
    }
    setLocalOnboardingStep("payment")
    const last = getLastSubscription()
    if (last?.view === "success" || last?.view === "failed") {
      setResult(last)
      setView(last.view)
    }
  }, [router, selected?.planId])

  const monthly = selected?.monthlyPrice ?? 0
  const cycle = selected?.billingCycle ?? "MONTHLY"
  const subtotal = priceForCycle(monthly, cycle)
  const discountPreview =
    appliedPromo === "WELCOME20" ? +(subtotal * 0.2).toFixed(2) : 0
  const totalPreview = +(subtotal - discountPreview).toFixed(2)
  const planLabel = labelForPlanName(selected?.planName)

  function applyPromo() {
    const code = promoInput.trim().toUpperCase()
    if (code === "WELCOME20") {
      setAppliedPromo(code)
      toast.success("تم تطبيق خصم 20% على الفاتورة الأولى")
    } else if (!code) {
      toast.error("أدخل رمز ترويجي")
    } else {
      toast.error("رمز غير صالح")
    }
  }

  async function onSubmit(values: PaymentValues) {
    if (!selected?.planId) return
    setPending(true)
    try {
      const data = await apiFetch<SubscribeResponse>("/company/subscribe", {
        method: "POST",
        body: {
          planId: selected.planId,
          billingCycle: selected.billingCycle,
          cardHolderName: values.cardHolderName,
          cardNumber: values.cardNumber,
          cvv: values.cvv,
          expiry: values.expiry,
          billingAddress: values.billingAddress,
          city: values.city,
          postalCode: values.postalCode,
          country: values.country,
          promoCode: appliedPromo ?? undefined,
          savePaymentMethod: values.savePaymentMethod,
        },
      })
      const snap: SubscriptionResultDraft = {
        view: "success",
        ...data,
      }
      setLastSubscription(snap)
      setResult(snap)
      setView("success")
      setLocalOnboardingStep("attendance")
      await refreshSession()
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "فشلت عملية الدفع"
      const snap: SubscriptionResultDraft = {
        view: "failed",
        errorMessage: message,
        planName: selected.planName,
        billingCycle: selected.billingCycle,
      }
      setLastSubscription(snap)
      setResult(snap)
      setView("failed")
    } finally {
      setPending(false)
    }
  }

  function resetToForm(clearCard: boolean) {
    clearLastSubscription()
    setResult(null)
    setView("form")
    if (clearCard) {
      form.setValue("cardNumber", "")
      form.setValue("cvv", "")
      form.setValue("expiry", "")
    }
  }

  async function startCompanySetup() {
    setPending(true)
    try {
      clearLastSubscription()
      await advanceOnboardingTo("attendance", refreshSession)
      router.push("/onboarding/attendance")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "تعذر المتابعة إلى الإعداد",
      )
    } finally {
      setPending(false)
    }
  }

  if (!selected?.planId) {
    return (
      <div className="mx-auto flex max-w-md items-center justify-center p-10 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  if (view === "success" && result) {
    return (
      <div className="mx-auto w-full max-w-xl px-2 sm:px-4">
        <BillingHeader backHref="/onboarding/pricing" />
        <div className="rounded-2xl bg-white p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] sm:p-10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="size-10 text-primary" />
          </div>
          <h1 className="mt-5 font-almarai text-2xl font-bold">
            تم تفعيل الاشتراك بنجاح
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            يمكنك الآن متابعة إعداد شركتك على منصة نجاز
          </p>

          <dl className="mt-8 space-y-3 text-start text-sm">
            <SummaryRow
              label="المشترك"
              value={user?.fullName ?? result.cardHolderName ?? "—"}
            />
            <SummaryRow
              label="رقم الاشتراك"
              value={result.subscriptionNumber ?? "—"}
            />
            <SummaryRow
              label="رقم الفاتورة"
              value={result.invoiceNumber ?? "—"}
            />
            <SummaryRow
              label="الباقة"
              value={labelForPlanName(result.planName)}
            />
            <SummaryRow
              label="تاريخ الدفع"
              value={formatDateAr(result.paidAt)}
            />
            <SummaryRow
              label="الفوترة التالية"
              value={formatDateAr(result.nextBillingDate)}
            />
            <div className="flex items-center justify-between border-b border-border/60 py-2.5 last:border-0">
              <dt className="text-muted-foreground">الحالة</dt>
              <dd>
                <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                  مدفوع
                </Badge>
              </dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              className="h-11 flex-1"
              disabled={pending}
              onClick={() => void startCompanySetup()}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "ابدأ إعداد شركتك"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1"
              onClick={() =>
                downloadReceipt(result, user?.fullName ?? "—")
              }
            >
              <Download className="size-4" />
              تحميل الفاتورة
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (view === "failed") {
    return (
      <div className="mx-auto w-full max-w-xl px-2 sm:px-4">
        <BillingHeader backHref="/onboarding/pricing" />
        <div className="rounded-2xl bg-white p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.06)] sm:p-10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="size-10 text-destructive" />
          </div>
          <h1 className="mt-5 font-almarai text-2xl font-bold">
            فشلت عملية الدفع
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {result?.errorMessage ??
              "لم نتمكن من إتمام عملية الدفع. يرجى المحاولة مجددًا."}
          </p>

          <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-start text-sm text-destructive">
            <p className="mb-2 font-semibold">أسباب شائعة للفشل:</p>
            <ul className="list-disc space-y-1 ps-5">
              <li>بيانات البطاقة غير صحيحة أو منتهية الصلاحية</li>
              <li>رصيد غير كافٍ أو حد ائتماني تجاوز السقف</li>
              <li>رفض من البنك المُصدر — جرّب بطاقة أخرى</li>
              <li>
                للاختبار: أي بطاقة تنتهي بـ 0000 تُرفض عمدًا
              </li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Button
              type="button"
              className="h-11 w-full"
              onClick={() => resetToForm(false)}
            >
              إعادة محاولة الدفع
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              onClick={() => {
                toast.message("سيتم فتح بريد الدعم…")
                window.location.href = SUPPORT_MAILTO
              }}
            >
              التواصل مع الدعم
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-full"
              onClick={() => resetToForm(true)}
            >
              استخدام بطاقة أخرى
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-2 sm:px-4">
      <BillingHeader backHref="/onboarding/pricing" />

      <header className="mb-8 text-center">
        <h1 className="font-almarai text-2xl font-bold sm:text-3xl">
          الدفع وتفعيل الاشتراك
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          يتم تفعيل الاشتراك فورًا بعد إتمام الدفع بنجاح
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-6 lg:grid-cols-[1.4fr_1fr]"
          noValidate
        >
          <div className="space-y-6 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] sm:p-8">
            <section className="space-y-4">
              <h2 className="font-almarai text-base font-bold">
                بيانات البطاقة
              </h2>
              <FormInput
                name="cardHolderName"
                label="اسم حامل البطاقة"
                formType="input"
                placeholder="كما هو مطبوع على البطاقة"
              />
              <FormInput
                name="cardNumber"
                label="رقم البطاقة"
                formType="input"
                placeholder="•••• •••• •••• ••••"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  name="cvv"
                  label="CVV"
                  formType="input"
                  placeholder="123"
                />
                <FormInput
                  name="expiry"
                  label="تاريخ الانتهاء"
                  formType="input"
                  placeholder="MM/YY"
                />
              </div>
              <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                للاختبار التجريبي: أي رقم بطاقة ينتهي بـ{" "}
                <span className="font-mono font-semibold">0000</span> يُرفض
                عمدًا لإظهار شاشة الفشل.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-almarai text-base font-bold">
                عنوان الفوترة
              </h2>
              <FormInput
                name="billingAddress"
                label="العنوان"
                formType="input"
                placeholder="الشارع، رقم المبنى، الحي"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  name="city"
                  label="المدينة"
                  formType="input"
                  placeholder="الرياض"
                />
                <FormInput
                  name="postalCode"
                  label="الرمز البريدي"
                  formType="input"
                  placeholder="12345"
                />
              </div>
              <div className="space-y-2.5">
                <label className="text-sm font-medium text-foreground">
                  الدولة
                </label>
                <Select
                  value={country}
                  onValueChange={(v) => {
                    if (v !== null) {
                      form.setValue("country", v, { shouldValidate: true })
                    }
                  }}
                >
                  <SelectTrigger className="h-12! w-full! justify-between rounded-[6px] border border-[#d6d6d6] bg-white px-4 text-start">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {COUNTRIES.map((c) => (
                      <SelectItem
                        key={c.value}
                        value={c.value}
                        className="rounded-lg"
                      >
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                checked={form.watch("savePaymentMethod")}
                onCheckedChange={(v) =>
                  form.setValue("savePaymentMethod", v === true)
                }
              />
              حفظ وسيلة الدفع للفوترة القادمة
            </label>
          </div>

          <aside className="flex h-fit flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] lg:sticky lg:top-6">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">الباقة المحددة</p>
                <p className="font-almarai text-lg font-bold">{planLabel}</p>
              </div>
              <Badge variant="secondary">
                {cycle === "ANNUAL" ? "سنوي" : "شهري"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatEmployeeCap(selected.maxEmployees ?? 0)}
            </p>

            <div className="space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المجموع الفرعي</span>
                <span>{formatSar(subtotal)}</span>
              </div>
              {discountPreview > 0 && (
                <div className="flex justify-between text-primary">
                  <span>خصم WELCOME20</span>
                  <span>−{formatSar(discountPreview)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <span>الإجمالي</span>
                <span>{formatSar(totalPreview)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="رمز ترويجي"
                className="h-9 min-w-0 flex-1 rounded-[6px] border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={applyPromo}
              >
                تطبيق
              </Button>
            </div>
            {appliedPromo && (
              <p className="flex items-center gap-1.5 text-xs text-primary">
                <Check className="size-3.5" />
                تم تطبيق خصم 20% على الفاتورة الأولى
              </p>
            )}

            <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              يبدأ الاشتراك فورًا بعد الدفع. ضمان استرداد خلال 14 يومًا.
            </p>

            <Button
              type="submit"
              className="h-11 w-full"
              disabled={pending || !form.formState.isValid}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "ادفع وفعّل الاشتراك"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              onClick={() => router.push("/onboarding/pricing")}
            >
              العودة
            </Button>
          </aside>
        </form>
      </Form>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b border-border/60 py-2.5 last:border-0",
      )}
    >
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  )
}
