import { AuthenticatedUser } from '../../auth/strategies/jwt.strategy';
export declare const Tenant: (...dataOrPipes: unknown[]) => ParameterDecorator;
export declare const CurrentUser: (...dataOrPipes: (keyof AuthenticatedUser | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
