import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { DatabaseService } from '../../../database/database.service';
import { HashingService } from '../../../core/hashing/hashing.service';
import { AuthenticatedUser } from './jwt.strategy';
interface RefreshPayload {
    sub: string;
}
declare const RefreshTokenStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class RefreshTokenStrategy extends RefreshTokenStrategy_base {
    private readonly db;
    private readonly hashing;
    constructor(db: DatabaseService, hashing: HashingService);
    validate(req: Request, payload: RefreshPayload): Promise<AuthenticatedUser>;
}
export {};
