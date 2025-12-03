/*
  Warnings:

  - You are about to drop the `ProductOptionValue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `name` on the `ProductOption` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProductOptionValue";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Option" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "OptionValue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "optionId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "OptionValue_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProductOption" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "optionId" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "ProductOption_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductOption_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProductOption" ("id", "productId") SELECT "id", "productId" FROM "ProductOption";
DROP TABLE "ProductOption";
ALTER TABLE "new_ProductOption" RENAME TO "ProductOption";
CREATE TABLE "new_ProductVariationOptionValue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "variationId" INTEGER NOT NULL,
    "optionValueId" INTEGER NOT NULL,
    CONSTRAINT "ProductVariationOptionValue_variationId_fkey" FOREIGN KEY ("variationId") REFERENCES "ProductVariation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductVariationOptionValue_optionValueId_fkey" FOREIGN KEY ("optionValueId") REFERENCES "OptionValue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProductVariationOptionValue" ("id", "optionValueId", "variationId") SELECT "id", "optionValueId", "variationId" FROM "ProductVariationOptionValue";
DROP TABLE "ProductVariationOptionValue";
ALTER TABLE "new_ProductVariationOptionValue" RENAME TO "ProductVariationOptionValue";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
