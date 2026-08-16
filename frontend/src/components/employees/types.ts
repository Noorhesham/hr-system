export type AccountStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE"

export type JobRank = "EMPLOYEE" | "TEAM_LEAD" | "DEPARTMENT_MANAGER"
export type WorkLocation = "HEADQUARTERS" | "REMOTE" | "BRANCH"

export type EmployeeDetail = {
  id: string
  name: string
  employeeCode: string
  email: string | null
  phone: string | null
  photoUrl?: string | null
  departmentId: string | null
  department: string | null
  position: string | null
  employmentType: "PERMANENT" | "CONTRACT" | "TEMPORARY" | "PROBATION"
  salaryBasis: "MONTHLY" | "DAILY" | "HOURLY"
  basicSalary: number | string
  isActive: boolean
  isGosiRegistered: boolean
  gosiNumber: string | null
  managerId: string | null
  managerName: string | null
  jobRank: JobRank
  workLocation: WorkLocation
  contractDurationYears: number | null
  accountStatus: AccountStatus
  onLeave: boolean
  createdAt: string
  updatedAt?: string
  hireDate?: string | null
  shiftId?: string | null
  shift?: {
    id: string
    name: string
    startTime: string
    endTime: string
  } | null
}

export type PayrollSlipRow = {
  id: string
  month: number
  year: number
  cycleStatus: string
  basicSalary: number
  totalAllowances: number
  overtimeBonus: number
  totalDeductions: number
  gross: number
  netSalary: number
  paidAt: string
}

export type LeaveRow = {
  id: string
  type: string
  fromDate: string
  toDate: string
  days: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  reason: string | null
}

export type AttendanceRow = {
  id: string
  date: string
  status: "PRESENT" | "ABSENT" | "LEAVE"
  checkIn: string | null
  checkOut: string | null
  delayMinutes: number
  overtimeHours: number
  workHours: string | null
  isLate: boolean
}

export type AttendanceSummary = {
  present: number
  late: number
  absent: number
  leave: number
  remote: number
}

export const ACCOUNT_STATUS_UI: Record<
  AccountStatus,
  { label: string; className: string; dot: string }
> = {
  ACTIVE: {
    label: "نشط",
    className: "bg-primary/10 text-primary border-transparent",
    dot: "bg-primary",
  },
  ON_LEAVE: {
    label: "في إجازة",
    className: "bg-orange-100 text-orange-700 border-transparent",
    dot: "bg-orange-500",
  },
  INACTIVE: {
    label: "غير نشط",
    className: "bg-muted text-muted-foreground border-transparent",
    dot: "bg-muted-foreground",
  },
}

export const EMPLOYMENT_TYPE_AR: Record<string, string> = {
  PERMANENT: "دائم",
  CONTRACT: "عقد",
  TEMPORARY: "مؤقت",
  PROBATION: "تحت التجربة",
}

/** Full-time style labels used on the edit form (mock: دوام كامل). */
export const EMPLOYMENT_TYPE_EDIT_AR: Record<string, string> = {
  PERMANENT: "دوام كامل",
  CONTRACT: "عقد",
  TEMPORARY: "مؤقت",
  PROBATION: "تحت التجربة",
}

export const SALARY_BASIS_AR: Record<string, string> = {
  MONTHLY: "شهري",
  DAILY: "يومي",
  HOURLY: "ساعي",
}

export const JOB_RANK_AR: Record<JobRank, string> = {
  EMPLOYEE: "موظف",
  TEAM_LEAD: "قائد فريق",
  DEPARTMENT_MANAGER: "مدير قسم",
}

export const WORK_LOCATION_AR: Record<WorkLocation, string> = {
  HEADQUARTERS: "مقر الشركة",
  REMOTE: "عن بعد",
  BRANCH: "فرع",
}

export type Gender = "MALE" | "FEMALE"
export type MaritalStatus = "SINGLE" | "MARRIED"

export const GENDER_AR: Record<Gender, string> = {
  MALE: "ذكر",
  FEMALE: "أنثى",
}

export const MARITAL_STATUS_AR: Record<MaritalStatus, string> = {
  SINGLE: "أعزب / عزباء",
  MARRIED: "متزوج / متزوجة",
}

export const LEAVE_STATUS_AR: Record<string, string> = {
  PENDING: "قيد الانتظار",
  APPROVED: "موافق عليها",
  REJECTED: "مرفوضة",
}

export const DEPARTMENT_OPTIONS = [] as const

/** Strip +966 / leading 0 for local SA mobile display. */
export function toLocalPhone(phone: string | null | undefined): string {
  if (!phone) return ""
  let p = phone.replace(/\s+/g, "")
  if (p.startsWith("+966")) p = p.slice(4)
  else if (p.startsWith("966")) p = p.slice(3)
  if (p.startsWith("0")) p = p.slice(1)
  return p
}

export function toE164Sa(local: string): string {
  const digits = local.replace(/\D/g, "")
  if (!digits) return ""
  const body = digits.startsWith("0") ? digits.slice(1) : digits
  return `+966${body}`
}

export function annualSalaryFromBasic(
  basic: number | string,
  basis: string,
): number {
  const n = typeof basic === "string" ? Number(basic) : basic
  if (!Number.isFinite(n)) return 0
  if (basis === "MONTHLY") return Math.round(n * 12)
  if (basis === "DAILY") return Math.round(n * 365)
  if (basis === "HOURLY") return Math.round(n * 8 * 22 * 12)
  return Math.round(n)
}

export function arabicInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`
  }
  return name.slice(0, 2) || "؟"
}

export function formatSar(n: number): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatDateAr(iso: string): string {
  // Prefer calendar Y-M-D so UTC-midnight @db.Date values don't shift a day in +03.
  const ymd = iso.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    const [y, m, d] = ymd.split("-").map(Number)
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(y!, m! - 1, d!))
  }
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso))
}

export function formatTimeAr(iso: string | null): string {
  if (!iso) return "—"
  return new Intl.DateTimeFormat("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso))
}

export function serviceYearsLabel(createdAt: string): string {
  const start = new Date(createdAt)
  const now = new Date()
  let years = now.getFullYear() - start.getFullYear()
  let months = now.getMonth() - start.getMonth()
  if (months < 0) {
    years -= 1
    months += 12
  }
  if (years <= 0 && months <= 0) return "أقل من شهر"
  if (years <= 0) return `${months} شهر`
  if (months === 0) return `${years} سنة`
  return `${years} سنة و ${months} شهر`
}

/** Fractional years of service (e.g. 3.2) for overview KPI cards. */
export function serviceYearsExact(createdAt: string): number {
  const ms = Date.now() - new Date(createdAt).getTime()
  return Math.max(0, ms / (365.25 * 24 * 60 * 60 * 1000))
}
