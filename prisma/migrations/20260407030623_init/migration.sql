-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR', 'STC_READ_ONLY', 'WAREHOUSE_OPS', 'CLIENT_USER');

-- CreateEnum
CREATE TYPE "ASNStatus" AS ENUM ('SCHEDULED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('PENDING', 'COMPLETE', 'DISCREPANCY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'ALLOCATED', 'PARTIAL', 'READY', 'AT_RISK', 'COMPLETE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LoadType" AS ENUM ('PALLETIZED', 'FLOOR_LOADED', 'MIXED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PENDING_PICKUP', 'IN_TRANSIT', 'DELIVERED', 'EXCEPTION');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('EXPECTED', 'RECEIVED', 'QUARANTINED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DiscrepancyStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED');

-- CreateEnum
CREATE TYPE "DiscrepancyType" AS ENUM ('BOX_CRUSHED', 'WATER_DAMAGE', 'PACKAGING_DAMAGE', 'MISSING_ITEM', 'OVERAGE', 'WRONG_ITEM', 'OTHER');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('LOW_STOCK', 'AGING_INVENTORY', 'DISCREPANCY', 'UNEXPECTED_PACKAGE', 'ORDER_READY');

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "stc_reference_name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client_id" INTEGER NOT NULL,
    "isRollout" BOOLEAN NOT NULL DEFAULT false,
    "aging_threshold_days" INTEGER NOT NULL DEFAULT 90,
    "dim_factor_override" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" SERIAL NOT NULL,
    "freight_stc_num" TEXT NOT NULL,
    "wh_stc_num" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "region_code" TEXT NOT NULL,
    "store_num" TEXT NOT NULL,
    "subcode" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "airport_code" TEXT NOT NULL,
    "origin_wh_tag" TEXT,
    "project_id" INTEGER NOT NULL,
    "assigned_warehouse_id" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'WAREHOUSE_OPS',
    "warehouse_id" INTEGER,
    "client_id" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "SKU" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT NOT NULL,
    "client_id" INTEGER NOT NULL,
    "dims_l" DECIMAL(10,2),
    "dims_w" DECIMAL(10,2),
    "dims_h" DECIMAL(10,2),
    "weight_lbs" DECIMAL(10,2),
    "units_per_pallet" INTEGER,
    "low_stock_threshold" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SKU_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSKU" (
    "project_id" INTEGER NOT NULL,
    "sku_id" INTEGER NOT NULL,

    CONSTRAINT "ProjectSKU_pkey" PRIMARY KEY ("project_id","sku_id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" SERIAL NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "sku_id" INTEGER NOT NULL,
    "on_hand" INTEGER NOT NULL DEFAULT 0,
    "allocated" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLot" (
    "id" SERIAL NOT NULL,
    "sku_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    "received_date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ASN" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "client_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "status" "ASNStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "expected_date" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ASN_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ASNLine" (
    "id" SERIAL NOT NULL,
    "asn_id" INTEGER NOT NULL,
    "sku_id" INTEGER NOT NULL,
    "expected_qty" INTEGER NOT NULL,

    CONSTRAINT "ASNLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InboundReceipt" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "asn_id" INTEGER NOT NULL,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "received_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InboundReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptLine" (
    "id" SERIAL NOT NULL,
    "receipt_id" INTEGER NOT NULL,
    "sku_id" INTEGER NOT NULL,
    "expected_qty" INTEGER NOT NULL,
    "received_qty" INTEGER NOT NULL,
    "discrepancy_type" "DiscrepancyType",
    "notes" TEXT,

    CONSTRAINT "ReceiptLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "client_id" INTEGER NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "store_id" INTEGER,
    "load_type" "LoadType" NOT NULL DEFAULT 'PALLETIZED',
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderLine" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "sku_id" INTEGER NOT NULL,
    "ordered_qty" INTEGER NOT NULL,
    "allocated" INTEGER NOT NULL DEFAULT 0,
    "shipped" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pallet" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "order_id" INTEGER,
    "length" DECIMAL(10,2),
    "width" DECIMAL(10,2),
    "height" DECIMAL(10,2),
    "weight_lbs" DECIMAL(10,2),
    "shrink_wrapped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PalletItem" (
    "id" SERIAL NOT NULL,
    "pallet_id" INTEGER NOT NULL,
    "sku_id" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "PalletItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "order_id" INTEGER NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PENDING_PICKUP',
    "carrier" TEXT,
    "pro_number" TEXT,
    "tracking" TEXT,
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentPallet" (
    "shipment_id" INTEGER NOT NULL,
    "pallet_id" INTEGER NOT NULL,

    CONSTRAINT "ShipmentPallet_pkey" PRIMARY KEY ("shipment_id","pallet_id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "warehouse_id" INTEGER NOT NULL,
    "asn_id" INTEGER,
    "status" "PackageStatus" NOT NULL DEFAULT 'EXPECTED',
    "carrier" TEXT,
    "tracking" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discrepancy" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "source_ref" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "DiscrepancyStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discrepancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BOLTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "project_id" INTEGER,
    "template" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BOLTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertRule" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "project_id" INTEGER,
    "threshold" DECIMAL(10,2),
    "recipients" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Client_code_key" ON "Client"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "Project"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "SKU_code_key" ON "SKU"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_warehouse_id_sku_id_key" ON "Inventory"("warehouse_id", "sku_id");

-- CreateIndex
CREATE UNIQUE INDEX "ASN_code_key" ON "ASN"("code");

-- CreateIndex
CREATE UNIQUE INDEX "InboundReceipt_code_key" ON "InboundReceipt"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Order_code_key" ON "Order"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Pallet_code_key" ON "Pallet"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_code_key" ON "Shipment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Package_code_key" ON "Package"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_assigned_warehouse_id_fkey" FOREIGN KEY ("assigned_warehouse_id") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SKU" ADD CONSTRAINT "SKU_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSKU" ADD CONSTRAINT "ProjectSKU_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSKU" ADD CONSTRAINT "ProjectSKU_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "SKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "SKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "SKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLot" ADD CONSTRAINT "InventoryLot_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ASN" ADD CONSTRAINT "ASN_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ASN" ADD CONSTRAINT "ASN_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ASNLine" ADD CONSTRAINT "ASNLine_asn_id_fkey" FOREIGN KEY ("asn_id") REFERENCES "ASN"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ASNLine" ADD CONSTRAINT "ASNLine_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "SKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InboundReceipt" ADD CONSTRAINT "InboundReceipt_asn_id_fkey" FOREIGN KEY ("asn_id") REFERENCES "ASN"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptLine" ADD CONSTRAINT "ReceiptLine_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "InboundReceipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptLine" ADD CONSTRAINT "ReceiptLine_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "SKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderLine" ADD CONSTRAINT "OrderLine_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "SKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pallet" ADD CONSTRAINT "Pallet_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pallet" ADD CONSTRAINT "Pallet_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalletItem" ADD CONSTRAINT "PalletItem_pallet_id_fkey" FOREIGN KEY ("pallet_id") REFERENCES "Pallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PalletItem" ADD CONSTRAINT "PalletItem_sku_id_fkey" FOREIGN KEY ("sku_id") REFERENCES "SKU"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentPallet" ADD CONSTRAINT "ShipmentPallet_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "Shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentPallet" ADD CONSTRAINT "ShipmentPallet_pallet_id_fkey" FOREIGN KEY ("pallet_id") REFERENCES "Pallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_asn_id_fkey" FOREIGN KEY ("asn_id") REFERENCES "ASN"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOLTemplate" ADD CONSTRAINT "BOLTemplate_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertRule" ADD CONSTRAINT "AlertRule_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
