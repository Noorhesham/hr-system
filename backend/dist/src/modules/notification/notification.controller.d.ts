import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { NotificationService } from './notification.service';
export declare class NotificationController {
    private readonly notifications;
    constructor(notifications: NotificationService);
    list(actor: AuthenticatedUser, limit?: string): Promise<{
        items: {
            id: string;
            createdAt: Date;
            companyId: string;
            link: string | null;
            userId: string;
            type: string;
            title: string;
            body: string;
            readAt: Date | null;
        }[];
        unreadCount: number;
    }>;
    markRead(actor: AuthenticatedUser, id: string): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        link: string | null;
        userId: string;
        type: string;
        title: string;
        body: string;
        readAt: Date | null;
    }>;
    markAllRead(actor: AuthenticatedUser): Promise<{
        success: boolean;
    }>;
}
