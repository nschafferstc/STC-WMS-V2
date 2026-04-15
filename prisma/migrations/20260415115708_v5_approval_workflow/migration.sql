-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'PENDING_REVIEW';
ALTER TYPE "OrderStatus" ADD VALUE 'APPROVED';
ALTER TYPE "OrderStatus" ADD VALUE 'SENT_TO_WAREHOUSE';
ALTER TYPE "OrderStatus" ADD VALUE 'WAREHOUSE_CONFIRMED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "sent_to_warehouse_at" TIMESTAMP(3),
ADD COLUMN     "submitted_at" TIMESTAMP(3),
ADD COLUMN     "warehouse_confirmed_at" TIMESTAMP(3);
