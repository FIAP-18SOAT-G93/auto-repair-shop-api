-- CreateEnum
CREATE TYPE "service_order_status" AS ENUM ('RECEIVED', 'IN_DIAGNOSIS', 'AWAITING_APPROVAL', 'IN_EXECUTION', 'FINISHED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "quote_decision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "service_orders" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "customer_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "status" "service_order_status" NOT NULL,
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_service_items" (
    "service_order_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "service_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "quote_version" INTEGER NOT NULL,

    CONSTRAINT "service_order_service_items_pkey" PRIMARY KEY ("service_order_id","position")
);

-- CreateTable
CREATE TABLE "service_order_part_items" (
    "service_order_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "part_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "quote_version" INTEGER NOT NULL,

    CONSTRAINT "service_order_part_items_pkey" PRIMARY KEY ("service_order_id","position")
);

-- CreateTable
CREATE TABLE "service_order_quotes" (
    "service_order_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "total_cents" INTEGER NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL,
    "decision" "quote_decision",
    "decided_at" TIMESTAMP(3),
    "rejection_reason" TEXT,

    CONSTRAINT "service_order_quotes_pkey" PRIMARY KEY ("service_order_id","version")
);

-- CreateTable
CREATE TABLE "service_order_status_history" (
    "service_order_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "from_status" "service_order_status",
    "to_status" "service_order_status" NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_order_status_history_pkey" PRIMARY KEY ("service_order_id","position")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_number_key" ON "service_orders"("number");

-- CreateIndex
CREATE INDEX "service_orders_customer_id_idx" ON "service_orders"("customer_id");

-- CreateIndex
CREATE INDEX "service_orders_status_idx" ON "service_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_vehicle_id_key" ON "service_orders"("vehicle_id") WHERE ("delivered_at" IS NULL);

-- AddForeignKey
ALTER TABLE "service_order_service_items" ADD CONSTRAINT "service_order_service_items_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_part_items" ADD CONSTRAINT "service_order_part_items_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_quotes" ADD CONSTRAINT "service_order_quotes_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_status_history" ADD CONSTRAINT "service_order_status_history_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
