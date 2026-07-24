"use client"

import { ReactNode } from "react"
import { Inbox } from "lucide-react"

interface AdminEmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function AdminEmptyState({
  icon,
  title,
  description,
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="admin-empty">
      <div className="admin-empty-icon">
        {icon || <Inbox />}
      </div>
      <h3 className="admin-empty-title">{title}</h3>
      {description && <p className="admin-empty-description">{description}</p>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  )
}
