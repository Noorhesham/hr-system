import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('30d'),
  GOOGLE_CLIENT_ID: Joi.string().optional().allow(''),
  GOOGLE_CLIENT_SECRET: Joi.string().optional().allow(''),
  GOOGLE_CALLBACK_URL: Joi.string().uri().optional().allow(''),
  FRONTEND_URL: Joi.string().uri().required(),
  RESEND_API_KEY: Joi.string().optional().allow(''),
  EMAIL_DOMAIN: Joi.string().optional().allow(''),
  EMAIL_FROM_NAME: Joi.string().optional().allow(''),
  CLOUDINARY_CLOUD_NAME: Joi.string().optional().allow(''),
  CLOUDINARY_API_KEY: Joi.string().optional().allow(''),
  CLOUDINARY_API_SECRET: Joi.string().optional().allow(''),
  FIREBASE_SERVICE_ACCOUNT: Joi.string().optional().allow(''),
  STRIPE_SECRET_KEY: Joi.string().optional().allow(''),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional().allow(''),
  KASHIER_MERCHANT_ID: Joi.string().optional().allow(''),
  KASHIER_API_KEY: Joi.string().optional().allow(''),
  KASHIER_WEBHOOK_SECRET: Joi.string().optional().allow(''),
  KASHIER_MODE: Joi.string().valid('test', 'live').default('test'),
  EXCHANGE_RATE_API_KEY: Joi.string().optional().allow(''),
});
