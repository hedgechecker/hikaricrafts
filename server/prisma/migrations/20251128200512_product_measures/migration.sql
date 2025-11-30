/*
  Warnings:

  - Added the required column `series` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `warranty` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProductVariation" ADD COLUMN "depth" INTEGER;
ALTER TABLE "ProductVariation" ADD COLUMN "height" INTEGER;
ALTER TABLE "ProductVariation" ADD COLUMN "weightGrams" INTEGER;
ALTER TABLE "ProductVariation" ADD COLUMN "width" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "series" TEXT NOT NULL,
    "warranty" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("createdAt", "description", "id", "name", "updatedAt") SELECT "createdAt", "description", "id", "name", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
