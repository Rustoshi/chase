"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, ArrowLeftRight, Settings, MoreHorizontal } from "lucide-react"

const MOBILE_NAV_ITEMS = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="admin-mobile-nav">
      {MOBILE_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-mobile-nav-item ${isActive ? "active" : ""}`}
          >
            <item.icon />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
