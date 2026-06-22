"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let TranslationInterceptor = class TranslationInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        if (request.headers['x-skip-translation'] === 'true' ||
            request.url.includes('/admin/') ||
            request.url.includes('/api/admin/')) {
            return next.handle();
        }
        const rawLang = request.headers['accept-language'] || request.headers['x-language'];
        const lang = rawLang?.toLowerCase().startsWith('ar') ? 'ar' : 'en';
        return next.handle().pipe((0, operators_1.map)((data) => this.transform(data, lang)));
    }
    transform(data, lang) {
        if (data === null ||
            data === undefined ||
            typeof data !== 'object' ||
            data instanceof Date) {
            return data;
        }
        if (Array.isArray(data)) {
            return data.map((item) => this.transform(item, lang));
        }
        const keys = Object.keys(data);
        if ('ar' in data && 'en' in data && keys.length <= 3) {
            return data[lang] || data['en'] || data['ar'] || '';
        }
        const result = {};
        for (const key of keys) {
            result[key] = this.transform(data[key], lang);
        }
        return result;
    }
};
exports.TranslationInterceptor = TranslationInterceptor;
exports.TranslationInterceptor = TranslationInterceptor = __decorate([
    (0, common_1.Injectable)()
], TranslationInterceptor);
//# sourceMappingURL=translation.interceptor.js.map