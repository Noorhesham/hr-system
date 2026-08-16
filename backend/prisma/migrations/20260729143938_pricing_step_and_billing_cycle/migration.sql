-- AlterEnum
ALTER TYPE "OnboardingStep" ADD VALUE 'PRICING';

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "billingCycle" TEXT;
