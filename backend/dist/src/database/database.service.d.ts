import { OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class DatabaseService extends PrismaClient implements OnModuleInit {
    private readonly logger;
    constructor();
    onModuleInit(): Promise<void>;
    searchJsonFields(table: 'Product' | 'Category', jsonField: 'name' | 'description', term: string): Promise<string[]>;
}
