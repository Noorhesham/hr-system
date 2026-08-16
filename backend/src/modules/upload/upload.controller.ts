import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../tenant/guards/tenant.guard';

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB for public onboarding logos

@ApiTags('Uploads')
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploads: UploadService) {}

  /**
   * Authenticated multipart upload to Cloudinary. Field name: `file`.
   * Accepts images, PDFs, and CSV/Excel for onboarding/docs.
   */
  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_BYTES },
      fileFilter: (_req, file, cb) => {
        const ok =
          /^image\//.test(file.mimetype) ||
          file.mimetype === 'application/pdf' ||
          file.mimetype === 'text/csv' ||
          file.mimetype === 'application/vnd.ms-excel' ||
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.originalname.toLowerCase().endsWith('.csv');
        if (!ok) {
          cb(
            new BadRequestException(
              'Unsupported file type (images, PDF, CSV/Excel only)',
            ),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    return this.uploads.uploadBuffer(file, 'hr-system/onboarding');
  }

  /**
   * Public image-only upload used during pre-auth onboarding (company logo).
   * Heavily rate-limited; max 2 MB; images only.
   */
  @Post('onboarding-logo')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_LOGO_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!/^image\//.test(file.mimetype)) {
          cb(new BadRequestException('Only image files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadOnboardingLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('file is required');
    }
    return this.uploads.uploadBuffer(file, 'hr-system/onboarding/logos');
  }
}
