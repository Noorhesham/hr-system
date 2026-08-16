-- CreateEnum
CREATE TYPE "JobRank" AS ENUM ('EMPLOYEE', 'TEAM_LEAD', 'DEPARTMENT_MANAGER');

-- CreateEnum
CREATE TYPE "WorkLocation" AS ENUM ('HEADQUARTERS', 'REMOTE', 'BRANCH');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "contractDurationYears" DECIMAL(4,1),
ADD COLUMN     "jobRank" "JobRank" NOT NULL DEFAULT 'EMPLOYEE',
ADD COLUMN     "managerId" TEXT,
ADD COLUMN     "workLocation" "WorkLocation" NOT NULL DEFAULT 'HEADQUARTERS';

-- CreateIndex
CREATE INDEX "Employee_managerId_idx" ON "Employee"("managerId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
