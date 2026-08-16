import {
  AttendanceStatus,
  CompanyPolicy,
  DelayDeductionType,
  Prisma,
  SalaryBasis,
  SalaryComponent,
  SalaryComponentType,
} from '@prisma/client';
import { formatYmd } from '../../common/utils/attendance-time.util';

const D = (n: number | string | Prisma.Decimal) => new Prisma.Decimal(n);
const ZERO = D(0);
const DAYS_IN_MONTH = 30; // KSA labor-law convention for monthly day-rate
const HOURS_PER_DAY = 8;

export type AttendanceRow = {
  date: Date;
  status: AttendanceStatus;
  delayMinutes: number;
  overtimeHours: Prisma.Decimal;
  /** Needed for HOURLY regular-hours (ignored for MONTHLY/DAILY). */
  checkIn?: Date | null;
  checkOut?: Date | null;
};

export type OvertimeGrant = {
  date: Date;
  hours: Prisma.Decimal;
};

export type PaidOvertimeDay = {
  date: Date;
  hours: Prisma.Decimal;
  clockHours: Prisma.Decimal;
  requestHours: Prisma.Decimal;
};

function ymdKey(date: Date): string {
  return formatYmd(date);
}

/** Per calendar day: paid OT hours = max(clock, approved request). */
export function resolvePaidOvertime(
  attendance: Pick<AttendanceRow, 'date' | 'overtimeHours'>[],
  approvedOvertime: OvertimeGrant[] = [],
): PaidOvertimeDay[] {
  const map = new Map<string, PaidOvertimeDay>();
  for (const row of attendance) {
    const key = ymdKey(row.date);
    map.set(key, {
      date: row.date,
      hours: D(row.overtimeHours),
      clockHours: D(row.overtimeHours),
      requestHours: ZERO,
    });
  }
  for (const req of approvedOvertime) {
    const key = ymdKey(req.date);
    const hours = D(req.hours);
    const existing = map.get(key);
    if (existing) {
      existing.requestHours = hours;
      existing.hours = Prisma.Decimal.max(existing.clockHours, hours);
    } else {
      map.set(key, {
        date: req.date,
        hours,
        clockHours: ZERO,
        requestHours: hours,
      });
    }
  }
  return [...map.values()].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
}

export type SlipCalc = {
  /** Period earned basic (MONTHLY = contract basic; DAILY/HOURLY = rate × units). */
  basicSalary: Prisma.Decimal;
  totalAllowances: Prisma.Decimal;
  /** Component deductions + absence + delay + employee GOSI. */
  totalDeductions: Prisma.Decimal;
  loanDeductions: Prisma.Decimal;
  overtimeBonus: Prisma.Decimal;
  netSalary: Prisma.Decimal;
  /** Breakdown for debugging / future slip detail (not persisted). */
  breakdown: {
    componentDeductions: Prisma.Decimal;
    absenceDeduction: Prisma.Decimal;
    delayDeduction: Prisma.Decimal;
    gosiEmployee: Prisma.Decimal;
  };
};

function money(d: Prisma.Decimal): Prisma.Decimal {
  return d.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

function weekdayNameUtc(date: Date): string {
  // AttendanceRecord.date is UTC-midnight @db.Date — use UTC day.
  const names = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ];
  return names[date.getUTCDay()];
}

function ratesForBasis(
  basis: SalaryBasis,
  contractBasic: Prisma.Decimal,
): { dayRate: Prisma.Decimal; hourRate: Prisma.Decimal; minuteRate: Prisma.Decimal } {
  if (basis === SalaryBasis.HOURLY) {
    const hourRate = contractBasic;
    const dayRate = hourRate.times(HOURS_PER_DAY);
    return { dayRate, hourRate, minuteRate: hourRate.div(60) };
  }
  if (basis === SalaryBasis.DAILY) {
    const dayRate = contractBasic;
    const hourRate = dayRate.div(HOURS_PER_DAY);
    return { dayRate, hourRate, minuteRate: hourRate.div(60) };
  }
  // MONTHLY — KSA: /30 then /8
  const dayRate = contractBasic.div(DAYS_IN_MONTH);
  const hourRate = dayRate.div(HOURS_PER_DAY);
  return { dayRate, hourRate, minuteRate: hourRate.div(60) };
}

/**
 * Compute one employee's pay slip for a month from policy + attendance +
 * components + due loan installments. Pure (no DB).
 *
 * Salary basis:
 *  - MONTHLY: contract basic is the month salary; absences deduct day-rate.
 *  - DAILY:   contract basic is pay per worked day; earn rate × PRESENT
 *             (+ paid leave via excused multiplier); ABSENT earns nothing.
 *  - HOURLY:  contract basic is hourly rate; earn rate × regular hours from
 *             check-in/out (OT paid separately via overtimeBonus).
 */
export function calculateEmployeeSlip(input: {
  basicSalary: Prisma.Decimal;
  salaryBasis?: SalaryBasis;
  isGosiRegistered: boolean;
  components: Pick<SalaryComponent, 'type' | 'amount' | 'isPercentage'>[];
  attendance: AttendanceRow[];
  policy: Pick<
    CompanyPolicy,
    | 'delayDeductionType'
    | 'absenceMultiplierUnexcused'
    | 'absenceMultiplierExcused'
    | 'overtimeMultiplierNormal'
    | 'overtimeMultiplierHoliday'
    | 'gosiEmployeePercentage'
    | 'defaultWeekendDays'
  >;
  loanInstallmentAmounts: Prisma.Decimal[];
  /** Approved OVERTIME requests in the period (paid as max vs clock OT). */
  approvedOvertime?: OvertimeGrant[];
}): SlipCalc {
  const basis = input.salaryBasis ?? SalaryBasis.MONTHLY;
  const contractBasic = D(input.basicSalary);
  const { dayRate, hourRate, minuteRate } = ratesForBasis(basis, contractBasic);

  let earnedBasic = ZERO;
  let absenceDeduction = ZERO;
  let delayMinutesTotal = 0;
  let lateDays = 0;
  let overtimeBonus = ZERO;
  const weekends = new Set(
    (input.policy.defaultWeekendDays ?? []).map((d) => d.toUpperCase()),
  );

  for (const row of input.attendance) {
    if (basis === SalaryBasis.MONTHLY) {
      if (row.status === AttendanceStatus.ABSENT) {
        absenceDeduction = absenceDeduction.plus(
          dayRate.times(input.policy.absenceMultiplierUnexcused),
        );
      } else if (row.status === AttendanceStatus.LEAVE) {
        absenceDeduction = absenceDeduction.plus(
          dayRate.times(input.policy.absenceMultiplierExcused),
        );
      }
    } else if (basis === SalaryBasis.DAILY) {
      if (row.status === AttendanceStatus.PRESENT) {
        earnedBasic = earnedBasic.plus(dayRate);
      } else if (row.status === AttendanceStatus.LEAVE) {
        // excusedMultiplier 0 → full day paid; 1 → unpaid leave
        const paidFraction = D(1).minus(input.policy.absenceMultiplierExcused);
        if (paidFraction.greaterThan(0)) {
          earnedBasic = earnedBasic.plus(dayRate.times(paidFraction));
        }
      }
      // ABSENT → earn nothing (no separate absence deduction)
    } else {
      // HOURLY — pay regular hours from punches; LEAVE/ABSENT → 0
      if (
        row.status === AttendanceStatus.PRESENT &&
        row.checkIn &&
        row.checkOut
      ) {
        const workedMs = row.checkOut.getTime() - row.checkIn.getTime();
        if (workedMs > 0) {
          const workedHours = D(workedMs).div(3_600_000);
          const otHours = D(row.overtimeHours);
          const regular = Prisma.Decimal.max(workedHours.minus(otHours), ZERO);
          earnedBasic = earnedBasic.plus(regular.times(hourRate));
        }
      }
    }

    if (row.delayMinutes > 0) {
      delayMinutesTotal += row.delayMinutes;
      lateDays += 1;
    }
  }

  for (const day of resolvePaidOvertime(
    input.attendance,
    input.approvedOvertime,
  )) {
    if (!day.hours.greaterThan(0)) continue;
    const isWeekend = weekends.has(weekdayNameUtc(day.date));
    const mult = isWeekend
      ? input.policy.overtimeMultiplierHoliday
      : input.policy.overtimeMultiplierNormal;
    overtimeBonus = overtimeBonus.plus(day.hours.times(hourRate).times(mult));
  }

  if (basis === SalaryBasis.MONTHLY) {
    earnedBasic = contractBasic;
  }

  let allowances = ZERO;
  let componentDeductions = ZERO;
  for (const c of input.components) {
    const amount = c.isPercentage
      ? earnedBasic.times(c.amount).div(100)
      : D(c.amount);
    if (c.type === SalaryComponentType.ALLOWANCE) {
      allowances = allowances.plus(amount);
    } else {
      componentDeductions = componentDeductions.plus(amount);
    }
  }

  let delayDeduction = ZERO;
  if (input.policy.delayDeductionType === DelayDeductionType.PER_MINUTE) {
    delayDeduction = minuteRate.times(delayMinutesTotal);
  } else {
    // FIXED_AMOUNT: one hour-rate per late day (schema has no fixed SAR amount).
    delayDeduction = hourRate.times(lateDays);
  }

  let gosiEmployee = ZERO;
  if (input.isGosiRegistered) {
    const gosiBase = earnedBasic.plus(allowances);
    gosiEmployee = gosiBase.times(input.policy.gosiEmployeePercentage).div(100);
  }

  const loanDeductions = input.loanInstallmentAmounts.reduce(
    (sum, a) => sum.plus(a),
    ZERO,
  );

  const totalDeductions = money(
    componentDeductions
      .plus(absenceDeduction)
      .plus(delayDeduction)
      .plus(gosiEmployee),
  );

  const net = money(
    earnedBasic
      .plus(allowances)
      .plus(overtimeBonus)
      .minus(totalDeductions)
      .minus(loanDeductions),
  );

  return {
    basicSalary: money(earnedBasic),
    totalAllowances: money(allowances),
    totalDeductions,
    loanDeductions: money(loanDeductions),
    overtimeBonus: money(overtimeBonus),
    // Never pay negative — floor at 0 for snapshot safety.
    netSalary: net.lessThan(0) ? ZERO : net,
    breakdown: {
      componentDeductions: money(componentDeductions),
      absenceDeduction: money(absenceDeduction),
      delayDeduction: money(delayDeduction),
      gosiEmployee: money(gosiEmployee),
    },
  };
}

/** Inclusive UTC date range for a calendar month (for @db.Date filters). */
export function monthDateRange(year: number, month: number): {
  from: Date;
  to: Date;
} {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 0)); // last day of month
  return { from, to };
}

export function formatMonthLabel(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Unused export kept for WPS / reports that need YMD strings. */
export { formatYmd };
