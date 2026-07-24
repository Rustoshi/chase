"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import { Download } from "lucide-react"
import { Button }   from "@/components/ui/button"

interface AmortizationRow {
  month:     number
  date:      string
  payment:   number
  principal: number
  interest:  number
  balance:   number
}

interface Props {
  principal:   number
  annualRate:  number
  termMonths:  number
  startDate:   Date
  maxVisible?: number
}

const ROW_H     = 36
const BUFFER    = 10
const COLLAPSED = 6

function buildSchedule(principal: number, annualRate: number, termMonths: number, startDate: Date): AmortizationRow[] {
  const rows: AmortizationRow[] = []
  let balance = principal

  const monthlyPayment = annualRate === 0
    ? principal / termMonths
    : principal * (annualRate / 100 / 12) / (1 - Math.pow(1 + annualRate / 100 / 12, -termMonths))

  for (let i = 1; i <= termMonths; i++) {
    const interestCharge = annualRate === 0 ? 0 : balance * (annualRate / 100 / 12)
    const principalPaid  = Math.min(balance, monthlyPayment - interestCharge)
    balance              = Math.max(0, balance - principalPaid)

    const payDate = new Date(startDate)
    payDate.setMonth(payDate.getMonth() + i)

    rows.push({
      month:     i,
      date:      payDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      payment:   Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(principalPaid  * 100) / 100,
      interest:  Math.round(interestCharge * 100) / 100,
      balance:   Math.round(balance         * 100) / 100,
    })
  }
  return rows
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" })
}

function exportCSV(rows: AmortizationRow[]) {
  const header = "Month,Payment Date,Payment,Principal,Interest,Balance\n"
  const body   = rows.map((r) =>
    `${r.month},"${r.date}",${r.payment},${r.principal},${r.interest},${r.balance}`
  ).join("\n")
  const blob = new Blob([header + body], { type: "text/csv" })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement("a"), { href: url, download: "amortization.csv" })
  a.click()
  URL.revokeObjectURL(url)
}

export function AmortizationTable({ principal, annualRate, termMonths, startDate, maxVisible }: Props) {
  const rows     = useMemo(
    () => buildSchedule(principal, annualRate, termMonths, startDate),
    [principal, annualRate, termMonths, startDate]
  )
  const [expanded, setExpanded] = useState(false)
  const containerRef             = useRef<HTMLDivElement>(null)
  const [scrollTop,  setScrollTop]  = useState(0)
  const [viewHeight, setViewHeight] = useState(300)

  const visibleRows = maxVisible && !expanded ? rows.slice(0, maxVisible) : rows
  const useVirtual  = visibleRows.length > 50

  useEffect(() => {
    const el = containerRef.current
    if (!el || !useVirtual) return
    const ro = new ResizeObserver(() => setViewHeight(el.clientHeight))
    ro.observe(el)
    setViewHeight(el.clientHeight)
    return () => ro.disconnect()
  }, [useVirtual])

  const startIdx = useVirtual ? Math.max(0, Math.floor(scrollTop / ROW_H) - BUFFER)            : 0
  const endIdx   = useVirtual ? Math.min(visibleRows.length, Math.ceil((scrollTop + viewHeight) / ROW_H) + BUFFER) : visibleRows.length

  const totalPayment   = rows.reduce((s, r) => s + r.payment,   0)
  const totalPrincipal = rows.reduce((s, r) => s + r.principal, 0)
  const totalInterest  = rows.reduce((s, r) => s + r.interest,  0)

  const tableRows = visibleRows.slice(startIdx, endIdx)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Amortization schedule — {rows.length} payments
        </p>
        <Button size="sm" variant="outline" onClick={() => exportCSV(rows)} className="h-7 text-xs gap-1.5">
          <Download className="w-3 h-3" /> Export CSV
        </Button>
      </div>

      <div
        ref={containerRef}
        className={useVirtual ? "overflow-auto scrollbar-hide border border-gray-200 rounded-lg" : "border border-gray-200 rounded-lg overflow-x-auto scrollbar-hide"}
        style={useVirtual ? { height: Math.min(360, visibleRows.length * ROW_H + 40) } : undefined}
        onScroll={useVirtual ? (e) => setScrollTop(e.currentTarget.scrollTop) : undefined}
      >
        <table className="w-full min-w-[560px] text-xs" style={useVirtual ? { tableLayout: "fixed" } : undefined}>
          <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
            <tr>
              {["Month", "Payment Date", "Payment", "Principal", "Interest", "Balance"].map((h) => (
                <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {useVirtual && startIdx > 0 && (
              <tr style={{ height: startIdx * ROW_H }}>
                <td colSpan={6} />
              </tr>
            )}
            {tableRows.map((row) => (
              <tr
                key={row.month}
                style={{ height: ROW_H }}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="px-3 py-1.5 text-gray-500">{row.month}</td>
                <td className="px-3 py-1.5 text-gray-700">{row.date}</td>
                <td className="px-3 py-1.5 font-medium text-gray-900">{fmt(row.payment)}</td>
                <td className="px-3 py-1.5 text-emerald-700">{fmt(row.principal)}</td>
                <td className="px-3 py-1.5 text-red-500">{fmt(row.interest)}</td>
                <td className="px-3 py-1.5 text-gray-700">{fmt(row.balance)}</td>
              </tr>
            ))}
            {useVirtual && endIdx < visibleRows.length && (
              <tr style={{ height: (visibleRows.length - endIdx) * ROW_H }}>
                <td colSpan={6} />
              </tr>
            )}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2 border-gray-200 sticky bottom-0">
            <tr>
              <td colSpan={2} className="px-3 py-2 font-semibold text-gray-700 text-xs">Totals</td>
              <td className="px-3 py-2 font-semibold text-gray-900">{fmt(totalPayment)}</td>
              <td className="px-3 py-2 font-semibold text-emerald-700">{fmt(totalPrincipal)}</td>
              <td className="px-3 py-2 font-semibold text-red-500">{fmt(totalInterest)}</td>
              <td className="px-3 py-2" />
            </tr>
          </tfoot>
        </table>
      </div>

      {maxVisible && rows.length > (maxVisible ?? COLLAPSED) && !useVirtual && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-indigo-600 hover:underline"
        >
          {expanded ? "Show less" : `Show all ${rows.length} payments`}
        </button>
      )}
    </div>
  )
}
