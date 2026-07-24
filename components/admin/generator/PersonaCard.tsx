"use client"

import {
  GraduationCap, Laptop, Briefcase, Building2, Sunset,
} from "lucide-react"
import { PERSONAS, type PersonaKey } from "@/lib/constants/personas"

const ICONS: Record<PersonaKey, React.ReactNode> = {
  student:      <GraduationCap className="w-5 h-5" />,
  freelancer:   <Laptop        className="w-5 h-5" />,
  professional: <Briefcase     className="w-5 h-5" />,
  business:     <Building2     className="w-5 h-5" />,
  retiree:      <Sunset        className="w-5 h-5" />,
}

const ACCENT: Record<PersonaKey, string> = {
  student:      "border-indigo-500   bg-indigo-50   text-indigo-700",
  freelancer:   "border-violet-500 bg-violet-50 text-violet-700",
  professional: "border-emerald-500 bg-emerald-50 text-emerald-700",
  business:     "border-amber-500  bg-amber-50  text-amber-700",
  retiree:      "border-rose-500   bg-rose-50   text-rose-700",
}

const ACCENT_RING: Record<PersonaKey, string> = {
  student:      "ring-indigo-500",
  freelancer:   "ring-violet-500",
  professional: "ring-emerald-500",
  business:     "ring-amber-500",
  retiree:      "ring-rose-500",
}

interface Props {
  personaKey: PersonaKey
  selected:   boolean
  onClick:    () => void
}

export function PersonaCard({ personaKey, selected, onClick }: Props) {
  const p   = PERSONAS[personaKey]
  const key = personaKey as PersonaKey

  const topMerchants = p.expenseCategories
    .slice(0, 2)
    .flatMap((c) => c.merchants.slice(0, 2))

  const savingsPct = Math.round(p.savingsRate * 100)
  const incomeRange = `$${(p.monthlyIncome.min / 1000).toFixed(0)}k–$${(p.monthlyIncome.max / 1000).toFixed(1)}k`

  return (
    <button
      onClick={onClick}
      className={[
        "relative flex flex-col gap-3 rounded-xl border-2 p-4 text-left transition-all",
        "hover:shadow-md focus:outline-none",
        selected
          ? `${ACCENT[key].split(" ")[0]} ring-2 ring-offset-2 ${ACCENT_RING[key]} shadow-md`
          : "border-gray-200 bg-white hover:border-gray-300",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className={[
          "flex items-center justify-center w-9 h-9 rounded-lg",
          selected ? ACCENT[key] : "bg-gray-100 text-gray-500",
        ].join(" ")}>
          {ICONS[key]}
        </span>
        <div>
          <p className="font-semibold text-sm capitalize text-gray-900">{personaKey}</p>
          <p className="text-xs text-gray-500">{incomeRange}/mo</p>
        </div>
        {selected && (
          <span className={[
            "ml-auto text-xs font-medium px-2 py-0.5 rounded-full",
            ACCENT[key],
          ].join(" ")}>Selected</span>
        )}
      </div>

      {/* Best-for */}
      <p className="text-xs text-gray-600 leading-snug">{p.bestFor}</p>

      {/* Savings bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Savings rate</span>
          <span className="font-medium">{savingsPct}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={[
              "h-full rounded-full transition-all",
              selected ? ACCENT[key].split(" ")[0].replace("border-", "bg-") : "bg-gray-300",
            ].join(" ")}
            style={{ width: `${savingsPct}%` }}
          />
        </div>
      </div>

      {/* Top merchants */}
      <div className="flex flex-wrap gap-1">
        {topMerchants.slice(0, 4).map((m) => (
          <span key={m} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
            {m}
          </span>
        ))}
        {topMerchants.length < p.expenseCategories.flatMap((c) => c.merchants).length && (
          <span className="text-xs text-gray-400">+more</span>
        )}
      </div>

      {/* Tx frequency */}
      <p className="text-xs text-gray-400">
        {p.transactionsPerMonth.min}–{p.transactionsPerMonth.max} transactions/mo
        &nbsp;·&nbsp;
        {p.incomeFrequency} income
      </p>
    </button>
  )
}
