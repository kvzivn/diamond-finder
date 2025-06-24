-- CreateEnum
CREATE TYPE "DiamondType" AS ENUM ('natural', 'lab');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Diamond" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "supplierStockRef" TEXT,
    "cut" TEXT,
    "carat" DOUBLE PRECISION,
    "color" TEXT,
    "naturalFancyColor" TEXT,
    "naturalFancyColorIntensity" TEXT,
    "naturalFancyColorOvertone" TEXT,
    "treatedColor" TEXT,
    "clarity" TEXT,
    "cutGrade" TEXT,
    "gradingLab" TEXT,
    "certificateNumber" TEXT,
    "certificatePath" TEXT,
    "certificateUrl" TEXT,
    "imagePath" TEXT,
    "imageUrl" TEXT,
    "onlineReport" TEXT,
    "onlineReportUrl" TEXT,
    "videoUrl" TEXT,
    "threeDViewerUrl" TEXT,
    "pricePerCarat" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION,
    "totalPriceSek" DOUBLE PRECISION,
    "percentOffIdexList" DOUBLE PRECISION,
    "polish" TEXT,
    "symmetry" TEXT,
    "measurementsLength" DOUBLE PRECISION,
    "measurementsWidth" DOUBLE PRECISION,
    "measurementsHeight" DOUBLE PRECISION,
    "depthPercent" DOUBLE PRECISION,
    "tablePercent" DOUBLE PRECISION,
    "crownHeight" DOUBLE PRECISION,
    "crownAngle" DOUBLE PRECISION,
    "pavilionDepth" DOUBLE PRECISION,
    "pavilionAngle" DOUBLE PRECISION,
    "girdleFrom" TEXT,
    "girdleTo" TEXT,
    "culetSize" TEXT,
    "culetCondition" TEXT,
    "graining" TEXT,
    "fluorescenceIntensity" TEXT,
    "fluorescenceColor" TEXT,
    "enhancement" TEXT,
    "country" TEXT,
    "countryCode" TEXT,
    "countryName" TEXT,
    "stateRegion" TEXT,
    "stateCode" TEXT,
    "stateName" TEXT,
    "pairStockRef" TEXT,
    "pairSeparable" TEXT,
    "askingPriceForPair" DOUBLE PRECISION,
    "askingPricePerCaratForPair" DOUBLE PRECISION,
    "shade" TEXT,
    "milky" TEXT,
    "blackInclusion" TEXT,
    "eyeClean" TEXT,
    "provenanceReport" TEXT,
    "provenanceNumber" TEXT,
    "brand" TEXT,
    "guaranteedAvailability" TEXT,
    "availability" TEXT,
    "type" "DiamondType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "importJobId" TEXT,

    CONSTRAINT "Diamond_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "type" "DiamondType" NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "totalRecords" INTEGER,
    "processedRecords" INTEGER,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'openexchangerates',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Diamond_itemId_key" ON "Diamond"("itemId");

-- CreateIndex
CREATE INDEX "Diamond_type_idx" ON "Diamond"("type");

-- CreateIndex
CREATE INDEX "Diamond_cut_idx" ON "Diamond"("cut");

-- CreateIndex
CREATE INDEX "Diamond_totalPrice_idx" ON "Diamond"("totalPrice");

-- CreateIndex
CREATE INDEX "Diamond_totalPriceSek_idx" ON "Diamond"("totalPriceSek");

-- CreateIndex
CREATE INDEX "Diamond_carat_idx" ON "Diamond"("carat");

-- CreateIndex
CREATE INDEX "Diamond_color_idx" ON "Diamond"("color");

-- CreateIndex
CREATE INDEX "Diamond_clarity_idx" ON "Diamond"("clarity");

-- CreateIndex
CREATE INDEX "Diamond_cutGrade_idx" ON "Diamond"("cutGrade");

-- CreateIndex
CREATE INDEX "Diamond_naturalFancyColor_idx" ON "Diamond"("naturalFancyColor");

-- CreateIndex
CREATE INDEX "Diamond_type_cut_totalPrice_idx" ON "Diamond"("type", "cut", "totalPrice");

-- CreateIndex
CREATE INDEX "Diamond_type_totalPrice_carat_idx" ON "Diamond"("type", "totalPrice", "carat");

-- CreateIndex
CREATE INDEX "Diamond_type_cut_carat_color_clarity_idx" ON "Diamond"("type", "cut", "carat", "color", "clarity");

-- CreateIndex
CREATE INDEX "ImportJob_type_status_idx" ON "ImportJob"("type", "status");

-- CreateIndex
CREATE INDEX "ImportJob_createdAt_idx" ON "ImportJob"("createdAt");

-- CreateIndex
CREATE INDEX "ExchangeRate_fromCurrency_toCurrency_idx" ON "ExchangeRate"("fromCurrency", "toCurrency");

-- CreateIndex
CREATE INDEX "ExchangeRate_validFrom_validUntil_idx" ON "ExchangeRate"("validFrom", "validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_fromCurrency_toCurrency_validFrom_key" ON "ExchangeRate"("fromCurrency", "toCurrency", "validFrom");

-- AddForeignKey
ALTER TABLE "Diamond" ADD CONSTRAINT "Diamond_importJobId_fkey" FOREIGN KEY ("importJobId") REFERENCES "ImportJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

