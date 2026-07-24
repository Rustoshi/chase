import Link                   from "next/link"
import { ArrowRight }         from "lucide-react"
import type { PendingActions } from "@/lib/services/dashboard.service"

interface ActionItem {
  label:  string
  count:  number
  href:   string
  urgent: boolean
}

interface Props {
  actions: PendingActions
}

export function PendingActionsPanel({ actions }: Props) {
  const items: ActionItem[] = [
    {
      label:  "Deposit requests awaiting review",
      count:  actions.pendingDeposits,
      href:   "/admin/deposits",
      urgent: actions.pendingDeposits > 5,
    },
    {
      label:  "KYC documents to verify",
      count:  actions.pendingKyc,
      href:   "/admin/kyc",
      urgent: actions.pendingKyc > 10,
    },
    {
      label:  "Transactions pending processing",
      count:  actions.pendingTransactions,
      href:   "/admin/transactions",
      urgent: actions.pendingTransactions > 20,
    },
    {
      label:  "Suspended user accounts",
      count:  actions.suspendedUsers,
      href:   "/admin/users?filter=suspended",
      urgent: false,
    },
  ]

  const total = items.reduce((s, i) => s + i.count, 0)

  return (
    <div className="admin-card" style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--admin-text-primary)" }}>Pending Actions</h3>
          <p style={{ marginTop: 2, fontSize: 12, color: "var(--admin-text-muted)" }}>Items that need your attention</p>
        </div>
        {total > 0 && (
          <span 
            style={{ 
              padding: "2px 8px", 
              borderRadius: 9999, 
              fontSize: 12, 
              fontWeight: 600, 
              background: "var(--admin-danger)", 
              color: "white" 
            }}
          >
            {total}
          </span>
        )}
      </div>

      <ul style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid var(--admin-border)",
                background: "var(--admin-bg-card)",
                textDecoration: "none",
                transition: "all 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--admin-border-strong)"
                e.currentTarget.style.background = "var(--admin-bg-elevated)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--admin-border)"
                e.currentTarget.style.background = "var(--admin-bg-card)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 700,
                    background: item.count === 0 
                      ? "var(--admin-bg-hover)" 
                      : item.urgent 
                        ? "var(--admin-danger-bg)" 
                        : "var(--admin-warning-bg)",
                    color: item.count === 0 
                      ? "var(--admin-text-muted)" 
                      : item.urgent 
                        ? "var(--admin-danger)" 
                        : "var(--admin-warning)",
                  }}
                >
                  {item.count}
                </span>
                <span style={{ fontSize: 13, color: "var(--admin-text-secondary)" }}>{item.label}</span>
              </div>
              <ArrowRight style={{ width: 16, height: 16, color: "var(--admin-text-muted)" }} />
            </Link>
          </li>
        ))}
      </ul>

      {total === 0 && (
        <p style={{ marginTop: 16, textAlign: "center", fontSize: 13, color: "var(--admin-text-muted)" }}>
          All clear — no pending actions
        </p>
      )}
    </div>
  )
}
