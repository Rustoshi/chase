"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import type { Session } from "next-auth"
import { Sidebar } from "./Sidebar"
import { Header }  from "./Header"
import { MobileNav } from "./MobileNav"
import { getPageTitle } from "./nav-config"
import "@/styles/admin-theme.css"

interface AdminShellProps {
  children: React.ReactNode
  session:  Session
}

export function AdminShell({ children, session }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname  = usePathname()
  const pageTitle = getPageTitle(pathname)

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [sidebarOpen])

  return (
    <div className="admin-shell" data-theme="light">
      {/* Inter — the dashboard-design.md app font */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <Sidebar
        session={session}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Mobile overlay — tap to close sidebar */}
      <div
        className={`admin-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden
      />

      {/* ── Main content column ─────────────────────────────────────────────── */}
      <div className="admin-main">
        <Header
          session={session}
          pageTitle={pageTitle}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Scrollable main area */}
        <main className="admin-content admin-scrollbar">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom navigation ────────────────────────────────────────── */}
      <MobileNav />
    </div>
  )
}
