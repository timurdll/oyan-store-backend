-- CreateEnum
CREATE TYPE "Language" AS ENUM ('RU', 'KK');

-- CreateTable
CREATE TABLE "ProductTranslation" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductInfoTranslation" (
    "id" SERIAL NOT NULL,
    "productInfoId" INTEGER NOT NULL,
    "language" "Language" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "ProductInfoTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TypeTranslation" (
    "id" SERIAL NOT NULL,
    "typeId" INTEGER NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TypeTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacteristicTranslation" (
    "id" SERIAL NOT NULL,
    "characteristicId" INTEGER NOT NULL,
    "language" "Language" NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "CharacteristicTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCharacteristicTranslation" (
    "id" SERIAL NOT NULL,
    "productCharacteristicId" INTEGER NOT NULL,
    "language" "Language" NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "ProductCharacteristicTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductTranslation_productId_language_key" ON "ProductTranslation"("productId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "ProductInfoTranslation_productInfoId_language_key" ON "ProductInfoTranslation"("productInfoId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "TypeTranslation_typeId_language_key" ON "TypeTranslation"("typeId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "CharacteristicTranslation_characteristicId_language_key" ON "CharacteristicTranslation"("characteristicId", "language");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCharacteristicTranslation_productCharacteristicId_la_key" ON "ProductCharacteristicTranslation"("productCharacteristicId", "language");

-- AddForeignKey
ALTER TABLE "ProductTranslation" ADD CONSTRAINT "ProductTranslation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductInfoTranslation" ADD CONSTRAINT "ProductInfoTranslation_productInfoId_fkey" FOREIGN KEY ("productInfoId") REFERENCES "ProductInfo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TypeTranslation" ADD CONSTRAINT "TypeTranslation_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "Type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacteristicTranslation" ADD CONSTRAINT "CharacteristicTranslation_characteristicId_fkey" FOREIGN KEY ("characteristicId") REFERENCES "Characteristic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCharacteristicTranslation" ADD CONSTRAINT "ProductCharacteristicTranslation_productCharacteristicId_fkey" FOREIGN KEY ("productCharacteristicId") REFERENCES "ProductCharacteristic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
