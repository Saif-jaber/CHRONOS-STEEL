-- Snapshot the seller on each order line so sales history is not lost when a
-- listing is edited or deleted. Existing rows are backfilled from the product
-- they still point at.
ALTER TABLE "OrderItem" ADD COLUMN "sellerId" TEXT;

UPDATE "OrderItem" AS oi
SET "sellerId" = p."sellerId"
FROM "Product" AS p
WHERE oi."productId" = p."id";

CREATE INDEX "OrderItem_sellerId_idx" ON "OrderItem"("sellerId");
