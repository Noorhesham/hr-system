"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Form } from "@/components/ui/form"
import { FormInput } from "@/components/form"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"
import { OnboardingFooter } from "@/components/onboarding/onboarding-footer"
import { apiFetch } from "@/lib/api-client"
import {
  cycleToApi,
  getOnboardingDraft,
  patchOnboardingDraft,
} from "@/lib/onboarding/draft"
import { advanceOnboardingTo } from "@/lib/onboarding/advance"
import { useAuth } from "@/hooks/use-auth"

const CURRENCIES = [{ label: "ريال سعودي - SAR", value: "SAR" }]

const CYCLES = [
  { label: "شهري", value: "monthly" },
  { label: "اسبوعين", value: "biweekly" },
  { label: "اسبوعي", value: "weekly" },
]

const payrollSchema = z.object({
  currency: z.string().min(1, "العملة مطلوبة"),
  cycle: z.string().min(1, "دورة الرواتب مطلوبة"),
  payoutDay: z
    .union([z.number(), z.string()])
    .transform((v) => (v === "" ? NaN : Number(v)))
    .refine((n) => Number.isInteger(n) && n >= 1 && n <= 31, {
      message: "يوم الصرف يجب أن يكون بين 1 و 31",
    }),
  directDeposit: z.boolean(),
})

type PayrollFormInput = z.input<typeof payrollSchema>
type PayrollValues = z.output<typeof payrollSchema>

export default function OnboardingPayrollPage() {
  const router = useRouter()
  const { refreshSession } = useAuth()
  const draft = getOnboardingDraft().payroll
  const [pending, setPending] = React.useState(false)

  const form = useForm<PayrollFormInput, unknown, PayrollValues>({
    resolver: zodResolver(payrollSchema),
    defaultValues: {
      currency: draft?.currency ?? "SAR",
      cycle: draft?.cycle ?? "monthly",
      payoutDay: Number(draft?.payoutDay ?? 27),
      directDeposit: draft?.directDeposit ?? true,
    },
    mode: "onChange",
  })

  const cycle = form.watch("cycle")
  const currency = form.watch("currency")
  const directDeposit = form.watch("directDeposit") as boolean

  async function saveAndNext(values: PayrollValues) {
    setPending(true)
    try {
      await apiFetch("/company/policy", {
        method: "PATCH",
        body: {
          currency: values.currency,
          payrollCycle: cycleToApi(values.cycle),
          payrollPayoutDay: values.payoutDay,
          directBankTransfer: values.directDeposit,
        },
      })
      patchOnboardingDraft({
        payroll: {
          currency: values.currency,
          cycle: values.cycle,
          payoutDay: String(values.payoutDay),
          directDeposit: values.directDeposit,
        },
      })
      await advanceOnboardingTo("benefits", refreshSession)
      router.push("/onboarding/benefits")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "تعذر حفظ إعدادات الرواتب",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <OnboardingShell step={5}>
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">إعدادات الرواتب</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          قم بتحديد العملة، دورة الرواتب، وتاريخ الصرف الأساسي لمنشأتك.
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(saveAndNext)}
          className="flex flex-col gap-6"
          noValidate
        >
          <div className="space-y-2.5">
            <label className="text-sm font-medium text-foreground">العملة</label>
            <Select
              value={currency}
              onValueChange={(v) => {
                if (v !== null) {
                  form.setValue("currency", v, { shouldValidate: true })
                }
              }}
            >
              <SelectTrigger className="h-12! w-full! justify-between rounded-[6px] border border-[#d6d6d6] bg-white px-4 text-start [&>span]:text-start">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {CURRENCIES.map((opt) => (
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
              دورة الرواتب
            </label>
            <ToggleGroup
              multiple={false}
              value={cycle ? [cycle] : []}
              onValueChange={(v) => {
                if (v[0]) form.setValue("cycle", v[0], { shouldValidate: true })
              }}
              spacing={2}
              className="w-full gap-2"
            >
              {CYCLES.map((opt) => (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  className="h-10 flex-1 rounded-[6px] border border-[#d6d6d6] text-sm hover:bg-white hover:text-foreground aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="max-w-xs space-y-2.5">
            <FormInput
              name="payoutDay"
              label="يوم صرف الرواتب"
              formType="input"
              inputType="number"
              required
            />
            <p className="text-sm text-muted-foreground">
              سيتم احتساب المصروفات نهاية آخر يوم قبل هذا التاريخ بـ 3 أيام
              عمل.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-[6px] border border-border p-4">
            <div>
              <p className="font-medium text-foreground">
                تفعيل التحويل البنكي المباشر
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                تمكين دفع الرواتب مباشرة من خلال النظام عبر الربط المصرفي.
              </p>
            </div>
            <Switch
              checked={directDeposit}
              onCheckedChange={(v) =>
                form.setValue("directDeposit", v, { shouldValidate: true })
              }
            />
          </div>

          <OnboardingFooter
            onBack={() => router.push("/onboarding/attendance")}
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
