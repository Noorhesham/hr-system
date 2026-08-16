-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Department_companyId_idx" ON "Department"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_companyId_name_key" ON "Department"("companyId", "name");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN "departmentId" TEXT;

-- Backfill: one Department per distinct (companyId, department) label
INSERT INTO "Department" ("id", "companyId", "name", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, e."companyId", e."department", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "companyId", "department"
  FROM "Employee"
  WHERE "department" IS NOT NULL AND TRIM("department") <> ''
) e;

UPDATE "Employee" emp
SET "departmentId" = d."id"
FROM "Department" d
WHERE emp."companyId" = d."companyId"
  AND emp."department" = d."name"
  AND emp."departmentId" IS NULL;

-- CreateIndex
CREATE INDEX "Employee_departmentId_idx" ON "Employee"("departmentId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
