import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnboardingStep, SubscriptionStatus } from '@prisma/client';
import { Response } from 'express';
import * as crypto from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { HashingService } from '../../core/hashing/hashing.service';
import { UserService } from '../user/user.service';
import { PlatformSettingsService } from '../platform/platform-settings.service';
import { provisionSystemRoles } from '../../common/utils/system-roles.util';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateProfileDto,
  VerifyResetOtpDto,
} from './dto/auth.dto';
import { AuthenticatedUser, JwtPayload } from './strategies/jwt.strategy';

const REFRESH_COOKIE = 'refreshToken';
// Cookie path must cover the actual refresh/logout routes. With the global
// '/api' prefix the route is '/api/auth/refresh', so a path of '/auth' would
// NEVER be sent. '/' keeps it prefix-independent (always reaches the endpoint).
const REFRESH_COOKIE_PATH = '/';
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESET_TOKEN_EXPIRY = '15m';
const RESET_PURPOSE = 'password-reset';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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

      // 3. System roles (Owner / Employee / HR / Manager / Payroll).
      const { ownerRoleId } = await provisionSystemRoles(tx, company.id);

      // 4. The admin user, linked to the company + Owner role.
      // Steps 1–3 (welcome/company/admin) are done; billing gate is next.
      return tx.user.create({
        data: {
          email: dto.email.trim().toLowerCase(),
          password: passwordHash,
          fullName: dto.fullName,
          phone: dto.phone,
          jobTitle: dto.jobTitle,
          companyId: company.id,
          roleId: ownerRoleId,
          isPortalUser: false,
          onboardingStep: OnboardingStep.PRICING,
        },
      });
    });

    const dbUser = await this.users.findById(user.id);
    if (!dbUser) {
      throw new UnauthorizedException('User not found after registration');
    }
    return this.issueTokens(this.toAuthUser(dbUser));
  }

  // ─── Login ─────────────────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email.trim().toLowerCase());
    // Same generic error whether the email is unknown or the password is wrong,
    // so we don't leak which emails are registered.
    if (!user || !(await this.hashing.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.issueTokens(this.toAuthUser(user));
  }

  // ─── Forgot password (OTP) ─────────────────────────────────────────────────
  /**
   * Always returns the same generic success payload (no email enumeration).
   * When the email exists, stores a hashed 6-digit OTP (10 min TTL).
   * In non-production, `devOtp` is included so local/QA can test without SMTP.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{
    success: true;
    message: string;
    devOtp?: string;
  }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.db.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    const generic = {
      success: true as const,
      message:
        'If an account exists for this email, a verification code has been sent',
    };

    if (!user) {
      await this.hashing.hash('000000');
      return generic;
    }

    const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.db.user.update({
      where: { id: user.id },
      data: {
        passwordResetOtpHash: await this.hashing.hash(otp),
        passwordResetOtpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    this.logger.log(
      `Password reset OTP for ${user.email}: ${otp} (expires in 10m)`,
    );

    if (process.env.NODE_ENV === 'production') {
      return generic;
    }

    return { ...generic, devOtp: otp };
  }

  /**
   * Verifies the OTP and returns a short-lived JWT used by reset-password.
   * Consumes the OTP so it cannot be replayed.
   */
  async verifyResetOtp(
    dto: VerifyResetOtpDto,
  ): Promise<{ resetToken: string }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.db.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordResetOtpHash: true,
        passwordResetOtpExpiresAt: true,
      },
    });

    if (
      !user?.passwordResetOtpHash ||
      !user.passwordResetOtpExpiresAt ||
      user.passwordResetOtpExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const ok = await this.hashing.compare(dto.code, user.passwordResetOtpHash);
    if (!ok) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    await this.db.user.update({
      where: { id: user.id },
      data: {
        passwordResetOtpHash: null,
        passwordResetOtpExpiresAt: null,
      },
    });

    const resetToken = await this.jwt.signAsync(
      { sub: user.id, purpose: RESET_PURPOSE },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: RESET_TOKEN_EXPIRY as any,
      },
    );

    return { resetToken };
  }

  /** Sets a new password using a valid reset token from verify-reset-otp. */
  async resetPassword(dto: ResetPasswordDto): Promise<{ success: true }> {
    let payload: { sub?: string; purpose?: string };
    try {
      payload = await this.jwt.verifyAsync(dto.resetToken, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (payload.purpose !== RESET_PURPOSE || !payload.sub) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const user = await this.db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true },
    });
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    await this.db.user.update({
      where: { id: user.id },
      data: {
        password: await this.hashing.hash(dto.newPassword),
        refreshTokenHash: null,
        passwordResetOtpHash: null,
        passwordResetOtpExpiresAt: null,
      },
    });

    return { success: true };
  }

  // ─── Refresh (rotation) ────────────────────────────────────────────────────
  /**
   * Issues a brand-new token pair. The RefreshTokenGuard has already verified
   * the incoming refresh cookie against the stored hash; issuing new tokens
   * overwrites that hash, so the previous refresh token can no longer be used.
   * Reloads the user from DB so onboarding progress in the new access token
   * is fresh (not whatever was baked into the old refresh/access claims).
   */
  async refreshTokens(user: AuthenticatedUser) {
    const dbUser = await this.users.findById(user.userId);
    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }
    return this.issueTokens(this.toAuthUser(dbUser));
  }

  /** Fresh principal from the DB (for GET /auth/me). */
  async getMe(userId: string): Promise<AuthenticatedUser> {
    const dbUser = await this.users.findById(userId);
    if (!dbUser) {
      throw new UnauthorizedException('User not found');
    }
    return this.toAuthUser(dbUser);
  }

  /**
   * Update display profile fields. Email is never accepted / never changed.
   */
  async updateProfile(user: AuthenticatedUser, dto: UpdateProfileDto) {
    const updated = await this.db.user.update({
      where: { id: user.userId },
      data: {
        ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.jobTitle !== undefined ? { jobTitle: dto.jobTitle } : {}),
      },
      include: {
        role: {
          select: {
            name: true,
            permissions: { select: { action: true } },
          },
        },
        employee: { select: { id: true } },
        company: { select: { planId: true, subscriptionStatus: true } },
      },
    });
    return this.toAuthUser(updated);
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

  private toAuthUser(user: {
    id: string;
    email: string;
    companyId: string;
    roleId: string;
    isPlatformAdmin: boolean;
    isPortalUser: boolean;
    fullName?: string | null;
    phone?: string | null;
    jobTitle?: string | null;
    onboardingStep?: OnboardingStep | null;
    onboardingCompletedAt?: Date | null;
    employee?: { id: string } | null;
    role: {
      name: string;
      permissions?: { action: string }[];
    };
    company?: {
      planId: string | null;
      subscriptionStatus: import('@prisma/client').SubscriptionStatus;
    } | null;
  }): AuthenticatedUser {
    const permissions = (user.role.permissions ?? []).map((p) => p.action);

    return {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      roleId: user.roleId,
      roleName: user.role.name,
      permissions,
      isPlatformAdmin: user.isPlatformAdmin,
      isPortalUser: user.isPortalUser,
      employeeId: user.employee?.id ?? null,
      onboardingStep: user.onboardingStep ?? null,
      onboardingCompletedAt: user.onboardingCompletedAt
        ? user.onboardingCompletedAt.toISOString()
        : null,
      fullName: user.fullName ?? null,
      phone: user.phone ?? null,
      jobTitle: user.jobTitle ?? null,
      planId: user.company?.planId ?? null,
      subscriptionStatus: user.company?.subscriptionStatus ?? null,
    };
  }

  private signAccessToken(user: AuthenticatedUser): Promise<string> {
    const payload: JwtPayload = {
      sub: user.userId,
      email: user.email,
      companyId: user.companyId,
      roleId: user.roleId,
      roleName: user.roleName,
      permissions: user.permissions,
      isPlatformAdmin: user.isPlatformAdmin,
      isPortalUser: user.isPortalUser,
      employeeId: user.employeeId,
      onboardingStep: user.onboardingStep,
      onboardingCompletedAt: user.onboardingCompletedAt,
      planId: user.planId,
      subscriptionStatus: user.subscriptionStatus,
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
      throw new BadRequestException(
        'The selected subscription plan does not exist',
      );
    }
    return plan.id;
  }
}
