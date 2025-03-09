-- CreateEnum
CREATE TYPE "AdditionalServiceType" AS ENUM ('STANDARD_EDIT_SHORT_FORM', 'CUSTOM_EDIT_SHORT_FORM', 'STANDARD_EDIT_LONG_FORM', 'CUSTOM_EDIT_LONG_FORM', 'LIVE_VIDEO_CUTTING', 'SUBTITLES', 'TELEPROMPTER_SUPPORT');

-- CreateTable
CREATE TABLE "AdditionalService" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "AdditionalServiceType" NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AED',
    "count" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT NOT NULL,
    "imageUrls" TEXT[],
    "videoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdditionalService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAdditionalService" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "additionalServiceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookingAdditionalService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookingAdditionalService_bookingId_additionalServiceId_key" ON "BookingAdditionalService"("bookingId", "additionalServiceId");

-- AddForeignKey
ALTER TABLE "BookingAdditionalService" ADD CONSTRAINT "BookingAdditionalService_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAdditionalService" ADD CONSTRAINT "BookingAdditionalService_additionalServiceId_fkey" FOREIGN KEY ("additionalServiceId") REFERENCES "AdditionalService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
