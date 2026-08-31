/*
  Warnings:

  - You are about to drop the column `isEmailVerified` on the `Tenant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "isEmailVerified";
