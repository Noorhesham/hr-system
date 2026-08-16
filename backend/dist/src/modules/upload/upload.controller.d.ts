import { UploadService } from './upload.service';
export declare class UploadController {
    private readonly uploads;
    constructor(uploads: UploadService);
    upload(file: Express.Multer.File): Promise<{
        url: string;
        publicId: string;
        resourceType: string;
    }>;
    uploadOnboardingLogo(file: Express.Multer.File): Promise<{
        url: string;
        publicId: string;
        resourceType: string;
    }>;
}
