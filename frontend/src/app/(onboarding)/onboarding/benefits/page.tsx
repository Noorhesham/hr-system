"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Form } from "@/components/ui/form"
import { FormInput } from "@/components/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"
import { OnboardingFooter } from "@/components/onboarding/onboarding-footer"
import { apiFetch } from "@/lib/api-client"
import {
  getOnboardingDraft,
  patchOnboardingDraft,
} from "@/lib/onboarding/draft"
import { advanceOnboardingTo } from "@/lib/onboarding/advance"
import { useAuth } from "@/hooks/use-auth"

const INSURANCE_PROVIDERS = [
  { label: "بوبا العربية", value: "bupa" },
  { label: "التعاونية للتأمين", value: "tawuniya" },
  { label: "ميدغلف", value: "medgulf" },
  { label: "شركة أخرى", value: "other" },
]

const INSURANCE_TIERS = ["C", "B", "A", "VIP"]

const benefitsSchema = z
  .object({
    provider: z.string(),
    tier: z.string(),
    gosiEnabled: z.boolean(),
    housingAllowance: z.boolean(),
    transportAllowance: z.boolean(),
    annualTickets: z.boolean(),
    directDeposit: z.boolean(),
    housingAmount: z.union([z.number(), z.string()]).optional(),
    housingIsPercentage: z.boolean(),
    transportAmount: z.union([z.number(), z.string()]).optional(),
    annualTicketsAmount: z.union([z.number(), z.string()]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.provider && !data.tier) {
      ctx.addIssue({
        code: "custom",
        message: "اختر فئة التأمين",
        path: ["tier"],
      })
    }
    if (data.housingAllowance) {
      const n = Number(data.housingAmount)
      if (!Number.isFinite(n) || n <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "أدخل قيمة بدل السكن",
          path: ["housingAmount"],
        })
      } else if (data.housingIsPercentage && (n < 1 || n > 100)) {
        ctx.addIssue({
          code: "custom",
          message: "نسبة بدل السكن يجب أن تكون بين 1 و 100",
          path: ["housingAmount"],
        })
      }
    }
    if (data.transportAllowance) {
      const n = Number(data.transportAmount)
      if (!Number.isFinite(n) || n <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "أدخل قيمة بدل المواصلات",
          path: ["transportAmount"],
        })
      }
    }
    if (data.annualTickets) {
      const n = Number(data.annualTicketsAmount)
      if (!Number.isFinite(n) || n <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "أدخل قيمة التذاكر السنوية",
          path: ["annualTicketsAmount"],
        })
      }
    }
  })

type BenefitsValues = z.infer<typeof benefitsSchema>

export default function OnboardingBenefitsPage() {
  const router = useRouter()
  const { refreshSession } = useAuth()
  const draft = getOnboardingDraft().benefits
  const [pending, setPending] = React.useState(false)

  const form = useForm<BenefitsValues>({
    resolver: zodResolver(benefitsSchema),
    defaultValues: {
      provider: draft?.provider ?? "",
      tier: draft?.tier ?? "B",
      gosiEnabled: draft?.gosiEnabled ?? true,
      housingAllowance: draft?.benefits?.housingAllowance ?? false,
      transportAllowance: draft?.benefits?.transportAllowance ?? true,
      annualTickets: draft?.benefits?.annualTickets ?? true,
      directDeposit: draft?.benefits?.directDeposit ?? true,
      housingAmount: Number(draft?.housingAmount ?? 25),
      housingIsPercentage: draft?.housingIsPercentage ?? true,
      transportAmount: Number(draft?.transportAmount ?? 500),
      annualTicketsAmount: Number(draft?.annualTicketsAmount ?? 3600),
    },
    mode: "onChange",
  })

  const values = form.watch()

  async function saveAndNext(data: BenefitsValues) {
    setPending(true)
    try {
      await apiFetch("/company/policy", {
        method: "PATCH",
        body: {
          medicalInsuranceProvider: data.provider || undefined,
          medicalInsuranceTier: data.tier || undefined,
          gosiAutoEnroll: data.gosiEnabled,
          benefitHousingAllowance: data.housingAllowance,
          benefitHousingAllowanceAmount: data.housingAllowance
            ? Number(data.housingAmount)
            : undefined,
          benefitHousingAllowanceIsPercentage: data.housingIsPercentage,
          benefitTransportAllowance: data.transportAllowance,
          benefitTransportAllowanceAmount: data.transportAllowance
            ? Number(data.transportAmount)
            : undefined,
          benefitAnnualTickets: data.annualTickets,
          benefitAnnualTicketsAmount: data.annualTickets
            ? Number(data.annualTicketsAmount)
            : undefined,
          directBankTransfer: data.directDeposit,
        },
      })
      patchOnboardingDraft({
        benefits: {
          provider: data.provider,
          tier: data.tier,
          gosiEnabled: data.gosiEnabled,
          benefits: {
            housingAllowance: data.housingAllowance,
            transportAllowance: data.transportAllowance,
            annualTickets: data.annualTickets,
            directDeposit: data.directDeposit,
          },
          housingAmount: String(data.housingAmount ?? ""),
          housingIsPercentage: data.housingIsPercentage,
          transportAmount: String(data.transportAmount ?? ""),
          annualTicketsAmount: String(data.annualTicketsAmount ?? ""),
        },
      })
      await advanceOnboardingTo("employees", refreshSession)
      router.push("/onboarding/employees")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر حفظ المزايا")
    } finally {
      setPending(false)
    }
  }

  return (
    <OnboardingShell step={6}>
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">
          إعداد المزايا والتأمينات
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          حدد خطط التأمين الطبي والمزايا الإضافية لموظفيك. عند تفعيل بدلات
          السكن / المواصلات / التذاكر سيتم إنشاؤها تلقائياً كعناصر راتب لكل
          موظف.
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(saveAndNext)}
          className="flex flex-col gap-6"
          noValidate
        >
          <div className="space-y-4">
            <p className="text-sm font-bold text-foreground">التأمين الطبي</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2.5">
                <label className="text-sm font-medium text-foreground">
                  مزود التأمين
                </label>
                <Select
                  value={values.provider || null}
                  onValueChange={(v) => {
                    if (v !== null) {
                      form.setValue("provider", v, { shouldValidate: true })
                    }
                  }}
                >
                  <SelectTrigger className="h-12! w-full! justify-between rounded-[6px] border border-[#d6d6d6] bg-white px-4 text-start [&>span]:text-start">
                    <SelectValue placeholder="اختر مزود التأمين" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {INSURANCE_PROVIDERS.map((opt) => (
                      <SelectItem
                        key={opt.value}
                        value={opt.value}
                        className="rounded-lg"
                      >
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2.5">
                <label className="text-sm font-medium text-foreground">
                  فئة التأمين
                </label>
                <ToggleGroup
                  multiple={false}
                  value={values.tier ? [values.tier] : []}
                  onValueChange={(v) => {
                    if (v[0]) form.setValue("tier", v[0], { shouldValidate: true })
                  }}
                  spacing={2}
                  className="w-full gap-2"
                >
                  {INSURANCE_TIERS.map((t) => (
                    <ToggleGroupItem
                      key={t}
                      value={t}
                      className="h-12 flex-1 rounded-[6px] border border-[#d6d6d6] text-sm hover:bg-white hover:text-foreground aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      {t}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
                {form.formState.errors.tier && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.tier.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-[6px] border border-border p-4">
            <div>
              <p className="font-medium text-foreground">التأمينات الاجتماعية</p>
              <p className="mt-1 text-sm text-muted-foreground">
                التسجيل التلقائي في نظام التأمينات الاجتماعية (GOSI)
              </p>
            </div>
            <Switch
              checked={values.gosiEnabled}
              onCheckedChange={(v) =>
                form.setValue("gosiEnabled", v, { shouldValidate: true })
              }
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-bold text-foreground">مزايا إضافية</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <BenefitToggle
                checked={values.annualTickets}
                onToggle={() =>
                  form.setValue("annualTickets", !values.annualTickets, {
                    shouldValidate: true,
                  })
                }
                title="تذاكر سنوية"
                description="قيمة سنوية — تُحتسب شهرياً (÷ 12) في كشف الراتب"
              >
                {values.annualTickets && (
                  <FormInput
                    name="annualTicketsAmount"
                    label="القيمة السنوية (ريال)"
                    formType="input"
                    inputType="number"
                    required
                  />
                )}
              </BenefitToggle>

              <BenefitToggle
                checked={values.transportAllowance}
                onToggle={() =>
                  form.setValue(
                    "transportAllowance",
                    !values.transportAllowance,
                    { shouldValidate: true },
                  )
                }
                title="بدل مواصلات"
                description="قيمة ثابتة شهرياً تُضاف لكل موظف تلقائياً"
              >
                {values.transportAllowance && (
                  <FormInput
                    name="transportAmount"
                    label="المبلغ الشهري (ريال)"
                    formType="input"
                    inputType="number"
                    required
                  />
                )}
              </BenefitToggle>

              <BenefitToggle
                checked={values.housingAllowance}
                onToggle={() =>
                  form.setValue("housingAllowance", !values.housingAllowance, {
                    shouldValidate: true,
                  })
                }
                title="بدل سكن"
                description="نسبة من الراتب الأساسي أو مبلغ ثابت"
              >
                {values.housingAllowance && (
                  <div className="space-y-2">
                    <FormInput
                      name="housingAmount"
                      label={
                        values.housingIsPercentage
                          ? "النسبة من الراتب (%)"
                          : "المبلغ الشهري (ريال)"
                      }
                      formType="input"
                      inputType="number"
                      required
                    />
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Checkbox
                        checked={values.housingIsPercentage}
                        onCheckedChange={(c) =>
                          form.setValue("housingIsPercentage", c === true, {
                            shouldValidate: true,
                          })
                        }
                      />
                      احتساب كنسبة مئوية من الراتب الأساسي
                    </label>
                  </div>
                )}
              </BenefitToggle>

              <BenefitToggle
                checked={values.directDeposit}
                onToggle={() =>
                  form.setValue("directDeposit", !values.directDeposit, {
                    shouldValidate: true,
                  })
                }
                title="تفعيل التحويل البنكي المباشر"
                description="تفعيل دفع الرواتب مباشرة من خلال النظام عبر الربط المصرفي"
              />
            </div>
          </div>

          <OnboardingFooter
            onBack={() => router.push("/onboarding/payroll")}
            nextType="submit"
            onSkip={() => form.handleSubmit(saveAndNext)()}
            nextPending={pending}
            nextDisabled={!form.formState.isValid}
          />
        </form>
      </Form>
    </OnboardingShell>
  )
}

function BenefitToggle({
  checked,
  onToggle,
  title,
  description,
  children,
}: {
  checked: boolean
  onToggle: () => void
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[6px] border p-4 transition-colors",
        checked ? "border-primary bg-primary/5" : "border-[#d6d6d6] bg-white",
      )}
    >
      <label className="flex cursor-pointer items-start gap-2.5">
        <Checkbox
          checked={checked}
          onCheckedChange={onToggle}
          className="mt-0.5"
        />
        <span>
          <span className="block text-sm font-medium text-foreground">
            {title}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {description}
          </span>
        </span>
      </label>
      {children}
    </div>
  )
}
