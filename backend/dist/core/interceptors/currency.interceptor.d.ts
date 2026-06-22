import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import Redis from 'ioredis';
export declare class CurrencyInterceptor implements NestInterceptor {
    private readonly redis;
    private readonly PRICE_FIELDS;
    private readonly SKIP_PATTERNS;
    constructor(redis: Redis);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private getRate;
    private convertFields;
}
