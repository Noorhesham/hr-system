import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { DatabaseModule } from '../../database/database.module';
import { HashingModule } from '../../core/hashing/hashing.module';
import { UserModule } from '../user/user.module';
import { PlatformModule } from '../platform/platform.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Signing options are passed per-call in AuthService (secret + expiry).
    JwtModule.register({}),
    DatabaseModule,
    HashingModule,
    UserModule,
    PlatformModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokenStrategy],
  exports: [AuthService],
})
export class AuthModule {}
