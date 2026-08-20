/*
  Warnings:

  - Added the required column `tenantId` to the `Token` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Token" DROP CONSTRAINT "Token_id_fkey";

-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "tenantId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
