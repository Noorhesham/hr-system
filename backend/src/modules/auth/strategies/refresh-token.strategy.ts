import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { HashingService } from '../../../core/hashing/hashing.service';
import { DatabaseService } from '../../../database/database.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly db: DatabaseService,
    private readonly hashingService: HashingService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refreshToken, // httpOnly cookie
      ]),
      secretOrKey:
        process.env.JWT_REFRESH_SECRET ||
        'fallback-refresh-secret-minimum-32-characters',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string }) {
    const user = await this.db.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException();
    }
    const valid = await this.hashingService.compare(
      req.cookies.refreshToken,
      user.refreshTokenHash,
    );
    if (!valid) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return user;
  }
}
