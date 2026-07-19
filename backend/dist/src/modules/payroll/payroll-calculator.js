"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatYmd = void 0;
exports.calculateEmployeeSlip = calculateEmployeeSlip;
exports.monthDateRange = monthDateRange;
exports.formatMonthLabel = formatMonthLabel;
const client_1 = require("@prisma/client");
const attendance_time_util_1 = require("../../common/utils/attendance-time.util");
Object.defineProperty(exports, "formatYmd", { enumerable: true, get: function () { return attendance_time_util_1.formatYmd; } });
const D = (n) => new client_1.Prisma.Decimal(n);
const ZERO = D(0);
const DAYS_IN_MONTH = 30;
const HOURS_PER_DAY = 8;
function money(d) {
    return d.toDecimalPlaces(2, client_1.Prisma.Decimal.ROUND_HALF_UP);
}
function weekdayNameUtc(date) {
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
function ratesForBasis(basis, contractBasic) {
    if (basis === client_1.SalaryBasis.HOURLY) {
        const hourRate = contractBasic;
        const dayRate = hourRate.times(HOURS_PER_DAY);
        return { dayRate, hourRate, minuteRate: hourRate.div(60) };
    }
    if (basis === client_1.SalaryBasis.DAILY) {
        const dayRate = contractBasic;
        const hourRate = dayRate.div(HOURS_PER_DAY);
        return { dayRate, hourRate, minuteRate: hourRate.div(60) };
    }
    const dayRate = contractBasic.div(DAYS_IN_MONTH);
    const hourRate = dayRate.div(HOURS_PER_DAY);
    return { dayRate, hourRate, minuteRate: hourRate.div(60) };
}
function calculateEmployeeSlip(input) {
    const basis = input.salaryBasis ?? client_1.SalaryBasis.MONTHLY;
    const contractBasic = D(input.basicSalary);
    const { dayRate, hourRate, minuteRate } = ratesForBasis(basis, contractBasic);
    let earnedBasic = ZERO;
    let absenceDeduction = ZERO;
    let delayMinutesTotal = 0;
    let lateDays = 0;
    let overtimeBonus = ZERO;
    const weekends = new Set((input.policy.defaultWeekendDays ?? []).map((d) => d.toUpperCase()));
    for (const row of input.attendance) {
        if (basis === client_1.SalaryBasis.MONTHLY) {
            if (row.status === client_1.AttendanceStatus.ABSENT) {
                absenceDeduction = absenceDeduction.plus(dayRate.times(input.policy.absenceMultiplierUnexcused));
            }
            else if (row.status === client_1.AttendanceStatus.LEAVE) {
                absenceDeduction = absenceDeduction.plus(dayRate.times(input.policy.absenceMultiplierExcused));
            }
        }
        else if (basis === client_1.SalaryBasis.DAILY) {
            if (row.status === client_1.AttendanceStatus.PRESENT) {
                earnedBasic = earnedBasic.plus(dayRate);
            }
            else if (row.status === client_1.AttendanceStatus.LEAVE) {
                const paidFraction = D(1).minus(input.policy.absenceMultiplierExcused);
                if (paidFraction.greaterThan(0)) {
                    earnedBasic = earnedBasic.plus(dayRate.times(paidFraction));
                }
            }
        }
        else {
            if (row.status === client_1.AttendanceStatus.PRESENT &&
                row.checkIn &&
                row.checkOut) {
                const workedMs = row.checkOut.getTime() - row.checkIn.getTime();
                if (workedMs > 0) {
                    const workedHours = D(workedMs).div(3_600_000);
                    const otHours = D(row.overtimeHours);
                    const regular = client_1.Prisma.Decimal.max(workedHours.minus(otHours), ZERO);
                    earnedBasic = earnedBasic.plus(regular.times(hourRate));
                }
            }
        }
        if (row.delayMinutes > 0) {
            delayMinutesTotal += row.delayMinutes;
            lateDays += 1;
        }
        const otHours = D(row.overtimeHours);
        if (otHours.greaterThan(0)) {
            const isWeekend = weekends.has(weekdayNameUtc(row.date));
            const mult = isWeekend
                ? input.policy.overtimeMultiplierHoliday
                : input.policy.overtimeMultiplierNormal;
            overtimeBonus = overtimeBonus.plus(otHours.times(hourRate).times(mult));
        }
    }
    if (basis === client_1.SalaryBasis.MONTHLY) {
        earnedBasic = contractBasic;
    }
    let allowances = ZERO;
    let componentDeductions = ZERO;
    for (const c of input.components) {
        const amount = c.isPercentage
            ? earnedBasic.times(c.amount).div(100)
            : D(c.amount);
        if (c.type === client_1.SalaryComponentType.ALLOWANCE) {
            allowances = allowances.plus(amount);
        }
        else {
            componentDeductions = componentDeductions.plus(amount);
        }
    }
    let delayDeduction = ZERO;
    if (input.policy.delayDeductionType === client_1.DelayDeductionType.PER_MINUTE) {
        delayDeduction = minuteRate.times(delayMinutesTotal);
    }
    else {
        delayDeduction = hourRate.times(lateDays);
    }
    let gosiEmployee = ZERO;
    if (input.isGosiRegistered) {
        const gosiBase = earnedBasic.plus(allowances);
        gosiEmployee = gosiBase.times(input.policy.gosiEmployeePercentage).div(100);
    }
    const loanDeductions = input.loanInstallmentAmounts.reduce((sum, a) => sum.plus(a), ZERO);
    const totalDeductions = money(componentDeductions
        .plus(absenceDeduction)
        .plus(delayDeduction)
        .plus(gosiEmployee));
    const net = money(earnedBasic
        .plus(allowances)
        .plus(overtimeBonus)
        .minus(totalDeductions)
        .minus(loanDeductions));
    return {
        basicSalary: money(earnedBasic),
        totalAllowances: money(allowances),
        totalDeductions,
        loanDeductions: money(loanDeductions),
        overtimeBonus: money(overtimeBonus),
        netSalary: net.lessThan(0) ? ZERO : net,
        breakdown: {
            componentDeductions: money(componentDeductions),
            absenceDeduction: money(absenceDeduction),
            delayDeduction: money(delayDeduction),
            gosiEmployee: money(gosiEmployee),
        },
    };
}
function monthDateRange(year, month) {
    const from = new Date(Date.UTC(year, month - 1, 1));
    const to = new Date(Date.UTC(year, month, 0));
    return { from, to };
}
function formatMonthLabel(year, month) {
    return `${year}-${String(month).padStart(2, '0')}`;
}
//# sourceMappingURL=payroll-calculator.js.map