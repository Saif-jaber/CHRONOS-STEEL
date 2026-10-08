-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'customer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailVerifiedAt" TIMESTAMP(3),
    "storeSlug" TEXT,
    "storeName" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "token" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "yearIntroduced" INTEGER NOT NULL,
    "collection" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "story" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "diameterMm" DOUBLE PRECISION NOT NULL,
    "thicknessMm" DOUBLE PRECISION NOT NULL,
    "lugToLugMm" DOUBLE PRECISION NOT NULL,
    "lugWidthMm" DOUBLE PRECISION NOT NULL,
    "material" TEXT NOT NULL,
    "finish" TEXT NOT NULL,
    "bezel" TEXT NOT NULL,
    "crystal" TEXT NOT NULL,
    "waterResistanceM" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "caliber" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "powerReserveHours" INTEGER,
    "frequencyVph" INTEGER,
    "jewels" INTEGER,
    "components" INTEGER,
    "chronometerDeviationPercent" DOUBLE PRECISION,
    "winding" TEXT,
    "indexStyle" TEXT NOT NULL,
    "lume" BOOLEAN NOT NULL,
    "signature" TEXT NOT NULL,
    "sublabel" TEXT,
    "basePriceInCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "stock" INTEGER,
    "reserved" INTEGER,
    "editionSize" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dial" (
    "productId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "colorName" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "finish" TEXT NOT NULL,
    "priceDeltaInCents" INTEGER NOT NULL DEFAULT 0,
    "complications" TEXT[],
    "complicationPlacements" JSONB NOT NULL,

    CONSTRAINT "Dial_pkey" PRIMARY KEY ("productId","id")
);

-- CreateTable
CREATE TABLE "Strap" (
    "productId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "colorName" TEXT NOT NULL,
    "priceDeltaInCents" INTEGER NOT NULL,
    "widthMm" DOUBLE PRECISION NOT NULL,
    "stitchColorHex" TEXT,

    CONSTRAINT "Strap_pkey" PRIMARY KEY ("productId","id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "dialId" TEXT,
    "strapId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_storeSlug_key" ON "Account"("storeSlug");

-- CreateIndex
CREATE INDEX "Session_accountId_idx" ON "Session"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_collection_idx" ON "Product"("collection");

-- CreateIndex
CREATE INDEX "Product_featured_idx" ON "Product"("featured");

-- CreateIndex
CREATE INDEX "Dial_productId_idx" ON "Dial"("productId");

-- CreateIndex
CREATE INDEX "Strap_productId_idx" ON "Strap"("productId");

-- CreateIndex
CREATE INDEX "Inventory_productId_idx" ON "Inventory"("productId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dial" ADD CONSTRAINT "Dial_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Strap" ADD CONSTRAINT "Strap_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
