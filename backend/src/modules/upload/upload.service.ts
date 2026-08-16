import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private configured = false;

  constructor(private readonly config: ConfigService) {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.configured = true;
    } else {
      this.logger.warn(
        'Cloudinary credentials missing — uploads will return 503 until configured',
      );
    }
  }

  async uploadBuffer(
    file: Express.Multer.File,
    folder = 'hr-system',
  ): Promise<{ url: string; publicId: string; resourceType: string }> {
    if (!this.configured) {
      throw new ServiceUnavailableException(
        'File upload is not configured (Cloudinary)',
      );
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException('Empty file');
    }

    const resourceType = this.detectResourceType(file.mimetype);

    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
        },
        (err, result: UploadApiResponse | undefined) => {
          if (err || !result) {
            this.logger.error('Cloudinary upload failed', err);
            reject(
              new BadRequestException(
                err?.message || 'Failed to upload file',
              ),
            );
            return;
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
          });
        },
      );
      streamifier.createReadStream(file.buffer).pipe(upload);
    });
  }

  private detectResourceType(
    mime: string,
  ): 'image' | 'raw' | 'video' | 'auto' {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    return 'raw';
  }
}
