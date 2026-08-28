/*
  Warnings:

  - You are about to drop the column `isEmailVerfied` on the `Tenant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "isEmailVerfied",
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;
