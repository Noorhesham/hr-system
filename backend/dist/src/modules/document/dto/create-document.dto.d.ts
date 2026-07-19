import { DocumentType } from '@prisma/client';
export declare class CreateDocumentDto {
    type: DocumentType;
    expiryDate?: string;
    fileUrl?: string;
    documentNumber?: string;
}
