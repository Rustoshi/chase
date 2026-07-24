"use client"

import { ReactNode } from "react"

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral"

interface AdminBadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

export function AdminBadge({
  children,
  variant = "neutral",
  className = "",
}: AdminBadgeProps) {
  return (
    <span className={`admin-badge admin-badge-${variant} ${className}`}>
      {children}
    </span>
  )
}

// Preset status badges
export function StatusBadge({ status }: { status: string }) {
  const statusMap: Record<string, { variant: BadgeVariant; label: string }> = {
    active: { variant: "success", label: "Active" },
    completed: { variant: "success", label: "Completed" },
    approved: { variant: "success", label: "Approved" },
    verified: { variant: "success", label: "Verified" },
    pending: { variant: "warning", label: "Pending" },
    processing: { variant: "info", label: "Processing" },
    unverified: { variant: "neutral", label: "Unverified" },
    inactive: { variant: "neutral", label: "Inactive" },
    suspended: { variant: "danger", label: "Suspended" },
    rejected: { variant: "danger", label: "Rejected" },
    failed: { variant: "danger", label: "Failed" },
    cancelled: { variant: "danger", label: "Cancelled" },
  }

  const config = statusMap[status.toLowerCase()] || { variant: "neutral", label: status }

  return <AdminBadge variant={config.variant}>{config.label}</AdminBadge>
}
