import { z } from "zod"

export const INDUSTRY_OPTIONS = [
  { label: "تجارة وتجزئة", value: "retail" },
  { label: "تقنية المعلومات", value: "it" },
  { label: "الصناعة والتصنيع", value: "manufacturing" },
  { label: "الخدمات المهنية", value: "professional-services" },
  { label: "الرعاية الصحية", value: "healthcare" },
  { label: "التعليم", value: "education" },
  { label: "الخدمات اللوجستية", value: "logistics" },
  { label: "أخرى", value: "other" },
]

export const companyProfileSchema = z.object({
  companyName: z.string().min(1, "اسم الشركة مطلوب"),
  website: z
    .string()
    .min(1, "الموقع الالكتروني مطلوب")
    .regex(/^(https?:\/\/)?[\w-]+(\.[\w-]+)+.*$/, "أدخل رابطًا صحيحًا"),
  industry: z.string().min(1, "قطاع العمل مطلوب"),
})

export type CompanyProfileValues = z.infer<typeof companyProfileSchema>

export const adminProfileSchema = z.object({
  jobTitle: z.string().min(1, "المسمى الوظيفي مطلوب"),
  fullName: z.string().min(1, "الاسم الكامل مطلوب"),
  phone: z
    .string()
    .min(1, "رقم الجوال مطلوب")
    .regex(/^\d{8,10}$/, "أدخل رقم جوال صحيح"),
  email: z
    .string()
    .min(1, "البريد الإلكتروني مطلوب")
    .email("أدخل بريدًا إلكترونيًا صالحًا"),
})

export type AdminProfileValues = z.infer<typeof adminProfileSchema>

export const WORK_DAYS = [
  { label: "الأحد", value: "sun" },
  { label: "الاثنين", value: "mon" },
  { label: "الثلاثاء", value: "tue" },
  { label: "الأربعاء", value: "wed" },
  { label: "الخميس", value: "thu" },
  { label: "الجمعة", value: "fri" },
  { label: "السبت", value: "sat" },
]

export const DEFAULT_WORK_DAYS = ["sun", "mon", "tue", "wed", "thu"]

export const attendanceSettingsSchema = z
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

export type AttendanceSettingsInput = z.input<typeof attendanceSettingsSchema>
export type AttendanceSettingsValues = z.output<typeof attendanceSettingsSchema>

export const CURRENCIES = [{ label: "ريال سعودي - SAR", value: "SAR" }]
export const CYCLES = [
  { label: "شهري", value: "monthly" },
  { label: "اسبوعين", value: "biweekly" },
  { label: "اسبوعي", value: "weekly" },
]

export const payrollSettingsSchema = z.object({
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

export type PayrollSettingsInput = z.input<typeof payrollSettingsSchema>
export type PayrollSettingsValues = z.output<typeof payrollSettingsSchema>

export const INSURANCE_PROVIDERS = [
  { label: "بوبا العربية", value: "bupa" },
  { label: "التعاونية للتأمين", value: "tawuniya" },
  { label: "ميدغلف", value: "medgulf" },
  { label: "شركة أخرى", value: "other" },
]

export const INSURANCE_TIERS = ["C", "B", "A", "VIP"]

export const benefitsSettingsSchema = z
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

export type BenefitsSettingsValues = z.infer<typeof benefitsSettingsSchema>

export function apiCycleToForm(cycle?: string | null): string {
  if (cycle === "WEEKLY") return "weekly"
  if (cycle === "BIWEEKLY") return "biweekly"
  return "monthly"
}

export function weekendDaysToWorkDays(weekends: string[] | undefined): string[] {
  const map: Record<string, string> = {
    SUNDAY: "sun",
    MONDAY: "mon",
    TUESDAY: "tue",
    WEDNESDAY: "wed",
    THURSDAY: "thu",
    FRIDAY: "fri",
    SATURDAY: "sat",
  }
  const weekendSet = new Set((weekends ?? []).map((d) => d.toUpperCase()))
  return Object.entries(map)
    .filter(([api]) => !weekendSet.has(api))
    .map(([, v]) => v)
}
