// Re-export Prisma types where needed, and define app-level types

export type UserRole =
  | 'STC_EXECUTIVE'
  | 'STC_OPS_MANAGER'
  | 'STC_COORDINATOR'
  | 'STC_READ_ONLY'
  | 'WAREHOUSE_OPS'
  | 'CLIENT_USER'

export type ASNStatus = 'SCHEDULED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED'
export type ReceiptStatus = 'PENDING' | 'COMPLETE' | 'DISCREPANCY'
export type OrderStatus = 'DRAFT' | 'ALLOCATED' | 'PARTIAL' | 'READY' | 'AT_RISK' | 'COMPLETE' | 'CANCELLED'
export type LoadType = 'PALLETIZED' | 'FLOOR_LOADED' | 'MIXED'
export type ShipmentStatus = 'PENDING_PICKUP' | 'IN_TRANSIT' | 'DELIVERED' | 'EXCEPTION'
export type PackageStatus = 'EXPECTED' | 'RECEIVED' | 'QUARANTINED' | 'APPROVED' | 'REJECTED'
export type DiscrepancyStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED'
export type AlertType = 'LOW_STOCK' | 'AGING_INVENTORY' | 'DISCREPANCY' | 'UNEXPECTED_PACKAGE' | 'ORDER_READY'

export type DiscrepancyType =
  | 'BOX_CRUSHED'
  | 'WATER_DAMAGE'
  | 'PACKAGING_DAMAGE'
  | 'MISSING_ITEM'
  | 'OVERAGE'
  | 'WRONG_ITEM'
  | 'OTHER'

// Dashboard stat card type
export interface StatCard {
  title: string
  value: number | string
  trend?: number
  trendLabel?: string
  status?: 'good' | 'warning' | 'danger' | 'info'
  href?: string
}

// Dimensional weight calculation
export interface DimWeightResult {
  length: number
  width: number
  height: number
  actualWeight: number
  dimFactor: number
  dimWeight: number
  chargeableWeight: number
}

// EDI types
export interface EDI214Segment {
  transactionSetId: string
  shipmentId: string
  statusCode: string
  statusDate: string
  statusTime: string
  airportCode?: string
  carrier?: string
  proNumber?: string
}

// Bulk import types
export interface OrderImportRow {
  store_num?: string
  sku_code: string
  quantity: number
  [key: string]: string | number | undefined
}

// Pack list PDF types
export interface PackListData {
  order: {
    code: string
    date: string
    client: string
    project: string
    warehouse: string
    warehouseAddress: string
    store?: string
    storeAddress?: string
    loadType: LoadType
  }
  pallets: Array<{
    number: number
    length: number
    width: number
    height: number
    weight: number
    shrinkWrapped: boolean
    items: Array<{
      skuCode: string
      description: string
      qty: number
    }>
  }>
  floorItems: Array<{
    skuCode: string
    description: string
    qty: number
  }>
  totals: {
    palletCount: number
    totalPieces: number
    totalWeight: number
  }
}

// BOL PDF types
export interface BOLData {
  orderId: string
  date: string
  shipper: {
    name: string
    address: string
    city: string
    state: string
    zip: string
  }
  consignee: {
    name: string
    address: string
    city: string
    state: string
    zip: string
  }
  freightStcNum?: string
  whStcNum?: string
  airportCode?: string
  items: Array<{
    skuCode: string
    description: string
    qty: number
    length?: number
    width?: number
    height?: number
    actualWeight?: number
    dimWeight?: number
    chargeableWeight?: number
  }>
  carrier?: string
  proNumber?: string
}

// Alert notification types
export interface AlertNotification {
  type: AlertType
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  entityId?: number
  entityType?: string
  createdAt: Date
}

// Status display helpers
export const STATUS_COLORS: Record<string, string> = {
  // Order statuses
  DRAFT: 'gray',
  ALLOCATED: 'blue',
  PARTIAL: 'yellow',
  READY: 'green',
  AT_RISK: 'red',
  COMPLETE: 'green',
  CANCELLED: 'gray',
  // ASN statuses
  SCHEDULED: 'blue',
  IN_TRANSIT: 'yellow',
  RECEIVED: 'green',
  // Receipt statuses
  PENDING: 'yellow',
  DISCREPANCY: 'red',
  // Shipment statuses
  PENDING_PICKUP: 'yellow',
  DELIVERED: 'green',
  EXCEPTION: 'red',
  // Package statuses
  EXPECTED: 'blue',
  QUARANTINED: 'red',
  APPROVED: 'green',
  REJECTED: 'red',
  // Discrepancy statuses
  OPEN: 'red',
  UNDER_REVIEW: 'yellow',
  RESOLVED: 'green',
}

export const DISCREPANCY_TYPE_LABELS: Record<DiscrepancyType, string> = {
  BOX_CRUSHED: 'Box Crushed',
  WATER_DAMAGE: 'Water Damage',
  PACKAGING_DAMAGE: 'Packaging Damage',
  MISSING_ITEM: 'Missing Item',
  OVERAGE: 'Overage',
  WRONG_ITEM: 'Wrong Item',
  OTHER: 'Other',
}

export const LOAD_TYPE_LABELS: Record<LoadType, string> = {
  PALLETIZED: 'Palletized',
  FLOOR_LOADED: 'Floor-Loaded',
  MIXED: 'Mixed',
}
