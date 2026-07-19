import { DatabaseService } from '../../database/database.service';
import { CreateDocumentDto } from './dto/create-document.dto';
export declare class DocumentService {
    private readonly db;
    constructor(db: DatabaseService);
    create(companyId: string, employeeId: string, dto: CreateDocumentDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        type: import("@prisma/client").$Enums.DocumentType;
        expiryDate: Date | null;
        fileUrl: string | null;
        documentNumber: string | null;
    }>;
    findAllForEmployee(companyId: string, employeeId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        type: import("@prisma/client").$Enums.DocumentType;
        expiryDate: Date | null;
        fileUrl: string | null;
        documentNumber: string | null;
    }[]>;
    findExpiring(companyId: string, days: number): import("@prisma/client").Prisma.PrismaPromise<({
        employee: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        type: import("@prisma/client").$Enums.DocumentType;
        expiryDate: Date | null;
        fileUrl: string | null;
        documentNumber: string | null;
    })[]>;
    remove(companyId: string, id: string): Promise<{
        success: boolean;
    }>;
    private assertEmployeeInCompany;
}
