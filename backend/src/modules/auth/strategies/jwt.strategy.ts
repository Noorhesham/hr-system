import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../../../core/redis/redis.module';
import Redis from 'ioredis';
import { UserRole } from '../../../common/enums/user-role.enum';
export class AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(@Inject(REDIS_CLIENT) private redis: Redis) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret-minimum-32-characters',
    });
  }

  async validate(payload: { sub: string; email: string; role: UserRole }) {
    const blocked = await this.redis.exists(`user:blocked:${payload.sub}`);
    if (blocked) {
      throw new UnauthorizedException('Account is blocked');
    }
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
