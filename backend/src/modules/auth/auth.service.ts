import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SubscriptionStatus } from '@prisma/client';
import { Response } from 'express';
import { DatabaseService } from '../../database/database.service';
import { HashingService } from '../../core/hashing/hashing.service';
import { UserService } from '../user/user.service';
import { PlatformSettingsService } from '../platform/platform-settings.service';
import { COMPANY_OWNER_ROLE } from '../../common/constants/roles.constant';
import { ChangePasswordDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthenticatedUser, JwtPayload } from './strategies/jwt.strategy';

const REFRESH_COOKIE = 'refreshToken';
// Cookie path must cover the actual refresh/logout routes. With the global
// '/api' prefix the route is '/api/auth/refresh', so a path of '/auth' would
// NEVER be sent. '/' keeps it prefix-independent (always reaches the endpoint).
const REFRESH_COOKIE_PATH = '/';
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly hashing: HashingService,
    private readonly jwt: JwtService,
    private readonly users: UserService,
    private readonly platform: PlatformSettingsService,
  ) {}

  // ─── Signup: provision a whole tenant atomically ───────────────────────────
  /**
   * Creates Company → CompanyPolicy → 'Company Owner' Role → admin User inside a
   * single transaction, then issues the first token pair. The new user is a
   * tenant admin (Company Owner), NOT a platform admin.
   */
  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const planId = await this.resolvePlanId(dto.planId);
    const passwordHash = await this.hashing.hash(dto.password);
    const { trialDays } = await this.platform.getSettings();
    const trialEndsAt = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);

    const user = await this.db.$transaction(async (tx) => {
      // 1. The tenant root. Starts on TRIAL; a plan is attached only if given.
      const company = await tx.company.create({
        data: {
          name: dto.companyName,
          establishmentNumber: dto.establishmentNumber,
          subscriptionStatus: SubscriptionStatus.TRIAL,
          trialEndsAt,
          ...(planId ? { planId } : {}),
        },
      });

      // 2. Default financial/attendance policy (all column defaults apply).
      await tx.companyPolicy.create({ data: { companyId: company.id } });

      // 3. Company Owner role with EVERY global permission attached.
      const permissions = await tx.permission.findMany({ select: { id: true } });
      const role = await tx.role.create({
        data: {
          name: COMPANY_OWNER_ROLE,
          companyId: company.id,
          permissions: { connect: permissions.map((p) => ({ id: p.id })) },
        },
      });

      // 4. The admin user, linked to the company + role.
      return tx.user.create({
        data: {
          email: dto.email,
          password: passwordHash,
          companyId: company.id,
          roleId: role.id,
          isPortalUser: false,
        },
      });
    });

    return this.issueTokens(this.toAuthUser(user, COMPANY_OWNER_ROLE));
  }

  // ─── Login ─────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    // Same generic error whether the email is unknown or the password is wrong,
    // so we don't leak which emails are registered.
    if (!user || !(await this.hashing.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.issueTokens(this.toAuthUser(user, user.role.name));
  }

  // ─── Refresh (rotation) ────────────────────────────────────────────────────
  /**
   * Issues a brand-new token pair. The RefreshTokenGuard has already verified
   * the incoming refresh cookie against the stored hash; issuing new tokens
   * overwrites that hash, so the previous refresh token can no longer be used.
   */
  refreshTokens(user: AuthenticatedUser) {
    return this.issueTokens(user);
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────
  /** Revokes the session by clearing the stored refresh-token hash. */
  async logout(userId: string) {
    await this.db.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  // ─── Change password (any authenticated user, incl. employees) ───────────────
  /**
   * Verifies the current password, sets the new one, and re-issues tokens.
   * Re-issuing overwrites the stored refresh-token hash → any OTHER existing
   * session is revoked, while this caller stays logged in with fresh tokens.
   */
  async changePassword(user: AuthenticatedUser, dto: ChangePasswordDto) {
    const dbUser = await this.users.findById(user.userId);
    if (!dbUser) {
      throw new UnauthorizedException();
    }
    const valid = await this.hashing.compare(
      dto.currentPassword,
      dbUser.password,
    );
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from the current one',
      );
    }
    await this.db.user.update({
      where: { id: user.userId },
      data: { password: await this.hashing.hash(dto.newPassword) },
    });
    return this.issueTokens(user);
  }

  // ─── Cookie helpers (the refresh token lives ONLY in an httpOnly cookie) ──────
  setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_MAX_AGE_MS,
      path: REFRESH_COOKIE_PATH,
    });
  }

  clearRefreshTokenCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────
  /**
   * Signs an access+refresh pair, persists the bcrypt hash of the refresh token
   * (enabling rotation + server-side revocation), and returns both tokens plus
   * the principal. The controller puts the refresh token in an httpOnly cookie
   * and returns only the access token in the body.
   */
  private async issueTokens(user: AuthenticatedUser) {
    const [accessToken, refreshToken] = await Promise.all([
      this.signAccessToken(user),
      this.signRefreshToken(user.userId),
    ]);
    await this.db.user.update({
      where: { id: user.userId },
      data: { refreshTokenHash: await this.hashing.hash(refreshToken) },
    });
    return { accessToken, refreshToken, user };
  }

  private toAuthUser(
    user: {
      id: string;
      email: string;
      companyId: string;
      roleId: string;
      isPlatformAdmin: boolean;
      isPortalUser: boolean;
      employee?: { id: string } | null;
    },
    roleName: string,
  ): AuthenticatedUser {
    return {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      roleId: user.roleId,
      roleName,
      isPlatformAdmin: user.isPlatformAdmin,
      isPortalUser: user.isPortalUser,
      employeeId: user.employee?.id ?? null,
    };
  }

  private signAccessToken(user: AuthenticatedUser): Promise<string> {
    const payload: JwtPayload = {
      sub: user.userId,
      email: user.email,
      companyId: user.companyId,
      roleId: user.roleId,
      roleName: user.roleName,
      isPlatformAdmin: user.isPlatformAdmin,
      isPortalUser: user.isPortalUser,
      employeeId: user.employeeId,
    };
    return this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      // `ms` StringValue template-type doesn't accept a plain string env var.
      expiresIn: (process.env.JWT_EXPIRY || '15m') as any,
    });
  }

  private signRefreshToken(userId: string): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: (process.env.JWT_REFRESH_EXPIRY || '30d') as any,
      },
    );
  }

  /**
   * A new company starts on a TRIAL with NO plan attached (Company.planId stays
   * null). A plan is linked ONLY when the client explicitly passes a valid
   * planId — e.g. choosing a paid tier at signup. Trial/billing state is
   * tracked by subscriptionStatus + trialEndsAt, independently of any plan.
   */
  private async resolvePlanId(requestedId?: string): Promise<string | null> {
    if (!requestedId) {
      return null;
    }
    const plan = await this.db.subscriptionPlan.findUnique({
      where: { id: requestedId },
      select: { id: true },
    });
    if (!plan) {
      throw new BadRequestException('The selected subscription plan does not exist');
    }
    return plan.id;
  }
}
