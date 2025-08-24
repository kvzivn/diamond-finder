-- AlterTable
ALTER TABLE "Diamond" ADD COLUMN     "finalPriceSek" DOUBLE PRECISION,
ADD COLUMN     "priceWithMarkupSek" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Diamond_priceWithMarkupSek_idx" ON "Diamond"("priceWithMarkupSek");

-- CreateIndex
CREATE INDEX "Diamond_finalPriceSek_idx" ON "Diamond"("finalPriceSek");
