export type DashboardLeaveStatus = "PENDING" | "APPROVED" | "REJECTED"

export type DashboardPeriod = {
  from: string
  to: string
  fromMonth: number
  fromYear: number
  toMonth: number
  toYear: number
  fromLabel: string
  toLabel: string
}

export type DashboardPayload = {
  period: DashboardPeriod
  totalEmployees: number
  employeesDeltaMonth: number
  attendanceRate: number
  attendanceRateDeltaWeek: number
  currentCyclePayroll: number
  payrollDeltaPct: number
  currentCycleLabel: string | null
  previousCycleLabel: string | null
  pendingLeaveRequests: number
  pendingLeaveRequestsDelta: number
  openLoans: number
  pendingLoanInstallments: number
  employeesByDepartment: { department: string; count: number }[]
  salarySummary: {
    month: number
    year: number
    label: string
    gross: number
    net: number
  }[]
  attendanceToday: {
    total: number
    checkedIn: number
    onTime: number
    late: number
    absent: number
    onTimeRate: number
  }
  recentLeaveRequests: {
    id: string
    employeeName: string
    position: string | null
    status: DashboardLeaveStatus
    fromDate: string
    toDate: string
  }[]
}

/** Last calendar month → current calendar month (local), as YYYY-MM-DD. */
export function lastToCurrentMonthRange(now = new Date()): {
  from: string
  to: string
} {
  const y = now.getFullYear()
  const m = now.getMonth() // 0-11
  const prev = new Date(y, m - 1, 1)
  const from = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-01`
  const lastDay = new Date(y, m + 1, 0).getDate()
  const to = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
  return { from, to }
}

export function formatPeriodLabelAr(period: DashboardPeriod): string {
  if (period.fromYear === period.toYear) {
    return `${period.fromLabel} – ${period.toLabel} ${period.toYear}`
  }
  return `${period.fromLabel} ${period.fromYear} – ${period.toLabel} ${period.toYear}`
}

export function formatSar(n: number): string {
  return `${n.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  })} ر.س`
}

export function formatPct(n: number): string {
  return `${n.toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })}%`
}

export function arabicInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`
  }
  return name.slice(0, 2) || "؟"
}
