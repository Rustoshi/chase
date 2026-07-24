"use client"

import Link from "next/link"
import { Users, FileCheck, CreditCard, Settings } from "lucide-react"

const ACTIONS = [
  {
    href:  "/admin/users",
    icon:  Users,
    label: "Manage Users",
    desc:  "View, suspend, or edit users",
  },
  {
    href:  "/admin/deposits",
    icon:  FileCheck,
    label: "Deposit Requests",
    desc:  "Approve or reject deposits",
  },
  {
    href:  "/admin/kyc",
    icon:  CreditCard,
    label: "KYC Review",
    desc:  "Verify identity documents",
  },
  {
    href:  "/admin/settings",
    icon:  Settings,
    label: "App Settings",
    desc:  "Configure platform options",
  },
]

export function QuickActionsCard() {
  return (
    <div className="admin-card" style={{ padding: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--admin-text-primary)" }}>Quick Actions</h3>
      <p style={{ marginTop: 2, fontSize: 12, color: "var(--admin-text-muted)" }}>Common admin tasks</p>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
        {ACTIONS.map((a) => {
          const Icon = a.icon
          return (
            <Link
              key={a.href}
              href={a.href}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: 14,
                borderRadius: 8,
                border: "1px solid var(--admin-border)",
                background: "var(--admin-bg-card)",
                textDecoration: "none",
                transition: "all 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--admin-accent)"
                e.currentTarget.style.background = "var(--admin-accent-bg)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--admin-border)"
                e.currentTarget.style.background = "var(--admin-bg-card)"
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                  background: "var(--admin-accent-bg)",
                  color: "var(--admin-accent)",
                }}
              >
                <Icon size={18} />
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--admin-text-primary)" }}>
                {a.label}
              </span>
              <span style={{ fontSize: 11, color: "var(--admin-text-muted)" }}>{a.desc}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
