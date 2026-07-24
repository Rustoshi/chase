"use client"

import { ReactNode } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

type IconColor = "blue" | "green" | "amber" | "red"

interface AdminStatCardProps {
  label: string
  value: string | number
  icon: ReactNode
  iconColor?: IconColor
  trend?: {
    value: number
    label?: string
  }
  className?: string
}

export function AdminStatCard({
  label,
  value,
  icon,
  iconColor = "blue",
  trend,
  className = "",
}: AdminStatCardProps) {
  const trendDirection = trend && trend.value >= 0 ? "up" : "down"

  return (
    <div className={`admin-stat-card ${className}`}>
      <div className="admin-stat-header">
        <div className={`admin-stat-icon ${iconColor}`}>{icon}</div>
        {trend && (
          <div className={`admin-stat-trend ${trendDirection}`}>
            {trendDirection === "up" ? (
              <TrendingUp size={14} />
            ) : (
              <TrendingDown size={14} />
            )}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <p className="admin-stat-value">{value}</p>
      <p className="admin-stat-label">{label}</p>
    </div>
  )
}
