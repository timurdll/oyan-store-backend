/*
  Warnings:

  - The primary key for the `BasketProduct` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `BasketProduct` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BasketProduct" DROP CONSTRAINT "BasketProduct_pkey",
DROP COLUMN "id",
ALTER COLUMN "quantity" DROP DEFAULT,
ADD CONSTRAINT "BasketProduct_pkey" PRIMARY KEY ("basket_id", "product_id");
