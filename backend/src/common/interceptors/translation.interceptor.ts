import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TranslationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // Skip admin routes and explicit bypass
    if (
      request.headers['x-skip-translation'] === 'true' ||
      request.url.includes('/admin/') ||
      request.url.includes('/api/admin/')
    ) {
      return next.handle();
    }

    const rawLang =
      request.headers['accept-language'] || request.headers['x-language'];
    const lang = rawLang?.toLowerCase().startsWith('ar') ? 'ar' : 'en';

    return next.handle().pipe(map((data) => this.transform(data, lang)));
  }

  private transform(data: any, lang: string): any {
    if (
      data === null ||
      data === undefined ||
      typeof data !== 'object' ||
      data instanceof Date
    ) {
      return data;
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.transform(item, lang));
    }

    const keys = Object.keys(data);
    // Detection: object with ar+en keys and <=3 total keys = translation object
    if ('ar' in data && 'en' in data && keys.length <= 3) {
      return data[lang] || data['en'] || data['ar'] || '';
    }

    const result: Record<string, any> = {};
    for (const key of keys) {
      result[key] = this.transform(data[key], lang);
    }
    return result;
  }
}
