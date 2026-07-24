import { TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  label:          string
  value:          string | number
  delta?:         string
  deltaPositive?: boolean
  deltaVariant?:  "warning"
  icon?:          React.ReactNode
  iconColor?:     "blue" | "green" | "amber" | "red"
}

export function StatCard({ label, value, delta, deltaPositive, deltaVariant, icon, iconColor = "blue" }: StatCardProps) {
  const iconColorMap = {
    blue:  { bg: "var(--admin-accent-bg)", color: "var(--admin-accent)" },
    green: { bg: "var(--admin-success-bg)", color: "var(--admin-success)" },
    amber: { bg: "var(--admin-warning-bg)", color: "var(--admin-warning)" },
    red:   { bg: "var(--admin-danger-bg)", color: "var(--admin-danger)" },
  }

  const colors = iconColorMap[iconColor]

  return (
    <div className="admin-stat-card">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        {/* Text */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-xs sm:text-[13px] font-medium" style={{ color: "var(--admin-text-muted)" }}>{label}</p>
          <p className="mt-1 sm:mt-1.5 text-lg sm:text-2xl md:text-[28px] font-bold tracking-tight truncate" style={{ color: "var(--admin-text-primary)" }}>
            {value}
          </p>

          {delta && (
            <span
              style={{
                marginTop: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px",
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 500,
                background: deltaPositive ? "var(--admin-success-bg)" : "var(--admin-danger-bg)",
                color: deltaPositive ? "var(--admin-success)" : "var(--admin-danger)",
              }}
            >
              {deltaPositive ? (
                <TrendingUp style={{ width: 12, height: 12 }} />
              ) : (
                <TrendingDown style={{ width: 12, height: 12 }} />
              )}
              {delta}
            </span>
          )}

          {deltaVariant === "warning" && (
            <span
              style={{
                marginTop: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "3px 8px",
                borderRadius: 9999,
                fontSize: 12,
                fontWeight: 500,
                background: "var(--admin-warning-bg)",
                color: "var(--admin-warning)",
              }}
            >
              Needs attention
            </span>
          )}
        </div>

        {/* Icon bubble */}
        {icon && (
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 shrink-0 flex items-center justify-center rounded-xl"
            style={{
              background: colors.bg,
              color: colors.color,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
