"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Info } from "lucide-react"
import { toast } from "sonner"

import { Form } from "@/components/ui/form"
import { FormInput } from "@/components/form"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { OnboardingShell } from "@/components/onboarding/onboarding-shell"
import { OnboardingFooter } from "@/components/onboarding/onboarding-footer"
import { apiFetch } from "@/lib/api-client"
import {
  getOnboardingDraft,
  patchOnboardingDraft,
  workDaysToWeekendDays,
} from "@/lib/onboarding/draft"
import { advanceOnboardingTo } from "@/lib/onboarding/advance"
import { useAuth } from "@/hooks/use-auth"

const DAYS = [
  { label: "الأحد", value: "sun" },
  { label: "الاثنين", value: "mon" },
  { label: "الثلاثاء", value: "tue" },
  { label: "الأربعاء", value: "wed" },
  { label: "الخميس", value: "thu" },
  { label: "الجمعة", value: "fri" },
  { label: "السبت", value: "sat" },
]

const DEFAULT_WORK_DAYS = ["sun", "mon", "tue", "wed", "thu"]

const attendanceSchema = z
  .object({
    workDays: z.array(z.string()).min(1, "اختر يوم عمل واحد على الأقل"),
    startTime: z.string().min(1, "وقت البداية مطلوب"),
    endTime: z.string().min(1, "وقت النهاية مطلوب"),
    graceMinutes: z
      .union([z.number(), z.string()])
      .transform((v) => (v === "" ? NaN : Number(v)))
      .refine((n) => Number.isInteger(n) && n >= 0 && n <= 120, {
        message: "فترة السماح يجب أن تكون بين 0 و 120 دقيقة",
      }),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "وقت النهاية يجب أن يكون بعد وقت البداية",
    path: ["endTime"],
  })

type AttendanceFormInput = z.input<typeof attendanceSchema>
type AttendanceValues = z.output<typeof attendanceSchema>

export default function OnboardingAttendancePage() {
  const router = useRouter()
  const { refreshSession } = useAuth()
  const draft = getOnboardingDraft().attendance
  const [pending, setPending] = React.useState(false)

  const form = useForm<AttendanceFormInput, unknown, AttendanceValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      workDays: draft?.workDays ?? DEFAULT_WORK_DAYS,
      startTime: draft?.startTime ?? "08:00",
      endTime: draft?.endTime ?? "17:00",
      graceMinutes: Number(draft?.graceMinutes ?? 15),
    },
    mode: "onChange",
  })

  const workDays = form.watch("workDays") as string[]

  async function saveAndNext(values: AttendanceValues) {
    setPending(true)
    try {
      const weekendDays = workDaysToWeekendDays(values.workDays)
      await apiFetch("/company/policy", {
        method: "PATCH",
        body: { defaultWeekendDays: weekendDays },
      })

      const shift = await apiFetch<{ id: string }>("/shifts", {
        method: "POST",
        body: {
          name: "الوردية الافتراضية",
          startTime: values.startTime,
          endTime: values.endTime,
          gracePeriodMinutes: values.graceMinutes,
        },
      })

      patchOnboardingDraft({
        attendance: {
          workDays: values.workDays,
          startTime: values.startTime,
          endTime: values.endTime,
          graceMinutes: String(values.graceMinutes),
          shiftId: shift.id,
        },
      })
      await advanceOnboardingTo("payroll", refreshSession)
      router.push("/onboarding/payroll")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "تعذر حفظ الإعدادات")
    } finally {
      setPending(false)
    }
  }

  return (
    <OnboardingShell step={4}>
      <header className="mb-8 text-center">
        <h1 className="text-[32px] font-bold leading-none text-foreground">
          إعدادات الحضور والانصراف
        </h1>
        <p className="mt-3 text-lg leading-7 text-muted-foreground">
          حدد ساعات العمل الافتراضية وسياسات الحضور لمؤسستك.
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(saveAndNext)}
          className="flex flex-col gap-6"
          noValidate
        >
          <div className="space-y-2.5">
            <label className="block text-start text-sm font-medium text-foreground">
              أيام العمل
            </label>
            <ToggleGroup
              multiple
              value={workDays}
              onValueChange={(v) => {
                if (v.length) form.setValue("workDays", v, { shouldValidate: true })
              }}
              spacing={2}
              className="flex w-full flex-wrap justify-start gap-2"
            >
              {DAYS.map((day) => (
                <ToggleGroupItem
                  key={day.value}
                  value={day.value}
                  className="h-10 min-w-[4.5rem] flex-1 rounded-[6px] border border-[#d6d6d6] bg-white px-3 text-sm font-medium text-foreground hover:bg-white hover:text-foreground aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {day.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {form.formState.errors.workDays && (
              <p className="text-sm text-destructive">
                {form.formState.errors.workDays.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput
              name="startTime"
              label="ساعات العمل : من"
              formType="input"
              inputType="time"
              required
            />
            <FormInput
              name="endTime"
              label="ساعات العمل : الى"
              formType="input"
              inputType="time"
              required
            />
          </div>

          <div className="max-w-xs">
            <FormInput
              name="graceMinutes"
              label="فترة السماح (بالدقائق)"
              formType="input"
              inputType="number"
              required
            />
          </div>

          <div className="flex items-start gap-2 rounded-[6px] bg-[#EAF7EA] px-4 py-3 text-start text-sm text-primary">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>
              سيتم تطبيق هذه الإعدادات كقيم افتراضية لجميع الموظفين الجدد
              ويمكن تخصيصها لكل موظف على حدة.
            </p>
          </div>

          <OnboardingFooter
            onBack={() => router.push("/onboarding/admin-account")}
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
