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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_settings_service_1 = require("./platform-settings.service");
const update_platform_setting_dto_1 = require("./dto/update-platform-setting.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const platform_admin_guard_1 = require("./guards/platform-admin.guard");
let PlatformController = class PlatformController {
    settings;
    constructor(settings) {
        this.settings = settings;
    }
    getSettings() {
        return this.settings.getSettings();
    }
    updateSettings(dto) {
        return this.settings.updateSettings(dto);
    }
};
exports.PlatformController = PlatformController;
__decorate([
    (0, common_1.Get)('settings'),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PlatformController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Patch)('settings'),
    (0, swagger_1.ApiBody)({
        type: update_platform_setting_dto_1.UpdatePlatformSettingDto,
        examples: {
            default: {
                summary: 'Update platform defaults',
                value: { defaultTrialMaxEmployees: 25, trialDays: 30 },
            },
        },
    }),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_platform_setting_dto_1.UpdatePlatformSettingDto]),
    __metadata("design:returntype", void 0)
], PlatformController.prototype, "updateSettings", null);
exports.PlatformController = PlatformController = __decorate([
    (0, swagger_1.ApiTags)('Platform'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('platform'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, platform_admin_guard_1.PlatformAdminGuard),
    __metadata("design:paramtypes", [platform_settings_service_1.PlatformSettingsService])
], PlatformController);
//# sourceMappingURL=platform.controller.js.map