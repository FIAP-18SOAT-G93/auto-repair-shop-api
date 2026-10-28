-- CreateEnum
CREATE TYPE "part_type" AS ENUM ('PART', 'SUPPLY');

-- CreateTable
CREATE TABLE "parts" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" "part_type" NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parts_pkey" PRIMARY KEY ("id")
);

-- Validações
ALTER TABLE "parts"
  ADD CONSTRAINT "parts_price_cents_check" CHECK ("price_cents" >= 0),
  ADD CONSTRAINT "parts_quantity_check" CHECK ("quantity" >= 0);
