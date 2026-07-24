"use client"

import { Bitcoin, DollarSign } from "lucide-react"

interface Props {
  fiatUSD: number
  btcBTC:  number
}

export function PlatformBalanceCard({ fiatUSD, btcBTC }: Props) {
  const fmtUSD = new Intl.NumberFormat("en-US", {
    style:    "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(fiatUSD)

  const fmtBtc = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 8,
  }).format(btcBTC) + " BTC"

  return (
    <div className="admin-card" style={{ padding: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--admin-text-primary)" }}>Platform Balances</h3>
      <p style={{ marginTop: 2, fontSize: 12, color: "var(--admin-text-muted)" }}>Aggregate across all user accounts</p>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 12, 
            padding: "14px 16px", 
            borderRadius: 8, 
            background: "var(--admin-bg-card)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 9999,
              background: "var(--admin-success-bg)",
              color: "var(--admin-success)",
            }}
          >
            <DollarSign size={18} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--admin-text-muted)" }}>Fiat (USD)</p>
            <p style={{ fontSize: 20, fontWeight: 600, color: "var(--admin-text-primary)" }}>{fmtUSD}</p>
          </div>
        </div>

        <div 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 12, 
            padding: "14px 16px", 
            borderRadius: 8, 
            background: "var(--admin-bg-card)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 9999,
              background: "rgba(247,147,26,0.12)",
              color: "#f7931a",
            }}
          >
            <Bitcoin size={18} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--admin-text-muted)" }}>Bitcoin</p>
            <p style={{ fontSize: 20, fontWeight: 600, color: "var(--admin-text-primary)" }}>{fmtBtc}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
