-- CreateTable
CREATE TABLE "services" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "price_cents" INTEGER NOT NULL,
    "estimated_minutes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- Validações
ALTER TABLE "services"
  ADD CONSTRAINT "services_price_cents_check" CHECK ("price_cents" >= 0),
  ADD CONSTRAINT "services_estimated_minutes_check" CHECK ("estimated_minutes" > 0);