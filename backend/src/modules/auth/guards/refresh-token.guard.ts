import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Activates the 'jwt-refresh' strategy (reads the httpOnly refresh cookie). */
@Injectable()
export class RefreshTokenGuard extends AuthGuard('jwt-refresh') {}
