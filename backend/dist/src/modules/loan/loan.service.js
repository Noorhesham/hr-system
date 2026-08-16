"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const database_service_1 = require("../../database/database.service");
const page_dto_1 = require("../../common/pagination/page.dto");
const page_meta_dto_1 = require("../../common/pagination/page-meta.dto");
const attendance_time_util_1 = require("../../common/utils/attendance-time.util");
const SORTABLE = ['createdAt', 'updatedAt', 'totalAmount'];
let LoanService = class LoanService {
    db;
    constructor(db) {
        this.db = db;
    }
    async create(companyId, employeeId, dto) {
        await this.assertEmployeeInCompany(companyId, employeeId);
        return this.db.loan.create({
            data: {
                employeeId,
                totalAmount: new client_1.Prisma.Decimal(dto.totalAmount),
                status: client_1.LoanStatus.PENDING,
            },
        });
    }
    async findAllForEmployee(companyId, employeeId) {
        await this.assertEmployeeInCompany(companyId, employeeId);
        return this.db.loan.findMany({
            where: { employeeId },
            orderBy: { createdAt: 'desc' },
            include: { installments: { orderBy: { dueDate: 'asc' } } },
        });
    }
    async findAll(companyId, query) {
        const where = {
            employee: { companyId },
            ...(query.status ? { status: query.status } : {}),
            ...(query.employeeId ? { employeeId: query.employeeId } : {}),
        };
        const orderBy = SORTABLE.includes(query.orderBy) ? query.orderBy : 'createdAt';
        const [data, itemCount] = await Promise.all([
            this.db.loan.findMany({
                where,
                orderBy: { [orderBy]: query.prismaOrder },
                skip: query.skip,
                take: query.limit,
                include: { employee: { select: { id: true, name: true } } },
            }),
            this.db.loan.count({ where }),
        ]);
        return new page_dto_1.PageDto(data, new page_meta_dto_1.PageMetaDto({ pageOptionsDto: query, itemCount }));
    }
    async findOne(companyId, id) {
        const loan = await this.db.loan.findFirst({
            where: { id, employee: { companyId } },
            include: {
                employee: { select: { id: true, name: true } },
                installments: { orderBy: { dueDate: 'asc' } },
            },
        });
        if (!loan) {
            throw new common_1.NotFoundException('Loan not found');
        }
        return loan;
    }
    async approve(companyId, id, dto) {
        const loan = await this.getOwnedOrThrow(companyId, id);
        if (loan.status !== client_1.LoanStatus.PENDING) {
            throw new common_1.ConflictException(`Only a PENDING loan can be approved (current status: ${loan.status})`);
        }
        const hasCount = dto.numberOfInstallments !== undefined;
        const hasAmount = dto.installmentAmount !== undefined;
        if (hasCount === hasAmount) {
            throw new common_1.BadRequestException('Provide exactly one of numberOfInstallments or installmentAmount');
        }
        const totalCents = loan.totalAmount.times(100).toNumber();
        const perCents = this.buildInstallmentCents(totalCents, dto.numberOfInstallments, dto.installmentAmount);
        const start = (0, attendance_time_util_1.parseDateOnly)(dto.startDate);
        const installmentsData = perCents.map((cents, i) => ({
            loanId: loan.id,
            amount: new client_1.Prisma.Decimal(cents).dividedBy(100),
            dueDate: addUtcMonths(start, i),
            status: client_1.LoanInstallmentStatus.PENDING,
        }));
        return this.db.$transaction(async (tx) => {
            await tx.loanInstallment.createMany({ data: installmentsData });
            return tx.loan.update({
                where: { id: loan.id },
                data: { status: client_1.LoanStatus.APPROVED },
                include: { installments: { orderBy: { dueDate: 'asc' } } },
            });
        });
    }
    async remove(companyId, id) {
        const loan = await this.getOwnedOrThrow(companyId, id);
        if (loan.status !== client_1.LoanStatus.PENDING) {
            throw new common_1.ConflictException('Only a PENDING loan can be deleted');
        }
        await this.db.loan.delete({ where: { id } });
        return { success: true };
    }
    buildInstallmentCents(totalCents, numberOfInstallments, installmentAmount) {
        if (numberOfInstallments !== undefined) {
            const n = numberOfInstallments;
            const base = Math.floor(totalCents / n);
            const amounts = new Array(n).fill(base);
            amounts[n - 1] += totalCents - base * n;
            return amounts;
        }
        const perCents = Math.round(installmentAmount * 100);
        if (perCents >= totalCents) {
            return [totalCents];
        }
        const fullCount = Math.floor(totalCents / perCents);
        const remainder = totalCents - fullCount * perCents;
        const amounts = new Array(fullCount).fill(perCents);
        if (remainder > 0) {
            amounts.push(remainder);
        }
        return amounts;
    }
    async assertEmployeeInCompany(companyId, employeeId) {
        const employee = await this.db.employee.findFirst({
            where: { id: employeeId, companyId },
            select: { id: true },
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee not found');
        }
    }
    async getOwnedOrThrow(companyId, id) {
        const loan = await this.db.loan.findFirst({
            where: { id, employee: { companyId } },
        });
        if (!loan) {
            throw new common_1.NotFoundException('Loan not found');
        }
        return loan;
    }
};
exports.LoanService = LoanService;
exports.LoanService = LoanService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], LoanService);
function addUtcMonths(date, months) {
    const d = new Date(date);
    d.setUTCMonth(d.getUTCMonth() + months);
    return d;
}
//# sourceMappingURL=loan.service.js.map