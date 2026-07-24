"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LogOut, ShieldCheck, X } from "lucide-react"
import type { Session } from "next-auth"
import { BANK_NAME } from "@/lib/brand"
import { NAV_GROUPS, type NavItem } from "./nav-config"

interface SidebarProps {
  session: Session
  isOpen:  boolean
  onClose: () => void
}

function isActive(item: NavItem, pathname: string): boolean {
  return pathname === item.href || pathname.startsWith(item.href + "/")
}

export function Sidebar({ session, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user }  = session
  const initials  = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()

  return (
    <aside
      className={`admin-sidebar admin-scrollbar ${isOpen ? "open" : ""}`}
      aria-label="Admin navigation"
    >
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-logo">
          <ShieldCheck strokeWidth={2.5} />
        </div>
        <div className="admin-sidebar-brand">
          <span className="admin-sidebar-brand-name">
            {BANK_NAME}
            <span className="admin-sidebar-brand-badge">Admin</span>
          </span>
        </div>
        {/* Close button - mobile only */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden admin-header-icon-btn"
          aria-label="Close navigation"
        >
          <X />
        </button>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────────── */}
      <nav className="admin-sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div key={group.section} className="admin-sidebar-section">
            <p className="admin-sidebar-section-label">{group.section}</p>
            <ul>
              {group.items.map((item) => {
                const active = isActive(item, pathname)
                return (
                  <li key={item.href} style={{ position: "relative" }}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`admin-sidebar-item ${active ? "active" : ""}`}
                      aria-current={active ? "page" : undefined}
                    >
                      <item.icon strokeWidth={active ? 2 : 1.5} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User panel ────────────────────────────────────────────────────────── */}
      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-user">
          <div className="admin-sidebar-avatar">{initials}</div>
          <div className="admin-sidebar-user-info">
            <p className="admin-sidebar-user-name">
              {user.firstName} {user.lastName}
            </p>
            <p className="admin-sidebar-user-email">{user.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="admin-sidebar-signout"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
