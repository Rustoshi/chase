"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import { ArrowRight } from "lucide-react"

/* ══════════════════════════════════════════════════════════════════════════
   Safe Haven Private — auth shell (split screen)
   Left: brand panel (image + flat ink scrim, logo, Newsreader line, quote).
   Right: linen form area. Styling strictly per design.md.
   ══════════════════════════════════════════════════════════════════════════ */

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI = "var(--sh-font-ui)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

const QUOTES = [
  { quote: "A calmer way to hold money. Considered, discreet, and quietly capable.", author: "Michael Thompson", role: "Business Owner" },
  { quote: "The clearest statements I've ever had, and security that lets me stop worrying.", author: "Sarah Kim", role: "Software Engineer" },
  { quote: "I moved from a traditional bank and never looked back. Everything is deliberate.", author: "James Oliver", role: "Designer" },
]

function BrandPanel() {
  const [idx, setIdx] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const t = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setIdx((i) => (i + 1) % QUOTES.length)
        setFading(false)
      }, 300)
    }, 6000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="relative hidden lg:flex lg:w-[48%] flex-col overflow-hidden" style={{ fontFamily: UI }}>
      <Image src="/images/stock/auth-brand.jpg" alt="" aria-hidden fill priority sizes="48vw" className="object-cover" />
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(23,20,15,0.62)" }} />

      <div className="relative z-10 flex flex-col h-full p-12 xl:p-16">
        {/* Logo */}
        <Link href="/" aria-label={BANK_NAME} className="inline-flex w-fit">
          <Image src="/images/logo.png" alt={BANK_NAME} width={256} height={128} className="h-7 w-auto" priority />
        </Link>

        {/* Headline */}
        <div className="flex-1 flex flex-col justify-center max-w-md">
          <h1 className="text-[2.5rem] xl:text-[3rem] leading-[1.1]" style={{ fontFamily: DISPLAY, fontWeight: 300, color: "var(--sh-linen)" }}>
            Private banking,
            <br />
            quietly done
          </h1>
          <p className="mt-6 text-[16px] leading-relaxed" style={{ color: "var(--sh-linen-70)" }}>
            Open accounts, move funds, and review every statement in one considered place, with verification, real-time alerts, and full control.
          </p>
        </div>

        {/* Rotating quote */}
        <div className="mt-auto max-w-md">
          <span aria-hidden className="block mb-5" style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
          <div className="transition-all duration-300" style={{ opacity: fading ? 0 : 1, transform: fading ? "translateY(6px)" : "translateY(0)" }}>
            <p className="text-[18px] leading-[1.5]" style={{ fontFamily: DISPLAY, fontWeight: 400, color: "var(--sh-linen)" }}>
              &ldquo;{QUOTES[idx].quote}&rdquo;
            </p>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-[14px]" style={{ fontWeight: 500, color: "var(--sh-linen)" }}>{QUOTES[idx].author}</p>
                <p className="text-[12px]" style={{ color: "var(--sh-linen-50)" }}>{QUOTES[idx].role}</p>
              </div>
              <div className="flex gap-2">
                {QUOTES.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Quote ${i + 1}`}
                    onClick={() => setIdx(i)}
                    style={{
                      width: i === idx ? 20 : 6,
                      height: 2,
                      backgroundColor: i === idx ? BRONZE : "var(--sh-linen-50)",
                      transition: "all 300ms",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Safe Haven Private type system */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://api.fontshare.com" />
      <link href="https://api.fontshare.com/v2/css?f[]=general-sans@300,400,500&display=swap" rel="stylesheet" />
      <link
        href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500&family=Spline+Sans+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <div className="flex min-h-screen overflow-x-hidden" style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI, color: INK }}>
        <BrandPanel />

        {/* Right — form area */}
        <div className="flex flex-1 min-w-0 flex-col min-h-screen">
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between px-6 h-16" style={{ borderBottom: "0.5px solid var(--sh-ink-10)" }}>
            <Link href="/" aria-label={BANK_NAME} className="inline-flex">
              <Image src="/images/logo.png" alt={BANK_NAME} width={256} height={128} className="h-6 w-auto" />
            </Link>
            <Link href="/" className="flex items-center gap-1.5 text-[13px]" style={{ color: "var(--sh-ink-50)" }}>
              Back to home
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Link>
          </div>

          {/* Form container */}
          <div className="flex-1 flex items-center justify-center px-6 py-12 lg:py-16">
            <div className="w-full max-w-[430px]">{children}</div>
          </div>

          {/* Footer */}
          <div className="px-6 py-6 text-center" style={{ borderTop: "0.5px solid var(--sh-ink-10)" }}>
            <p className="text-[12px]" style={{ color: "var(--sh-ink-50)" }}>
              © {new Date().getFullYear()} {BANK_NAME}. All rights reserved.
              <span className="mx-2">·</span>
              <Link href="/privacy" className="sh-foot-link" style={{ color: "var(--sh-ink-50)" }}>Privacy</Link>
              <span className="mx-2">·</span>
              <Link href="/terms" className="sh-foot-link" style={{ color: "var(--sh-ink-50)" }}>Terms</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
