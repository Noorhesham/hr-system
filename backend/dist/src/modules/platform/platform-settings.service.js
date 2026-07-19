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
exports.PlatformSettingsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const SINGLETON_ID = 'global';
let PlatformSettingsService = class PlatformSettingsService {
    db;
    constructor(db) {
        this.db = db;
    }
    async getSettings() {
        const existing = await this.db.platformSetting.findUnique({
            where: { id: SINGLETON_ID },
        });
        if (existing) {
            return existing;
        }
        try {
            return await this.db.platformSetting.create({
                data: { id: SINGLETON_ID },
            });
        }
        catch {
            return this.db.platformSetting.findUniqueOrThrow({
                where: { id: SINGLETON_ID },
            });
        }
    }
    updateSettings(input) {
        return this.db.platformSetting.upsert({
            where: { id: SINGLETON_ID },
            create: { id: SINGLETON_ID, ...input },
            update: input,
        });
    }
};
exports.PlatformSettingsService = PlatformSettingsService;
exports.PlatformSettingsService = PlatformSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], PlatformSettingsService);
//# sourceMappingURL=platform-settings.service.js.map