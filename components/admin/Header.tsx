"use client"

import { signOut } from "next-auth/react"
import { Menu, Bell, Search, LogOut, UserCircle, KeyRound } from "lucide-react"
import Link from "next/link"
import type { Session } from "next-auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  session:     Session
  pageTitle:   string
  onMenuClick: () => void
}

export function Header({ session, pageTitle, onMenuClick }: HeaderProps) {
  const { user }   = session
  const initials   = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
  const fullName   = `${user.firstName} ${user.lastName}`

  return (
    <header className="admin-header">
      {/* ── Left: hamburger (mobile) + page title ── */}
      <button
        type="button"
        onClick={onMenuClick}
        className="admin-header-menu-btn"
        aria-label="Open navigation"
      >
        <Menu />
      </button>

      <h1 className="admin-header-title">{pageTitle}</h1>

      {/* ── Center: search ── */}
      <div className="admin-header-search">
        <div style={{ position: "relative" }}>
          <Search className="admin-header-search-icon" />
          <input
            type="search"
            placeholder="Search users, transactions…"
            className="admin-header-search-input"
          />
        </div>
      </div>

      {/* Spacer */}
      <div className="admin-header-spacer" />

      {/* ── Right: bell + avatar ── */}
      <div className="admin-header-actions">
        {/* Notification bell */}
        <button
          type="button"
          className="admin-header-icon-btn"
          aria-label="Notifications"
        >
          <Bell />
        </button>

        {/* Avatar + dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="admin-header-avatar"
              aria-label="Account menu"
            >
              {initials}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent 
            align="end" 
            className="w-52"
            style={{
              background: "var(--admin-bg-card)",
              border: "1px solid var(--admin-border)",
              boxShadow: "var(--admin-shadow-lg)",
            }}
          >
            <DropdownMenuLabel className="pb-2">
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--admin-text-primary)" }}>{fullName}</p>
              <p style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>{user.email}</p>
            </DropdownMenuLabel>

            <DropdownMenuSeparator style={{ background: "var(--admin-border)" }} />

            <DropdownMenuItem asChild>
              <Link 
                href="/admin/profile" 
                className="cursor-pointer"
                style={{ color: "var(--admin-text-secondary)" }}
              >
                <UserCircle style={{ width: 16, height: 16, color: "var(--admin-text-muted)" }} />
                My profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link 
                href="/admin/change-password" 
                className="cursor-pointer"
                style={{ color: "var(--admin-text-secondary)" }}
              >
                <KeyRound style={{ width: 16, height: 16, color: "var(--admin-text-muted)" }} />
                Change password
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator style={{ background: "var(--admin-border)" }} />

            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              style={{ color: "var(--admin-danger)" }}
            >
              <LogOut style={{ width: 16, height: 16 }} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
