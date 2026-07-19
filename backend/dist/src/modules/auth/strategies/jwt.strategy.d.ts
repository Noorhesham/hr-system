import { Strategy } from 'passport-jwt';
export interface JwtPayload {
    sub: string;
    email: string;
    companyId: string;
    roleId: string;
    roleName: string;
    isPlatformAdmin: boolean;
    isPortalUser: boolean;
    employeeId: string | null;
}
export interface AuthenticatedUser {
    userId: string;
    email: string;
    companyId: string;
    roleId: string;
    roleName: string;
    isPlatformAdmin: boolean;
    isPortalUser: boolean;
    employeeId: string | null;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    constructor();
    validate(payload: JwtPayload): AuthenticatedUser;
}
export {};
