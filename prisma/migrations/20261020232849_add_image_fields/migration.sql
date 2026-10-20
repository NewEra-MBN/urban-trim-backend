-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "logoPublicId" TEXT,
ADD COLUMN     "logoUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "photoPublicId" TEXT,
ADD COLUMN     "photoUrl" TEXT;
