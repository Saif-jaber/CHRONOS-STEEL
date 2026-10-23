-- Remove the seeded house catalogue. Every product must be a real seller
-- listing; rows with no seller are the fabricated reference set.
DELETE FROM "Product" WHERE "sellerId" IS NULL;
