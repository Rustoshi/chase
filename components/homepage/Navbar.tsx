"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, ChevronDown, Plus, Minus } from "lucide-react"
import { BANK_NAME } from "@/lib/brand"

/* ══════════════════════════════════════════════════════════════════════════
   Safe Haven Private — public navbar
   Structure borrowed from a classic two-tier bank header (utility row on top,
   product categories below; mobile = hamburger · centered logo · Log In).
   Styling is strictly per design.md: ink background, linen text, a single
   bronze accent, sharp 2px controls, hairline dividers, no shadows/gradients.
   ══════════════════════════════════════════════════════════════════════════ */

// Top utility row (right-aligned)
const UTILITY_LINKS = [
  { label: "About",   href: "/about" },
  { label: "Contact", href: "/contact" },
] as const

// Primary category row — the product tier with dropdowns
const PRIMARY_LINKS = [
  {
    label: "Personal",
    href: "/personal",
    submenu: [
      { label: "Checking Account", href: "/personal/checking", desc: "Everyday banking, quietly done" },
      { label: "Savings Account",  href: "/personal/savings",  desc: "Preserve and grow capital" },
      { label: "Credit Cards",     href: "/personal/cards",    desc: "Considered rewards" },
    ],
  },
  {
    label: "Business",
    href: "/business",
    submenu: [
      { label: "Business Checking", href: "/business/checking", desc: "Built for principals" },
      { label: "Business Credit",   href: "/business/credit",   desc: "Flexible financing" },
      { label: "Payroll Services",  href: "/business/payroll",  desc: "Pay your team with ease" },
    ],
  },
  {
    label: "Security",
    href: "/security",
    submenu: [
      { label: "How We Protect You", href: "/security/protection", desc: "Institution-grade safeguards" },
      { label: "Fraud Prevention",   href: "/security/fraud",      desc: "Continuous monitoring" },
    ],
  },
] as const

// ── Shared token shorthands (design.md) ──────────────────────────────────────
const INK       = "#17140F"
const LINEN     = "#F2EEE4"
const BRONZE    = "#A67C3D"
const UI_FONT   = "var(--sh-font-ui)"
const LABEL     = "text-[11px] uppercase tracking-[0.09em] font-medium"

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen]       = useState(false)
  const [openDesktop, setOpenDesktop]     = useState<string | null>(null)
  const [openMobile, setOpenMobile]       = useState<string | null>(null)

  // Lock body scroll while the mobile sheet is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")

  const Logo = ({ className = "" }: { className?: string }) => (
    <Link href="/" aria-label={BANK_NAME} className={`inline-flex items-center ${className}`}>
      <Image
        src="/images/logo.png"
        alt={BANK_NAME}
        width={256}
        height={128}
        priority
        className="h-6 w-auto lg:h-[26px]"
      />
    </Link>
  )

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        backgroundColor: INK,
        fontFamily: UI_FONT,
        borderBottom: "0.5px solid var(--sh-linen-12)",
      }}
    >
      {/* ══ DESKTOP ══════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block">
        {/* Tier 1 — logo + utility links + Log In */}
        <div className="max-w-7xl mx-auto px-8 lg:px-12">
          <div
            className="flex items-center justify-between h-[60px]"
            style={{ borderBottom: "0.5px solid var(--sh-linen-08)" }}
          >
            <Logo />

            <div className="flex items-center gap-8">
              <nav className="flex items-center gap-7">
                {UTILITY_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-[13px] transition-colors duration-200"
                    style={{ color: isActive(l.href) ? BRONZE : "var(--sh-linen-70)" }}
                    onMouseEnter={(e) => { if (!isActive(l.href)) e.currentTarget.style.color = LINEN }}
                    onMouseLeave={(e) => { if (!isActive(l.href)) e.currentTarget.style.color = "var(--sh-linen-70)" }}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>

              {/* one bronze accent per screen: the Log In control */}
              <Link
                href="/login"
                className={`${LABEL} px-5 py-2 transition-colors duration-200`}
                style={{
                  color: BRONZE,
                  border: `0.5px solid ${BRONZE}`,
                  borderRadius: "2px",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--sh-bronze-10)" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
              >
                Log In
              </Link>
            </div>
          </div>
        </div>

        {/* Tier 2 — primary category nav + Open account */}
        <div className="max-w-7xl mx-auto px-8 lg:px-12">
          <div className="flex items-center justify-between h-[48px]">
            <nav className="flex items-stretch gap-9 h-full">
              {PRIMARY_LINKS.map((link) => {
                const active = isActive(link.href)
                return (
                  <div
                    key={link.label}
                    className="relative flex items-center h-full"
                    onMouseEnter={() => link.submenu && setOpenDesktop(link.label)}
                    onMouseLeave={() => setOpenDesktop(null)}
                  >
                    <Link
                      href={link.href}
                      className="flex items-center gap-1.5 text-[14px] h-full transition-colors duration-200"
                      style={{
                        color: active ? BRONZE : "var(--sh-linen-70)",
                        boxShadow: active ? `inset 0 -1.5px 0 ${BRONZE}` : "none",
                      }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = LINEN }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "var(--sh-linen-70)" }}
                    >
                      {link.label}
                      {link.submenu && (
                        <ChevronDown
                          className="h-3.5 w-3.5 transition-transform duration-200"
                          strokeWidth={1.5}
                          style={{ transform: openDesktop === link.label ? "rotate(180deg)" : "none" }}
                        />
                      )}
                    </Link>

                    {/* Dropdown — a print-style surface card, hairline border, no shadow */}
                    {link.submenu && (
                      <div
                        className="absolute top-full left-0 pt-3 w-[300px] transition-all duration-200"
                        style={{
                          opacity: openDesktop === link.label ? 1 : 0,
                          transform: openDesktop === link.label ? "translateY(0)" : "translateY(4px)",
                          pointerEvents: openDesktop === link.label ? "auto" : "none",
                        }}
                      >
                        <div
                          style={{
                            backgroundColor: "var(--sh-surface)",
                            border: "0.5px solid var(--sh-ink-10)",
                            borderRadius: "8px",
                          }}
                        >
                          {link.submenu.map((item, i) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="block px-5 py-3.5 transition-colors duration-150"
                              style={{ borderTop: i === 0 ? "none" : "0.5px solid var(--sh-ink-10)" }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--sh-bronze-10)" }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
                            >
                              <div className="text-[14px] font-medium" style={{ color: INK }}>
                                {item.label}
                              </div>
                              <div className="text-[12px] mt-0.5" style={{ color: "var(--sh-ink-50)" }}>
                                {item.desc}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>

            <Link
              href="/register"
              className="text-[13px] transition-colors duration-200"
              style={{ color: "var(--sh-linen-70)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = LINEN }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--sh-linen-70)" }}
            >
              Open an account
            </Link>
          </div>
        </div>
      </div>

      {/* ══ MOBILE ═══════════════════════════════════════════════════════════ */}
      <div className="lg:hidden">
        <div className="relative flex items-center justify-between h-14 px-5">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex items-center justify-center -ml-1 p-1"
            style={{ color: LINEN }}
          >
            <Menu className="h-6 w-6" strokeWidth={1.5} />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2">
            <Logo />
          </div>

          <Link
            href="/login"
            className={`${LABEL} px-4 py-1.5`}
            style={{ color: BRONZE, border: `0.5px solid ${BRONZE}`, borderRadius: "2px" }}
          >
            Log In
          </Link>
        </div>
      </div>

      {/* ══ MOBILE SHEET ═════════════════════════════════════════════════════ */}
      <div
        className="fixed inset-0 z-[60] lg:hidden transition-opacity duration-300"
        style={{
          opacity: mobileOpen ? 1 : 0,
          pointerEvents: mobileOpen ? "auto" : "none",
        }}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(23,20,15,0.5)" }}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className="absolute inset-y-0 left-0 w-full max-w-sm flex flex-col transition-transform duration-300 ease-out"
          style={{
            backgroundColor: "var(--sh-linen)",
            transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          }}
        >
          {/* Sheet header — sits on ink to echo the bar */}
          <div
            className="flex items-center justify-between h-14 px-5 flex-shrink-0"
            style={{ backgroundColor: INK }}
          >
            <Logo />
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="p-1"
              style={{ color: LINEN }}
            >
              <X className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6">
            <div className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Products</div>
            <div className="mt-3">
              {PRIMARY_LINKS.map((link) => (
                <div key={link.label} style={{ borderBottom: "0.5px solid var(--sh-ink-10)" }}>
                  {link.submenu ? (
                    <>
                      <button
                        onClick={() => setOpenMobile(openMobile === link.label ? null : link.label)}
                        className="flex items-center justify-between w-full py-3.5 text-[16px]"
                        style={{ color: INK }}
                      >
                        {link.label}
                        {openMobile === link.label
                          ? <Minus className="h-4 w-4" strokeWidth={1.5} style={{ color: BRONZE }} />
                          : <Plus  className="h-4 w-4" strokeWidth={1.5} style={{ color: "var(--sh-ink-50)" }} />}
                      </button>
                      <div
                        className="overflow-hidden transition-all duration-200"
                        style={{ maxHeight: openMobile === link.label ? "320px" : "0px" }}
                      >
                        <div className="pb-3">
                          {link.submenu.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileOpen(false)}
                              className="block py-2.5 pl-4 text-[14px]"
                              style={{ color: "var(--sh-ink-80, #17140FCC)" }}
                            >
                              {item.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-3.5 text-[16px]"
                      style={{ color: INK }}
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            <div className={`${LABEL} mt-8`} style={{ color: "var(--sh-ink-50)" }}>More</div>
            <div className="mt-3">
              {UTILITY_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-3 text-[15px]"
                  style={{ color: "var(--sh-ink-80, #17140FCC)", borderBottom: "0.5px solid var(--sh-ink-10)" }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Sheet footer — one primary (Log In), one secondary (Open account) */}
          <div
            className="flex-shrink-0 px-5 py-5 space-y-3"
            style={{ borderTop: "0.5px solid var(--sh-ink-10)" }}
          >
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className={`${LABEL} flex items-center justify-center w-full py-3`}
              style={{ color: "var(--sh-bronze-dark)", border: `0.5px solid ${BRONZE}`, borderRadius: "2px" }}
            >
              Log In
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center w-full py-3 text-[14px]"
              style={{ color: INK, border: "0.5px solid var(--sh-ink-20)", borderRadius: "2px" }}
            >
              Open an account
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
