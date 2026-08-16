-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('ATTENDANCE', 'PAYROLL', 'BENEFITS', 'EMPLOYEES', 'COMPLETE');

-- AlterTable
ALTER TABLE "CompanyPolicy" ADD COLUMN     "benefitAnnualTicketsAmount" DECIMAL(12,2),
ADD COLUMN     "benefitHousingAllowanceAmount" DECIMAL(12,2),
ADD COLUMN     "benefitHousingAllowanceIsPercentage" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "benefitTransportAllowanceAmount" DECIMAL(12,2);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "onboardingStep" "OnboardingStep";
