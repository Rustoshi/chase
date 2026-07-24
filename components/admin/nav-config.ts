import {
  LayoutDashboard,
  Users,
  ArrowDownCircle,
  ArrowLeftRight,
  Landmark,
  CreditCard,
  ShieldCheck,
  Wallet,
  Sparkles,
  Settings,
  ScrollText,
  Gift,
  Receipt,
  UserCircle,
  KeyRound,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface NavItem {
  label: string
  href:  string
  icon:  LucideIcon
}

export interface NavGroup {
  section: string
  items:   NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    section: "Operations",
    items: [
      { label: "Dashboard",        href: "/admin/dashboard",        icon: LayoutDashboard },
      { label: "Users",            href: "/admin/users",            icon: Users           },
      { label: "Deposit Requests", href: "/admin/deposit-requests", icon: ArrowDownCircle },
      { label: "Transactions",     href: "/admin/transactions",     icon: ArrowLeftRight  },
    ],
  },
  {
    section: "Products",
    items: [
      { label: "Loans",       href: "/admin/loans",       icon: Landmark   },
      { label: "Grants",      href: "/admin/grants",      icon: Gift       },
      { label: "Tax Refunds", href: "/admin/tax-refunds", icon: Receipt    },
      { label: "Cards",       href: "/admin/cards",       icon: CreditCard },
      { label: "KYC Review",  href: "/admin/kyc",         icon: ShieldCheck },
    ],
  },
  {
    section: "Configuration",
    items: [
      { label: "Payment Methods",   href: "/admin/payment-methods", icon: Wallet     },
      { label: "History Generator", href: "/admin/generate",        icon: Sparkles   },
      { label: "App Settings",      href: "/admin/settings",        icon: Settings   },
      { label: "Audit Log",         href: "/admin/audit-log",       icon: ScrollText },
    ],
  },
  {
    section: "Account",
    items: [
      { label: "My Profile",       href: "/admin/profile",         icon: UserCircle },
      { label: "Change Password",  href: "/admin/change-password", icon: KeyRound   },
    ],
  },
]

const ALL_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)

/** Returns the nav label for the current pathname, used by the Header. */
export function getPageTitle(pathname: string): string {
  const match = ALL_ITEMS.find(
    (item) =>
      pathname === item.href ||
      pathname.startsWith(item.href + "/")
  )
  return match?.label ?? "Admin Portal"
}
