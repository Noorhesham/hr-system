import {
  AttendanceStatus,
  DelayDeductionType,
  Prisma,
  SalaryBasis,
  SalaryComponentType,
} from '@prisma/client';
import { calculateEmployeeSlip } from './payroll-calculator';

const D = (n: number) => new Prisma.Decimal(n);

const basePolicy = {
  delayDeductionType: DelayDeductionType.PER_MINUTE,
  absenceMultiplierUnexcused: new Prisma.Decimal(1),
  absenceMultiplierExcused: new Prisma.Decimal(0),
  overtimeMultiplierNormal: new Prisma.Decimal(1.5),
  overtimeMultiplierHoliday: new Prisma.Decimal(2),
  gosiEmployeePercentage: new Prisma.Decimal(9.75),
  defaultWeekendDays: ['FRIDAY', 'SATURDAY'],
};

describe('calculateEmployeeSlip — salary basis', () => {
  it('MONTHLY keeps contract basic and deducts absence day-rate', () => {
    const slip = calculateEmployeeSlip({
      basicSalary: D(3000),
      salaryBasis: SalaryBasis.MONTHLY,
      isGosiRegistered: false,
      components: [],
      attendance: [
        {
          date: new Date(Date.UTC(2026, 6, 1)),
          status: AttendanceStatus.ABSENT,
          delayMinutes: 0,
          overtimeHours: D(0),
        },
      ],
      policy: basePolicy,
      loanInstallmentAmounts: [],
    });
    // day-rate = 3000/30 = 100
    expect(slip.basicSalary.toNumber()).toBe(3000);
    expect(slip.breakdown.absenceDeduction.toNumber()).toBe(100);
    expect(slip.netSalary.toNumber()).toBe(2900);
  });

  it('DAILY earns rate × PRESENT days (ABSENT pays nothing)', () => {
    const day = (d: number, status: AttendanceStatus) => ({
      date: new Date(Date.UTC(2026, 6, d)),
      status,
      delayMinutes: 0,
      overtimeHours: D(0),
    });
    const slip = calculateEmployeeSlip({
      basicSalary: D(200),
      salaryBasis: SalaryBasis.DAILY,
      isGosiRegistered: false,
      components: [
        {
          type: SalaryComponentType.ALLOWANCE,
          amount: D(15),
          isPercentage: false,
        },
      ],
      attendance: [
        day(1, AttendanceStatus.PRESENT),
        day(2, AttendanceStatus.PRESENT),
        day(3, AttendanceStatus.PRESENT),
        day(4, AttendanceStatus.ABSENT),
      ],
      policy: basePolicy,
      loanInstallmentAmounts: [],
    });
    expect(slip.basicSalary.toNumber()).toBe(600); // 200 × 3
    expect(slip.totalAllowances.toNumber()).toBe(15);
    expect(slip.breakdown.absenceDeduction.toNumber()).toBe(0);
    expect(slip.netSalary.toNumber()).toBe(615);
  });

  it('HOURLY earns rate × regular hours; OT paid separately', () => {
    const checkIn = new Date('2026-07-15T08:00:00+03:00');
    const checkOut = new Date('2026-07-15T18:00:00+03:00'); // 10h worked
    const slip = calculateEmployeeSlip({
      basicSalary: D(25),
      salaryBasis: SalaryBasis.HOURLY,
      isGosiRegistered: false,
      components: [],
      attendance: [
        {
          date: new Date(Date.UTC(2026, 6, 15)),
          status: AttendanceStatus.PRESENT,
          delayMinutes: 0,
          overtimeHours: D(2), // 2h OT → regular = 8
          checkIn,
          checkOut,
        },
      ],
      policy: basePolicy,
      loanInstallmentAmounts: [],
    });
    expect(slip.basicSalary.toNumber()).toBe(200); // 25 × 8
    expect(slip.overtimeBonus.toNumber()).toBe(75); // 2 × 25 × 1.5
    expect(slip.netSalary.toNumber()).toBe(275);
  });
});
