-- CreateTable
CREATE TABLE "SellerEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "productId" TEXT,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SellerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SellerEvent_sellerId_type_createdAt_idx" ON "SellerEvent"("sellerId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "SellerEvent_productId_idx" ON "SellerEvent"("productId");
