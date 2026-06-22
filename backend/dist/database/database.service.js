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
var DatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
let DatabaseService = DatabaseService_1 = class DatabaseService extends client_1.PrismaClient {
    logger = new common_1.Logger(DatabaseService_1.name);
    constructor() {
        const pool = new pg_1.Pool({
            connectionString: process.env.DATABASE_URL,
            max: 50,
            idleTimeoutMillis: 30_000,
            connectionTimeoutMillis: 5_000,
        });
        super({ adapter: new adapter_pg_1.PrismaPg(pool) });
    }
    async onModuleInit() {
        await this.$connect();
        this.logger.log('Database connected');
    }
    async searchJsonFields(table, jsonField, term) {
        const safe = (s) => s.replace(/['"\\;]/g, '');
        const t = safe(table);
        const f = safe(jsonField);
        const words = term.trim().split(/\s+/);
        const conditions = words
            .map((w) => `("${f}"->>'en' ILIKE '%${safe(w)}%' OR "${f}"->>'ar' ILIKE '%${safe(w)}%')`)
            .join(' AND ');
        const rows = await this.$queryRawUnsafe(`SELECT id FROM "${t}" WHERE ${conditions}`);
        return rows.map((r) => r.id);
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = DatabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], DatabaseService);
//# sourceMappingURL=database.service.js.map