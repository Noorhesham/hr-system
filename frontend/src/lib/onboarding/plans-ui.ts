/**
 * Static Arabic presentation for plans ordered by ascending monthly price.
 * DB stores name (Basic/Pro/Enterprise) + price + maxEmployees only.
 */

export type PlanUiConfig = {
  /** Matches seed `SubscriptionPlan.name` when present. */
  nameHint: string
  label: string
  description: string
  features: string[]
  highlighted?: boolean
  cta: "subscribe" | "sales"
  ctaLabel: string
}

/** Zipped with GET /plans results (sorted by monthlyPrice asc). */
export const PLAN_UI_CONFIG: PlanUiConfig[] = [
  {
    nameHint: "Basic",
    label: "الباقة الأساسية",
    description: "مثالية للشركات الناشئة والفرق الصغيرة",
    features: [
      "إدارة الرواتب",
      "تتبع الحضور والانصراف",
      "بوابة الخدمة الذاتية للموظفين",
      "تقارير أساسية",
    ],
    cta: "subscribe",
    ctaLabel: "الاشتراك في الباقة",
  },
  {
    nameHint: "Pro",
    label: "باقة الأعمال",
    description: "الأكثر شيوعًا للشركات المتوسطة سريعة النمو",
    features: [
      "كل مزايا الباقة الأساسية",
      "إدارة الموارد البشرية",
      "إدارة المشاريع ومراكز التكلفة",
      "إدارة العمل الإضافي",
      "تكاملات متقدمة",
    ],
    highlighted: true,
    cta: "subscribe",
    ctaLabel: "الاشتراك في الباقة",
  },
  {
    nameHint: "Enterprise",
    label: "باقة المؤسسات",
    description: "حلول مخصصة للمؤسسات الكبيرة",
    features: [
      "كل مزايا باقة الأعمال",
      "تكامل كامل عبر واجهات API",
      "تسجيل دخول موحّد (SSO)",
      "دعم أولوية على مدار الساعة",
      "تكاملات مخصصة حسب احتياجاتك",
    ],
    cta: "sales",
    ctaLabel: "تواصل مع فريق المبيعات",
  },
]

export const UNLIMITED_EMPLOYEES_SENTINEL = 999999

export function formatEmployeeCap(maxEmployees: number): string {
  if (maxEmployees >= UNLIMITED_EMPLOYEES_SENTINEL) return "موظفين غير محدود"
  return `حتى ${maxEmployees.toLocaleString("en-US")} موظف`
}

export function formatSar(amount: number): string {
  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} ر.س`
}

/** Annual = monthly × 10 ("2 months free"). */
export function priceForCycle(
  monthlyPrice: number,
  cycle: "MONTHLY" | "ANNUAL",
): number {
  return cycle === "ANNUAL" ? monthlyPrice * 10 : monthlyPrice
}

export const SALES_MAILTO =
  "mailto:sales@najaz.sa?subject=" +
  encodeURIComponent("استفسار عن باقة المؤسسات")

export const SUPPORT_MAILTO =
  "mailto:support@najaz.sa?subject=" +
  encodeURIComponent("مساعدة بخصوص الدفع")

/** Free trial card — not from GET /plans; no payment required. */
export const TRIAL_UI = {
  label: "تجربة مجانية",
  description: "ابدأ فورًا بدون إدخال بطاقة — جرّب المنصة بالكامل",
  trialDays: 14,
  maxEmployees: 15,
  features: [
    "مزايا الباقة الأساسية",
    "لا حاجة لبطاقة ائتمان",
    "ترقية في أي وقت بسهولة",
    "يمكنك الإلغاء قبل انتهاء الفترة",
  ],
  ctaLabel: "ابدأ التجربة المجانية",
} as const
