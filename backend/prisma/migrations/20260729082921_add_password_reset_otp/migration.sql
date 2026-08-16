-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetOtpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetOtpHash" TEXT;
