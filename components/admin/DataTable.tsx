"use client"

import { useState, useMemo } from "react"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TableColumn<T = Record<string, unknown>> {
  key:       string
  label:     string
  sortable?: boolean
  render?:   (row: T) => React.ReactNode
  /** Hide this column on mobile card view */
  hideOnMobile?: boolean
  /** Show this column as primary info on mobile card */
  mobileLabel?: string
}

interface DataTableProps<T = Record<string, unknown>> {
  columns:       TableColumn<T>[]
  data:          T[]
  loading?:      boolean
  emptyMessage?: string
  /** Use card layout on mobile instead of horizontal scroll */
  mobileCards?:  boolean
}

// Deterministic widths to avoid SSR/hydration mismatch
const SKELETON_WIDTHS = ["62%", "78%", "48%", "68%", "55%", "72%", "45%", "65%"]

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading      = false,
  emptyMessage = "No data to display.",
  mobileCards  = true,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return sortDir === "asc" ?  1 : -1
      if (bv == null) return sortDir === "asc" ? -1 :  1
      if (av < bv)   return sortDir === "asc" ? -1 :  1
      if (av > bv)   return sortDir === "asc" ?  1 : -1
      return 0
    })
  }, [data, sortKey, sortDir])

  // Filter columns for mobile view
  const mobileColumns = columns.filter((col) => !col.hideOnMobile)

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* ── Desktop Table View ── */}
      <div className={cn("overflow-x-auto scrollbar-hide -mx-px", mobileCards && "hidden md:block")}>
        <table className="w-full min-w-[600px] text-sm">
          {/* ── Head ── */}
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
                    col.sortable && "cursor-pointer select-none hover:text-slate-700"
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && (
                      <span className="text-slate-400">
                        {sortKey === col.key ? (
                          sortDir === "asc"
                            ? <ChevronUp   className="h-3.5 w-3.5" />
                            : <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, rowIdx) => (
                <tr key={rowIdx} className="border-b border-slate-100">
                  {columns.map((col, colIdx) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <div
                        className="h-4 animate-pulse rounded bg-slate-100"
                        style={{
                          width: SKELETON_WIDTHS[
                            (rowIdx * columns.length + colIdx) % SKELETON_WIDTHS.length
                          ],
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-sm text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sorted.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5 text-slate-700">
                      {col.render
                        ? col.render(row)
                        : String(row[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Card View ── */}
      {mobileCards && (
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="p-4 space-y-3">
                <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
              </div>
            ))
          ) : sorted.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">
              {emptyMessage}
            </div>
          ) : (
            sorted.map((row, rowIdx) => (
              <div key={rowIdx} className="p-4 space-y-2">
                {mobileColumns.map((col, colIdx) => {
                  const content = col.render ? col.render(row) : String(row[col.key] ?? "—")
                  // First column is rendered larger as the primary info
                  if (colIdx === 0) {
                    return (
                      <div key={col.key} className="mb-2">
                        {content}
                      </div>
                    )
                  }
                  // Actions column rendered at the end without label
                  if (col.key === "actions") {
                    return (
                      <div key={col.key} className="flex justify-end pt-2">
                        {content}
                      </div>
                    )
                  }
                  // Other columns with labels
                  return (
                    <div key={col.key} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{col.mobileLabel || col.label}</span>
                      <span className="text-slate-700">{content}</span>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
