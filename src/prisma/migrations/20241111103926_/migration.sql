/*
  Warnings:

  - You are about to drop the column `description` on the `Characteristic` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Characteristic" DROP COLUMN "description";

-- CreateTable
CREATE TABLE "ProductCharacteristic" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "characteristicId" INTEGER NOT NULL,

    CONSTRAINT "ProductCharacteristic_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductCharacteristic" ADD CONSTRAINT "ProductCharacteristic_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCharacteristic" ADD CONSTRAINT "ProductCharacteristic_characteristicId_fkey" FOREIGN KEY ("characteristicId") REFERENCES "Characteristic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
