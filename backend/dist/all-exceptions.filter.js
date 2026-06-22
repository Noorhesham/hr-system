"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    logger = new common_1.Logger(AllExceptionsFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();
        let status = 500;
        let message = 'Internal server error';
        let fieldErrors;
        let errorCode;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const body = exception.getResponse();
            message = body.message || exception.message;
            fieldErrors = body.fieldErrors;
            errorCode = body.errorCode;
        }
        else if (exception &&
            typeof exception === 'object' &&
            'code' in exception &&
            exception.code?.startsWith('P')) {
            const err = exception;
            if (err.code === 'P2002') {
                status = 409;
                const field = err.meta?.target?.[0];
                message = `${field || 'Value'} already exists`;
                fieldErrors = field ? { [field]: message } : undefined;
            }
            else if (err.code === 'P2025') {
                status = 404;
                message = 'Record not found';
            }
            else {
                status = 400;
                message = 'Database error';
            }
        }
        else if (exception &&
            typeof exception === 'object' &&
            'name' in exception &&
            exception.name === 'PrismaClientValidationError') {
            status = 422;
            message =
                process.env.NODE_ENV === 'production'
                    ? 'Invalid data provided'
                    : exception.message;
        }
        this.logger.error(`${req.method} ${req.url} → ${status}`, exception instanceof Error ? exception.stack : String(exception));
        res.status(status).json({
            statusCode: status,
            message,
            ...(fieldErrors && { fieldErrors }),
            ...(errorCode && { errorCode }),
            timestamp: new Date().toISOString(),
            path: req.url,
        });
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map