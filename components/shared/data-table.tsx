'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { ChevronUp, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Column<T> {
  key: keyof T | string
  header: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchKeys?: (keyof T)[]
  searchPlaceholder?: string
  emptyMessage?: string
  onRowClick?: (row: T) => void
  actions?: React.ReactNode
}

export function DataTable<T extends { id?: number | string }>({
  data,
  columns,
  searchKeys,
  searchPlaceholder = 'Search...',
  emptyMessage = 'No records found.',
  onRowClick,
  actions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const filtered = data.filter(row => {
    if (!search || !searchKeys) return true
    return searchKeys.some(key => {
      const val = (row[key] as string | undefined)?.toLowerCase() ?? ''
      return val.includes(search.toLowerCase())
    })
  })

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const aVal = String((a as Record<string, unknown>)[sortKey] ?? '')
        const bVal = String((b as Record<string, unknown>)[sortKey] ?? '')
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      })
    : filtered

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        {searchKeys && (
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
        {actions && <div className="flex items-center gap-2 ml-auto">{actions}</div>}
      </div>
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {columns.map(col => (
                  <th
                    key={String(col.key)}
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap',
                      col.sortable && 'cursor-pointer select-none hover:text-slate-900',
                      col.className
                    )}
                    onClick={() => col.sortable && handleSort(String(col.key))}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && sortKey === String(col.key) && (
                        sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-400">{emptyMessage}</td>
                </tr>
              ) : (
                sorted.map((row, i) => (
                  <tr
                    key={row.id ?? i}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'border-b border-slate-100 last:border-0',
                      onRowClick && 'cursor-pointer hover:bg-slate-50 transition-colors'
                    )}
                  >
                    {columns.map(col => (
                      <td key={String(col.key)} className={cn('px-4 py-3 text-slate-700', col.className)}>
                        {col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[String(col.key)] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
          {sorted.length} of {data.length} records
        </div>
      </div>
    </div>
  )
}
