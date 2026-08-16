import { DatabaseService } from '../../database/database.service';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
export type NotifyInput = {
    companyId: string;
    userId: string;
    title: string;
    body: string;
    type: string;
    link?: string;
    emailTo?: string;
};
export declare class NotificationService {
    private readonly db;
    private readonly logger;
    constructor(db: DatabaseService);
    create(input: NotifyInput): Promise<{
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
    createMany(inputs: NotifyInput[]): Promise<{
        id: string;
        createdAt: Date;
        companyId: string;
        link: string | null;
        userId: string;
        type: string;
        title: string;
        body: string;
        readAt: Date | null;
    }[]>;
    listForUser(actor: AuthenticatedUser, limit?: number): Promise<{
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
