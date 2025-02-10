-- DropForeignKey
ALTER TABLE "StudioPackage" DROP CONSTRAINT "StudioPackage_studioId_fkey";

-- AlterTable
ALTER TABLE "StudioPackage" ALTER COLUMN "studioId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "StudioPackage" ADD CONSTRAINT "StudioPackage_studioId_fkey" FOREIGN KEY ("studioId") REFERENCES "Studio"("id") ON DELETE SET NULL ON UPDATE CASCADE;
