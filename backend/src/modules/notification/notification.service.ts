import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';

export type NotifyInput = {
  companyId: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  link?: string;
  /** When set, also log an email-style message (no SMTP required yet). */
  emailTo?: string;
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly db: DatabaseService) {}

  async create(input: NotifyInput) {
    const row = await this.db.notification.create({
      data: {
        companyId: input.companyId,
        userId: input.userId,
        title: input.title,
        body: input.body,
        type: input.type,
        link: input.link ?? null,
      },
    });

    if (input.emailTo) {
      this.logger.log(
        `[email] to=${input.emailTo} subject="${input.title}" body="${input.body}"`,
      );
    }

    return row;
  }

  async createMany(inputs: NotifyInput[]) {
    const out: Awaited<ReturnType<NotificationService['create']>>[] = [];
    for (const input of inputs) {
      out.push(await this.create(input));
    }
    return out;
  }

  async listForUser(actor: AuthenticatedUser, limit = 30) {
    const [items, unreadCount] = await Promise.all([
      this.db.notification.findMany({
        where: { userId: actor.userId, companyId: actor.companyId },
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
      }),
      this.db.notification.count({
        where: {
          userId: actor.userId,
          companyId: actor.companyId,
          readAt: null,
        },
      }),
    ]);
    return { items, unreadCount };
  }

  async markRead(actor: AuthenticatedUser, id: string) {
    const row = await this.db.notification.findFirst({
      where: { id, userId: actor.userId, companyId: actor.companyId },
    });
    if (!row) throw new NotFoundException('Notification not found');
    return this.db.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(actor: AuthenticatedUser) {
    await this.db.notification.updateMany({
      where: {
        userId: actor.userId,
        companyId: actor.companyId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return { success: true };
  }
}
