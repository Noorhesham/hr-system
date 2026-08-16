"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cloudinary_1 = require("cloudinary");
const streamifier = __importStar(require("streamifier"));
let UploadService = UploadService_1 = class UploadService {
    config;
    logger = new common_1.Logger(UploadService_1.name);
    configured = false;
    constructor(config) {
        this.config = config;
        const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME');
        const apiKey = this.config.get('CLOUDINARY_API_KEY');
        const apiSecret = this.config.get('CLOUDINARY_API_SECRET');
        if (cloudName && apiKey && apiSecret) {
            cloudinary_1.v2.config({
                cloud_name: cloudName,
                api_key: apiKey,
                api_secret: apiSecret,
                secure: true,
            });
            this.configured = true;
        }
        else {
            this.logger.warn('Cloudinary credentials missing — uploads will return 503 until configured');
        }
    }
    async uploadBuffer(file, folder = 'hr-system') {
        if (!this.configured) {
            throw new common_1.ServiceUnavailableException('File upload is not configured (Cloudinary)');
        }
        if (!file?.buffer?.length) {
            throw new common_1.BadRequestException('Empty file');
        }
        const resourceType = this.detectResourceType(file.mimetype);
        return new Promise((resolve, reject) => {
            const upload = cloudinary_1.v2.uploader.upload_stream({
                folder,
                resource_type: resourceType,
                use_filename: true,
                unique_filename: true,
            }, (err, result) => {
                if (err || !result) {
                    this.logger.error('Cloudinary upload failed', err);
                    reject(new common_1.BadRequestException(err?.message || 'Failed to upload file'));
                    return;
                }
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    resourceType: result.resource_type,
                });
            });
            streamifier.createReadStream(file.buffer).pipe(upload);
        });
    }
    detectResourceType(mime) {
        if (mime.startsWith('image/'))
            return 'image';
        if (mime.startsWith('video/'))
            return 'video';
        return 'raw';
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = UploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], UploadService);
//# sourceMappingURL=upload.service.js.map