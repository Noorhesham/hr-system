import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ServiceUnavailableException,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class CurrencyInterceptor implements NestInterceptor {
  private readonly PRICE_FIELDS = /(price|total|discount|fee|amount|subtotal|min|max)$/i;
  private readonly SKIP_PATTERNS = ['/auth/', '/users/', '/admin/users/'];

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    if (this.SKIP_PATTERNS.some((p) => req.url.includes(p))) {
      return next.handle();
    }

    const targetCurrency = req.headers['x-currency'] || 'EGP';

    return next.handle().pipe(
      switchMap(async (data) => {
        const rate = await this.getRate(targetCurrency);
        return this.convertFields(data, rate);
      }),
    );
  }

  private async getRate(currency: string): Promise<number> {
    if (currency === 'EGP') return 1;
    const rate = await this.redis.hget('exchange_rates', currency);
    if (!rate) {
      throw new ServiceUnavailableException('Exchange rates unavailable');
    }
    return parseFloat(rate);
  }

  private convertFields(data: any, rate: number): any {
    if (typeof data === 'number') {
      return Math.round(data * rate * 100) / 100;
    }
    if (Array.isArray(data)) {
      return data.map((i) => this.convertFields(i, rate));
    }
    if (data && typeof data === 'object' && !(data instanceof Date)) {
      return Object.fromEntries(
        Object.entries(data).map(([k, v]) => [
          k,
          this.PRICE_FIELDS.test(k) && typeof v === 'number'
            ? Math.round((v / 100) * rate * 100) / 100
            : this.convertFields(v, rate),
        ]),
      );
    }
    return data;
  }
}
