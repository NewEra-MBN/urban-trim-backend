-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_tenantId_fkey";

-- AlterTable
ALTER TABLE "Token" ALTER COLUMN "tenantId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
