-- Seed add-to-bag history from bags that predate event tracking.
INSERT INTO "SellerEvent" ("id", "type", "sellerId", "productId", "accountId", "createdAt")
SELECT
    gen_random_uuid()::text,
    'add_to_bag',
    p."sellerId",
    c."productId",
    c."accountId",
    c."createdAt"
FROM "CartItem" c
JOIN "Product" p ON p."id" = c."productId"
WHERE p."sellerId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "SellerEvent" e
    WHERE e."type" = 'add_to_bag'
      AND e."accountId" = c."accountId"
      AND e."productId" = c."productId"
  );
