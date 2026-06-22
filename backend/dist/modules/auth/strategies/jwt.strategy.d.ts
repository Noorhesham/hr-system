import { Strategy } from 'passport-jwt';
import Redis from 'ioredis';
import { UserRole } from '../../../common/enums/user-role.enum';
export declare class AuthenticatedUser {
    id: string;
    email: string;
    role: UserRole;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private redis;
    constructor(redis: Redis);
    validate(payload: {
        sub: string;
        email: string;
        role: UserRole;
    }): Promise<{
        id: string;
        email: string;
        role: UserRole;
    }>;
}
export {};
