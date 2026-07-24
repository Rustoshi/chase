"use client"

import { ReactNode } from "react"

interface AdminCardProps {
  children: ReactNode
  className?: string
  noPadding?: boolean
}

interface AdminCardHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

interface AdminCardBodyProps {
  children: ReactNode
  className?: string
}

interface AdminCardFooterProps {
  children: ReactNode
  className?: string
}

export function AdminCard({ children, className = "", noPadding }: AdminCardProps) {
  return (
    <div className={`admin-card ${className}`}>
      {noPadding ? children : <div className="admin-card-body">{children}</div>}
    </div>
  )
}

export function AdminCardHeader({ title, description, action }: AdminCardHeaderProps) {
  return (
    <div className="admin-card-header">
      <div>
        <h3 className="admin-card-title">{title}</h3>
        {description && (
          <p style={{ fontSize: 13, color: "var(--admin-text-muted)", marginTop: 2 }}>
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function AdminCardBody({ children, className = "" }: AdminCardBodyProps) {
  return <div className={`admin-card-body ${className}`}>{children}</div>
}

export function AdminCardFooter({ children, className = "" }: AdminCardFooterProps) {
  return <div className={`admin-card-footer ${className}`}>{children}</div>
}
