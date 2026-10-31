/*
  Warnings:

  - A unique constraint covering the columns `[tracking_code]` on the table `service_orders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tracking_code` to the `service_orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "service_orders" ADD COLUMN     "tracking_code" CHAR(8) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_tracking_code_key" ON "service_orders"("tracking_code");
