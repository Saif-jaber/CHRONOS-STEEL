-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "sellerId" TEXT;

-- CreateIndex
CREATE INDEX "Product_sellerId_idx" ON "Product"("sellerId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
