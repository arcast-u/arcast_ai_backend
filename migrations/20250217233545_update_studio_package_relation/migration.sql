/*
  Warnings:

  - You are about to drop the column `studioId` on the `StudioPackage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "StudioPackage" DROP CONSTRAINT "StudioPackage_studioId_fkey";

-- AlterTable
ALTER TABLE "StudioPackage" DROP COLUMN "studioId";

-- CreateTable
CREATE TABLE "_StudioToStudioPackage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StudioToStudioPackage_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_StudioToStudioPackage_B_index" ON "_StudioToStudioPackage"("B");

-- AddForeignKey
ALTER TABLE "_StudioToStudioPackage" ADD CONSTRAINT "_StudioToStudioPackage_A_fkey" FOREIGN KEY ("A") REFERENCES "Studio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StudioToStudioPackage" ADD CONSTRAINT "_StudioToStudioPackage_B_fkey" FOREIGN KEY ("B") REFERENCES "StudioPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
