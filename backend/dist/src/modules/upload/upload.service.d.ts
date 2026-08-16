import { ConfigService } from '@nestjs/config';
export declare class UploadService {
    private readonly config;
    private readonly logger;
    private configured;
    constructor(config: ConfigService);
    uploadBuffer(file: Express.Multer.File, folder?: string): Promise<{
        url: string;
        publicId: string;
        resourceType: string;
    }>;
    private detectResourceType;
}
