-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReturnType" AS ENUM ('JOB_SITE', 'CUSTOMER', 'VENDOR');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('PENDING', 'RECEIVED', 'RESTOCKED', 'QUARANTINED', 'RETURNED_TO_VENDOR');

-- AlterTable
ALTER TABLE "ASN" ADD COLUMN     "bol_number" TEXT,
ADD COLUMN     "carrier" TEXT,
ADD COLUMN     "container_num" TEXT,
ADD COLUMN     "pro_number" TEXT,
ADD COLUMN     "shipment_type" TEXT DEFAULT 'DOMESTIC';

-- CreateTable
CREATE TABLE "TransferOrder" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "from_warehouse_id" INTEGER NOT NULL,
    "to_warehouse_id" INTEGER NOT NULL,
    "client_id" INTEGER,
    "status" "TransferStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "confirmed_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferLine" (
    "id" SERIAL NOT NULL,
    "transfer_id" INTEGER NOT NULL,
    "sku_id" INTEGER NOT NULL,
    "qty_requested" INTEGER NOT NULL,
    "qty_sent" INTEGER,
    "qty_received" INTEGER,

    CONSTRAINT "TransferLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Return" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "return_type" "ReturnType" NOT NULL DEFAULT 'JOB_SITE',
    "status" "ReturnStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "received_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReturnLine" (
    "id" SERIAL NOT NULL,
    "return_id" INTEGER NOT NULL,
    "sku_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "notes" TEXT,

    CONSTRAINT "ReturnLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "user_name" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransferOrder_code_key" ON "TransferOrder"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Return_code_key" ON "Return"("code");

-- AddForeignKey
ALTER TABLE "TransferOrder" ADD CONSTRAINT "TransferOrder_from_warehouse_id_fkey" FOREIGN KEY ("from_warehouse_id") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferOrder" ADD CONSTRAINT "TransferOrder_to_warehouse_id_fkey" FOREIGN KEY ("to_warehouse_id") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferLine" ADD CONSTRAINT "TransferLine_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "TransferOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferLine" ADD CONSTRAINT "TransferLine_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "SKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Return" ADD CONSTRAINT "Return_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnLine" ADD CONSTRAINT "ReturnLine_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "Return"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReturnLine" ADD CONSTRAINT "ReturnLine_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "SKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
