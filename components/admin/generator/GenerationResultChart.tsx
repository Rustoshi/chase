"use client"

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import type { GenerateHistoryResult } from "@/lib/services/historyGenerator.service"

interface Props {
  result: GenerateHistoryResult
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(n)
}

export function GenerationResultChart({ result }: Props) {
  // Build cumulative balance line from monthBreakdown
  let running = 0
  const data = result.monthBreakdown.map((mb) => {
    running += mb.net
    return {
      month:   mb.month,
      income:  Math.round(mb.income),
      expenses: Math.round(mb.expenses),
      balance: Math.round(running),
    }
  })

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Transactions created", value: result.transactionsCreated.toLocaleString(), color: "text-gray-900" },
          { label: "Total income",          value: fmt(result.incomeTotal),                    color: "text-emerald-600" },
          { label: "Total expenses",         value: fmt(result.expensesTotal),                  color: "text-red-500" },
          { label: "Final balance",          value: fmt(result.finalBalance),                   color: "text-indigo-600" },
        ].map((card) => (
          <div key={card.label} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className={`text-lg font-semibold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {data.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Monthly breakdown</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis
                yAxisId="left"
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number, name: string) => [fmt(value), name]}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar yAxisId="left" dataKey="income"   name="Income"   fill="#10b981" opacity={0.8} radius={[3, 3, 0, 0]} />
              <Bar yAxisId="left" dataKey="expenses" name="Expenses" fill="#f87171" opacity={0.8} radius={[3, 3, 0, 0]} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="balance"
                name="Balance"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3, fill: "#3b82f6" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  )
}
