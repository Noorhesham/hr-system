"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecimalInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let DecimalInterceptor = class DecimalInterceptor {
    intercept(_context, next) {
        return next.handle().pipe((0, operators_1.map)((data) => convertDecimals(data)));
    }
};
exports.DecimalInterceptor = DecimalInterceptor;
exports.DecimalInterceptor = DecimalInterceptor = __decorate([
    (0, common_1.Injectable)()
], DecimalInterceptor);
function isDecimal(v) {
    return (v !== null &&
        typeof v === 'object' &&
        typeof v.toNumber === 'function' &&
        Array.isArray(v.d) &&
        typeof v.e === 'number' &&
        typeof v.s === 'number');
}
function convertDecimals(value) {
    if (value === null || typeof value !== 'object') {
        return value;
    }
    if (isDecimal(value)) {
        return value.toNumber();
    }
    if (value instanceof Date || Buffer.isBuffer(value)) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(convertDecimals);
    }
    for (const key of Object.keys(value)) {
        value[key] = convertDecimals(value[key]);
    }
    return value;
}
//# sourceMappingURL=decimal.interceptor.js.map