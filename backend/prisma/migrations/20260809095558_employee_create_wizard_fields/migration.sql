-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "address" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "dateOfBirth" DATE,
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "emergencyContactRelation" TEXT,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "hasHealthInsurance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasHousingAllowance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasMealAllowance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasTransportAllowance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hireDate" DATE,
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "maritalStatus" "MaritalStatus",
ADD COLUMN     "nationalId" TEXT,
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "probationDays" INTEGER,
ADD COLUMN     "subDepartment" TEXT;
