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
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
let NotificationService = NotificationService_1 = class NotificationService {
    db;
    logger = new common_1.Logger(NotificationService_1.name);
    constructor(db) {
        this.db = db;
    }
    async create(input) {
        const row = await this.db.notification.create({
            data: {
                companyId: input.companyId,
                userId: input.userId,
                title: input.title,
                body: input.body,
                type: input.type,
                link: input.link ?? null,
            },
        });
        if (input.emailTo) {
            this.logger.log(`[email] to=${input.emailTo} subject="${input.title}" body="${input.body}"`);
        }
        return row;
    }
    async createMany(inputs) {
        const out = [];
        for (const input of inputs) {
            out.push(await this.create(input));
        }
        return out;
    }
    async listForUser(actor, limit = 30) {
        const [items, unreadCount] = await Promise.all([
            this.db.notification.findMany({
                where: { userId: actor.userId, companyId: actor.companyId },
                orderBy: { createdAt: 'desc' },
                take: Math.min(limit, 100),
            }),
            this.db.notification.count({
                where: {
                    userId: actor.userId,
                    companyId: actor.companyId,
                    readAt: null,
                },
            }),
        ]);
        return { items, unreadCount };
    }
    async markRead(actor, id) {
        const row = await this.db.notification.findFirst({
            where: { id, userId: actor.userId, companyId: actor.companyId },
        });
        if (!row)
            throw new common_1.NotFoundException('Notification not found');
        return this.db.notification.update({
            where: { id },
            data: { readAt: new Date() },
        });
    }
    async markAllRead(actor) {
        await this.db.notification.updateMany({
            where: {
                userId: actor.userId,
                companyId: actor.companyId,
                readAt: null,
            },
            data: { readAt: new Date() },
        });
        return { success: true };
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map