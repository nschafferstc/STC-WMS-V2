import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { DimWeightResult } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Dimensional weight calculation
// Formula: (L × W × H) ÷ dim_factor
// Chargeable weight = max(actual_weight, dim_weight)
export function calculateDimWeight(params: {
  length: number
  width: number
  height: number
  actualWeight: number
  dimFactor?: number
}): DimWeightResult {
  const { length, width, height, actualWeight, dimFactor = 194 } = params
  const dimWeight = (length * width * height) / dimFactor
  const chargeableWeight = Math.max(actualWeight, dimWeight)
  return {
    length,
    width,
    height,
    actualWeight,
    dimFactor,
    dimWeight: Math.ceil(dimWeight * 10) / 10,
    chargeableWeight: Math.ceil(chargeableWeight * 10) / 10,
  }
}

// Format order code: STC-ORD-{YYYY}-{zero-padded 4-digit sequence}
export function formatOrderCode(year: number, sequence: number): string {
  return `STC-ORD-${year}-${String(sequence).padStart(4, '0')}`
}

// Zero-pad ZIP codes to 5 digits (required before airport code lookup)
export function padZip(zip: string): string {
  return zip.padStart(5, '0')
}

// Normalize origin warehouse tag (OH → CMH)
export function normalizeOriginTag(tag: string): string {
  if (tag === 'OH') return 'CMH'
  return tag
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function getInventoryStatus(available: number, threshold?: number | null): 'good' | 'warning' | 'danger' {
  if (available <= 0) return 'danger'
  if (threshold && available <= threshold) return 'warning'
  return 'good'
}

export function getInventoryAgeDays(receivedDate: Date): number {
  const now = new Date()
  const diff = now.getTime() - receivedDate.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function isSTCRole(role: string): boolean {
  return ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR', 'STC_READ_ONLY'].includes(role)
}

export function canEdit(role: string): boolean {
  return ['STC_EXECUTIVE', 'STC_OPS_MANAGER', 'STC_COORDINATOR', 'WAREHOUSE_OPS'].includes(role)
}

export function isAdmin(role: string): boolean {
  return ['STC_EXECUTIVE', 'STC_OPS_MANAGER'].includes(role)
}
