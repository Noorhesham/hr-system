import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = 500;
    let message: string | string[] = 'Internal server error';
    let fieldErrors: Record<string, string> | undefined;
    let errorCode: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as any;
      message = body.message || exception.message;
      fieldErrors = body.fieldErrors;
      errorCode = body.errorCode;
    } else if (
      exception &&
      typeof exception === 'object' &&
      'code' in exception &&
      (exception as any).code?.startsWith('P')
    ) {
      // Prisma error detection (using code prefix to avoid direct Prisma runtime dependency errors if type changes)
      const err = exception as any;
      if (err.code === 'P2002') {
        status = 409;
        const field = err.meta?.target?.[0];
        message = `${field || 'Value'} already exists`;
        fieldErrors = field ? { [field]: message } : undefined;
      } else if (err.code === 'P2025') {
        status = 404;
        message = 'Record not found';
      } else {
        status = 400;
        message = 'Database error';
      }
    } else if (
      exception &&
      typeof exception === 'object' &&
      'name' in exception &&
      (exception as any).name === 'PrismaClientValidationError'
    ) {
      status = 422;
      message =
        process.env.NODE_ENV === 'production'
          ? 'Invalid data provided'
          : (exception as any).message;
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
}
