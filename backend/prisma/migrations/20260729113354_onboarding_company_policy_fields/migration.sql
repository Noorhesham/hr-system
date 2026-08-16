-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "industry" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "CompanyPolicy" ADD COLUMN     "benefitAnnualTickets" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "benefitHousingAllowance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "benefitTransportAllowance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "currency" VARCHAR(3) NOT NULL DEFAULT 'SAR',
ADD COLUMN     "directBankTransfer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "gosiAutoEnroll" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "medicalInsuranceProvider" TEXT,
ADD COLUMN     "medicalInsuranceTier" TEXT,
ADD COLUMN     "payrollCycle" TEXT NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "payrollPayoutDay" INTEGER NOT NULL DEFAULT 27;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "phone" TEXT;
