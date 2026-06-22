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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const ioredis_1 = __importDefault(require("ioredis"));
const redis_module_1 = require("../redis/redis.module");
let CurrencyInterceptor = class CurrencyInterceptor {
    redis;
    PRICE_FIELDS = /(price|total|discount|fee|amount|subtotal|min|max)$/i;
    SKIP_PATTERNS = ['/auth/', '/users/', '/admin/users/'];
    constructor(redis) {
        this.redis = redis;
    }
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        if (this.SKIP_PATTERNS.some((p) => req.url.includes(p))) {
            return next.handle();
        }
        const targetCurrency = req.headers['x-currency'] || 'EGP';
        return next.handle().pipe((0, operators_1.switchMap)(async (data) => {
            const rate = await this.getRate(targetCurrency);
            return this.convertFields(data, rate);
        }));
    }
    async getRate(currency) {
        if (currency === 'EGP')
            return 1;
        const rate = await this.redis.hget('exchange_rates', currency);
        if (!rate) {
            throw new common_1.ServiceUnavailableException('Exchange rates unavailable');
        }
        return parseFloat(rate);
    }
    convertFields(data, rate) {
        if (typeof data === 'number') {
            return Math.round(data * rate * 100) / 100;
        }
        if (Array.isArray(data)) {
            return data.map((i) => this.convertFields(i, rate));
        }
        if (data && typeof data === 'object' && !(data instanceof Date)) {
            return Object.fromEntries(Object.entries(data).map(([k, v]) => [
                k,
                this.PRICE_FIELDS.test(k) && typeof v === 'number'
                    ? Math.round((v / 100) * rate * 100) / 100
                    : this.convertFields(v, rate),
            ]));
        }
        return data;
    }
};
exports.CurrencyInterceptor = CurrencyInterceptor;
exports.CurrencyInterceptor = CurrencyInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(redis_module_1.REDIS_CLIENT)),
    __metadata("design:paramtypes", [ioredis_1.default])
], CurrencyInterceptor);
//# sourceMappingURL=currency.interceptor.js.map