import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Recursively converts every Prisma.Decimal in the response payload to a plain
 * JS number, so clients receive `9.75` instead of decimal.js internals
 * (`{ s, e, d }`).
 *
 * IMPORTANT: this must run BEFORE the TranslationInterceptor, which rebuilds the
 * response object recursively and would otherwise flatten a Decimal instance
 * into a plain `{ s, e, d }` object (losing `.toNumber()`). Register it LAST in
 * `useGlobalInterceptors(...)` so it processes the response FIRST.
 *
 * Detection is by shape (toNumber + s/e/d) rather than `instanceof`, which can
 * fail across duplicate decimal.js copies.
 */
@Injectable()
export class DecimalInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => convertDecimals(data)));
  }
}

function isDecimal(v: any): boolean {
  return (
    v !== null &&
    typeof v === 'object' &&
    typeof v.toNumber === 'function' &&
    Array.isArray(v.d) &&
    typeof v.e === 'number' &&
    typeof v.s === 'number'
  );
}

function convertDecimals(value: any): any {
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
  // Recurse into ANY other object — including class instances such as PageDto /
  // PageMetaDto (paginated responses), whose nested Decimals must be converted.
  for (const key of Object.keys(value)) {
    value[key] = convertDecimals(value[key]);
  }
  return value;
}
