-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: every reference that exists today was already visible, so it is
-- published. New seller references default to false (a draft) until published.
UPDATE "Product" SET "published" = true;

-- CreateIndex
CREATE INDEX "Product_published_idx" ON "Product"("published");
