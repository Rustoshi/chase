"use client"

import { useState }           from "react"
import { formatDistanceToNow } from "date-fns"
import { Copy, Check }        from "lucide-react"
import { cn }                 from "@/lib/utils"
import { DataTable }          from "@/components/admin/DataTable"
import { StatusBadge }        from "@/components/admin/StatusBadge"
import type { RecentTransaction } from "@/lib/services/dashboard.service"

const fmt = (n: number, currency = "USD") => {
  const divisor = currency === "BTC" ? 1e8 : 100
  const value = n / divisor
  if (currency === "BTC") {
    return `₿${value.toFixed(8)}`
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value)
}

const TX_SIGN: Record<string, boolean> = {
  deposit:          true,
  transfer_in:      true,
  admin_deposit:    true,
  swap_in:          true,
  loan_disbursement:true,
  refund:           true,
}

function CopyRef({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={copy}
      className="group flex items-center gap-1.5 font-mono text-xs text-slate-500 hover:text-slate-800"
    >
      <span className="max-w-[100px] truncate">{value}</span>
      {copied
        ? <Check  className="h-3 w-3 text-emerald-500" />
        : <Copy   className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
      }
    </button>
  )
}

interface Props {
  initialData: RecentTransaction[]
}

export function RecentTransactionsTable({ initialData }: Props) {
  const columns = [
    {
      key:    "reference",
      label:  "Reference",
      render: (r: RecentTransaction) => <CopyRef value={r.reference} />,
    },
    {
      key:    "userName",
      label:  "User",
      render: (r: RecentTransaction) => (
        <span className="text-slate-700">{r.userName}</span>
      ),
    },
    {
      key:    "type",
      label:  "Type",
      render: (r: RecentTransaction) => (
        <span className="capitalize text-slate-600">{r.type.replace(/_/g, " ")}</span>
      ),
    },
    {
      key:    "amount",
      label:  "Amount",
      sortable: true,
      render: (r: RecentTransaction) => {
        const positive = TX_SIGN[r.type] ?? false
        return (
          <span className={cn("font-medium", positive ? "text-emerald-600" : "text-red-500")}>
            {positive ? "+" : "−"}{fmt(r.amount, r.currency)}
          </span>
        )
      },
    },
    {
      key:    "status",
      label:  "Status",
      render: (r: RecentTransaction) => <StatusBadge status={r.status} />,
    },
    {
      key:    "createdAt",
      label:  "When",
      render: (r: RecentTransaction) => (
        <span className="text-xs text-slate-400">
          {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
        </span>
      ),
    },
  ]

  const rows = initialData as unknown as Record<string, unknown>[]

  return (
    <DataTable
      columns={columns as unknown as Parameters<typeof DataTable>[0]["columns"]}
      data={rows}
      emptyMessage="No transactions yet."
    />
  )
}
