"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const database_service_1 = require("../../database/database.service");
const hashing_service_1 = require("../../core/hashing/hashing.service");
const limits_service_1 = require("../platform/limits.service");
const roles_constant_1 = require("../../common/constants/roles.constant");
const page_dto_1 = require("../../common/pagination/page.dto");
const page_meta_dto_1 = require("../../common/pagination/page-meta.dto");
const SORTABLE = ['createdAt', 'updatedAt', 'name', 'basicSalary'];
let EmployeeService = class EmployeeService {
    db;
    hashing;
    limits;
    constructor(db, hashing, limits) {
        this.db = db;
        this.hashing = hashing;
        this.limits = limits;
    }
    async create(companyId, dto) {
        await this.limits.assertCanAddEmployee(companyId);
        const existing = await this.db.user.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            throw new common_1.ConflictException('Email is already registered');
        }
        if (dto.isGosiRegistered && !dto.gosiNumber) {
            throw new common_1.BadRequestException('gosiNumber is required when isGosiRegistered is true');
        }
        if (dto.shiftId) {
            await this.assertShiftInCompany(companyId, dto.shiftId);
        }
        const temporaryPassword = generateTempPassword();
        const passwordHash = await this.hashing.hash(temporaryPassword);
        const employee = await this.db.$transaction(async (tx) => {
            const role = await tx.role.upsert({
                where: { companyId_name: { companyId, name: roles_constant_1.EMPLOYEE_ROLE } },
                create: { companyId, name: roles_constant_1.EMPLOYEE_ROLE },
                update: {},
            });
            const user = await tx.user.create({
                data: {
                    email: dto.email,
                    password: passwordHash,
                    companyId,
                    roleId: role.id,
                    isPortalUser: true,
                },
            });
            return tx.employee.create({
                data: {
                    companyId,
                    userId: user.id,
                    name: dto.name,
                    basicSalary: dto.basicSalary,
                    employmentType: dto.employmentType,
                    salaryBasis: dto.salaryBasis,
                    shiftId: dto.shiftId,
                    isGosiRegistered: dto.isGosiRegistered,
                    gosiNumber: dto.gosiNumber,
                },
            });
        });
        return {
            ...employee,
            portalCredentials: { email: dto.email, temporaryPassword },
        };
    }
    async findAll(companyId, query) {
        const search = query.search?.trim();
        const where = {
            companyId,
            ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
            ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
        };
        const orderBy = SORTABLE.includes(query.orderBy)
            ? query.orderBy
            : 'createdAt';
        const [data, itemCount] = await Promise.all([
            this.db.employee.findMany({
                where,
                orderBy: { [orderBy]: query.prismaOrder },
                skip: query.skip,
                take: query.limit,
                include: {
                    shift: {
                        select: {
                            id: true,
                            name: true,
                            startTime: true,
                            endTime: true,
                        },
                    },
                },
            }),
            this.db.employee.count({ where }),
        ]);
        return new page_dto_1.PageDto(data, new page_meta_dto_1.PageMetaDto({ pageOptionsDto: query, itemCount }));
    }
    async findOne(companyId, id) {
        const employee = await this.db.employee.findFirst({
            where: { id, companyId },
            include: {
                shift: {
                    select: {
                        id: true,
                        name: true,
                        startTime: true,
                        endTime: true,
                    },
                },
            }
        });
        if (!employee) {
            throw new common_1.NotFoundException('Employee not found');
        }
        return employee;
    }
    async update(companyId, id, dto) {
        await this.findOne(companyId, id);
        if (dto.shiftId) {
            await this.assertShiftInCompany(companyId, dto.shiftId);
        }
        return this.db.employee.update({
            where: { id },
            data: dto,
        });
    }
    async assertShiftInCompany(companyId, shiftId) {
        const shift = await this.db.shift.findFirst({
            where: { id: shiftId, companyId },
            select: { id: true },
        });
        if (!shift) {
            throw new common_1.BadRequestException('Shift not found in your company');
        }
    }
};
exports.EmployeeService = EmployeeService;
exports.EmployeeService = EmployeeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        hashing_service_1.HashingService,
        limits_service_1.LimitsService])
], EmployeeService);
function generateTempPassword() {
    return crypto.randomBytes(9).toString('base64url');
}
//# sourceMappingURL=employee.service.js.map