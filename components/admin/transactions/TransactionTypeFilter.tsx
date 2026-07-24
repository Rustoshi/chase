"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

const TYPE_GROUPS = [
  { label: "Deposits",           types: ["deposit", "admin_deposit"] as const },
  { label: "Transfers",          types: ["transfer_in", "transfer_out"] as const },
  { label: "Swaps",              types: ["swap_in", "swap_out"] as const },
  { label: "Currency",           types: ["fx_conversion"] as const },
  { label: "Fees & Adjustments", types: ["fee", "refund"] as const },
  { label: "Loans",              types: ["loan_disbursement", "loan_repayment"] as const },
] as const

export const TYPE_LABELS: Record<string, string> = {
  deposit:          "Deposit",
  admin_deposit:    "Admin Deposit",
  withdrawal:       "Withdrawal",
  transfer_in:      "Transfer In",
  transfer_out:     "Transfer Out",
  swap_in:          "Swap In",
  swap_out:         "Swap Out",
  fx_conversion:    "FX Conversion",
  fee:              "Fee",
  refund:           "Refund",
  loan_disbursement:"Loan Disbursement",
  loan_repayment:   "Loan Repayment",
}

// not in groups (withdrawal appears elsewhere)
const EXTRA_TYPES = ["withdrawal"] as const

interface Props {
  selected: string[]
  onChange: (types: string[]) => void
}

export function TransactionTypeFilter({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const toggle = (type: string) => {
    onChange(
      selected.includes(type)
        ? selected.filter((t) => t !== type)
        : [...selected, type]
    )
  }

  const toggleGroup = (types: readonly string[]) => {
    const allIn = types.every((t) => selected.includes(t))
    if (allIn) {
      onChange(selected.filter((t) => !types.includes(t)))
    } else {
      const toAdd = types.filter((t) => !selected.includes(t))
      onChange([...selected, ...toAdd])
    }
  }

  const allGroups = [...TYPE_GROUPS.flatMap((g) => g.types), ...EXTRA_TYPES]

  const toggleAll = () => {
    if (selected.length === allGroups.length) {
      onChange([])
    } else {
      onChange([...allGroups])
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-9 items-center gap-2 rounded-lg border px-3 text-sm transition-colors",
          selected.length > 0
            ? "border-[#1A2CCE] bg-[#1A2CCE]/5 text-[#1A2CCE]"
            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
        )}
      >
        Type
        {selected.length > 0 && (
          <span className="rounded-full bg-[#1A2CCE] px-1.5 py-0.5 text-[10px] font-semibold text-white leading-none">
            {selected.length}
          </span>
        )}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-50 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          {/* Select all */}
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={selected.length === allGroups.length}
              ref={(el) => {
                if (el) el.indeterminate = selected.length > 0 && selected.length < allGroups.length
              }}
              onChange={toggleAll}
              className="rounded border-slate-300"
            />
            <span className="text-sm font-medium text-slate-700">All types</span>
            {selected.length > 0 && (
              <button
                onClick={(e) => { e.preventDefault(); onChange([]) }}
                className="ml-auto text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </label>

          <div className="my-1.5 border-t border-slate-100" />

          {[...TYPE_GROUPS, { label: "Withdrawals", types: EXTRA_TYPES }].map((group) => {
            const allInGroup = group.types.every((t) => selected.includes(t))
            const someInGroup = !allInGroup && group.types.some((t) => selected.includes(t))
            return (
              <div key={group.label} className="mb-1">
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={allInGroup}
                    ref={(el) => { if (el) el.indeterminate = someInGroup }}
                    onChange={() => toggleGroup(group.types)}
                    className="rounded border-slate-300"
                  />
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {group.label}
                  </span>
                </label>
                {group.types.map((type) => (
                  <label
                    key={type}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1 pl-7 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(type)}
                      onChange={() => toggle(type)}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">{TYPE_LABELS[type] ?? type}</span>
                  </label>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
