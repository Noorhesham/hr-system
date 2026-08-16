import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UploadService } from '../upload/upload.service';
export declare class DocumentController {
    private readonly documentService;
    private readonly uploads;
    constructor(documentService: DocumentService, uploads: UploadService);
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
    uploadAndCreate(companyId: string, employeeId: string, file: Express.Multer.File, body: {
        type?: string;
        expiryDate?: string;
        documentNumber?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        type: import("@prisma/client").$Enums.DocumentType;
        expiryDate: Date | null;
        fileUrl: string | null;
        documentNumber: string | null;
    }>;
    findAll(companyId: string, employeeId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        type: import("@prisma/client").$Enums.DocumentType;
        expiryDate: Date | null;
        fileUrl: string | null;
        documentNumber: string | null;
    }[]>;
    findExpiring(companyId: string, days?: string): import("@prisma/client").Prisma.PrismaPromise<({
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
}
