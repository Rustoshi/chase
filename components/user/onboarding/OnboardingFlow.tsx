"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Session } from "next-auth"
import { BANK_NAME } from "@/lib/brand"
import {
  Wallet, ArrowLeftRight, CreditCard, Shield, TrendingUp,
  ChevronRight, Globe, Zap, Lock,
} from "lucide-react"

/* Onboarding — per dashboard-design.md (Grey style). White modal card on a
   dimmed canvas, Inter, indigo primary, soft shadows, premium card mockups. */

const FONT = "var(--dash-font)"

interface OnboardingFlowProps {
  session:       Session
  fiatAccount?:  { accountNumber: string }
  btcAccount?:   { btcAddress: string }
}

// ── Feature row ─────────────────────────────────────────────────────────────
function FeatureItem({ icon: Icon, title, description, color, bg }: {
  icon: React.ElementType; title: string; description: string; color: string; bg: string
}) {
  return (
    <div className="flex items-start gap-3.5 text-left">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center" style={{ backgroundColor: bg, borderRadius: 10 }}>
        <Icon className="h-5 w-5" strokeWidth={2} style={{ color }} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[14px]" style={{ fontWeight: 600, color: "var(--dash-text)" }}>{title}</p>
        <p className="text-[12.5px] mt-0.5 leading-relaxed" style={{ color: "var(--dash-text-2)" }}>{description}</p>
      </div>
    </div>
  )
}

// ── Card mockup pieces ──────────────────────────────────────────────────────
function Chip() {
  return (
    <svg width="38" height="28" viewBox="0 0 38 28" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="37" height="27" rx="5" fill="url(#chipG)" stroke="rgba(255,255,255,0.35)" />
      <path d="M13 0.5V27.5M25 0.5V27.5M0.5 10H13M25 10H37.5M0.5 18H13M25 18H37.5" stroke="rgba(120,90,20,0.45)" strokeWidth="0.9" />
      <rect x="13" y="8" width="12" height="12" rx="2" fill="rgba(255,255,255,0.15)" stroke="rgba(120,90,20,0.4)" strokeWidth="0.9" />
      <defs>
        <linearGradient id="chipG" x1="0" y1="0" x2="38" y2="28">
          <stop stopColor="#F6E27A" /><stop offset="0.5" stopColor="#E4C24D" /><stop offset="1" stopColor="#C99B2E" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function Contactless() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden style={{ opacity: 0.85 }}>
      <path d="M8.5 8.5a5 5 0 0 1 0 7M11.5 6a8.5 8.5 0 0 1 0 12M14.5 3.5a12 12 0 0 1 0 17" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function WalletCardPreview({ session, fiatAccount, btcAccount }: {
  session: Session
  fiatAccount?: { accountNumber: string }
  btcAccount?:  { btcAddress: string }
}) {
  const fiatLast4 = fiatAccount?.accountNumber?.slice(-4) || "0000"
  const btcAddr = btcAccount?.btcAddress || ""
  const btcShort = btcAddr ? `${btcAddr.slice(0, 5)}…${btcAddr.slice(-4)}` : "•••••…••••"
  const holder = `${session.user.firstName} ${session.user.lastName}`.toUpperCase().slice(0, 22)

  return (
    <div className="relative mx-auto w-full max-w-[300px]" style={{ height: 210 }}>
      {/* Bitcoin card (behind) */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: 0, left: 22, right: 22, height: 168, borderRadius: 16, padding: "16px 18px", color: "#fff",
          background: "linear-gradient(135deg, #F7931A 0%, #E2761B 100%)",
          transform: "rotate(-7deg)",
          boxShadow: "0 12px 28px rgba(226,118,27,0.30)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center" style={{ borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.22)", fontSize: 11, fontWeight: 700 }}>₿</span>
          <span className="text-[10px] uppercase" style={{ letterSpacing: "0.12em", opacity: 0.9, fontWeight: 600 }}>Bitcoin Wallet</span>
        </div>
        <p className="mt-9 text-[12px]" style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.05em", opacity: 0.92 }}>{btcShort}</p>
      </div>

      {/* Fiat card (front) */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: 26, left: 6, right: 6, height: 184, borderRadius: 16, padding: 20, color: "#fff",
          background: "linear-gradient(135deg, #2A3BD4 0%, #1A2CCE 45%, #101828 100%)",
          transform: "rotate(2deg)",
          boxShadow: "0 20px 44px rgba(16,24,40,0.30)",
        }}
      >
        {/* sheen */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 55% at 82% 8%, rgba(255,255,255,0.18) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div className="relative flex items-center justify-between">
          <span className="text-[12px] uppercase" style={{ letterSpacing: "0.14em", fontWeight: 600 }}>{BANK_NAME}</span>
          <Contactless />
        </div>
        <div className="relative mt-3.5"><Chip /></div>
        <p className="relative mt-3.5 text-[17px]" style={{ fontFamily: "ui-monospace, monospace", letterSpacing: "0.14em", fontVariantNumeric: "tabular-nums" }}>
          ••••&nbsp;&nbsp;••••&nbsp;&nbsp;••••&nbsp;&nbsp;{fiatLast4}
        </p>
        <div className="relative mt-3 flex items-end justify-between">
          <div>
            <p className="text-[8px] uppercase" style={{ letterSpacing: "0.1em", opacity: 0.55 }}>Card Holder</p>
            <p className="text-[12px] mt-0.5" style={{ fontWeight: 600, letterSpacing: "0.02em" }}>{holder}</p>
          </div>
          <span className="text-[16px]" style={{ fontStyle: "italic", fontWeight: 700, letterSpacing: "-0.02em" }}>VISA</span>
        </div>
      </div>
    </div>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────
export function OnboardingFlow({ session, fiatAccount, btcAccount }: OnboardingFlowProps) {
  const router = useRouter()
  const [slide, setSlide] = useState(0)
  const touchStartX = useRef(0)
  const totalSlides = 3

  const dismiss = useCallback(() => { localStorage.setItem("onboardingShown", "true") }, [])
  const goToSlide = (index: number) => { if (index >= 0 && index < totalSlides) setSlide(index) }
  const next = () => goToSlide(slide + 1)
  const prev = () => goToSlide(slide - 1)

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) { if (diff > 0) next(); else prev() }
  }

  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("onboardingShown")) setVisible(true)
  }, [])

  const finishOnboarding = useCallback(() => { dismiss(); setVisible(false) }, [dismiss])
  const goToDashboard = useCallback(() => { dismiss(); setVisible(false); router.push("/app/dashboard") }, [dismiss, router])

  if (!visible) return null

  const primaryBtn = "group h-[50px] w-full text-[15px] flex items-center justify-center gap-2 transition-colors active:scale-[0.99]"
  const primaryStyle: React.CSSProperties = { backgroundColor: "var(--dash-primary)", color: "#fff", borderRadius: 10, fontWeight: 600 }
  const onHover = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = "var(--dash-primary-2)" }
  const offHover = (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = "var(--dash-primary)" }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(16,24,40,0.5)", fontFamily: FONT }}>
      <div
        className="relative w-full max-w-md flex flex-col items-center px-6 py-8 sm:px-8"
        style={{ backgroundColor: "var(--dash-surface)", borderRadius: 20, boxShadow: "0 24px 60px rgba(16,24,40,0.25)", maxHeight: "calc(100dvh - 32px)", overflowY: "auto" }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Skip */}
        <button onClick={finishOnboarding} className="absolute top-4 right-4 px-3 py-1.5 text-[13px] transition-colors" style={{ color: "var(--dash-text-2)", borderRadius: 8, fontWeight: 500 }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--dash-surface-2)" }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}>
          Skip
        </button>

        {/* ── Slide 1: Welcome (no icon) ── */}
        {slide === 0 && (
          <div className="w-full text-center animate-[obFade_0.4s_ease-out] pt-4">
            <h1 className="mb-2 text-[26px] tracking-tight" style={{ fontWeight: 700, color: "var(--dash-text)" }}>
              Welcome, {session.user.firstName} <span aria-hidden>👋</span>
            </h1>
            <p className="mb-8 text-[15px] leading-relaxed" style={{ color: "var(--dash-text-2)" }}>
              Your {BANK_NAME} account is ready. Let&apos;s get you started.
            </p>

            <div className="mb-8 grid grid-cols-3 gap-3">
              {[
                { icon: Wallet, label: "2 Wallets",     color: "#2775CA", bg: "#EFF8FF" },
                { icon: Globe,  label: "Global Access",  color: "#12B76A", bg: "#ECFDF3" },
                { icon: Lock,   label: "Secure",         color: "#1A2CCE", bg: "#EEF0FE" },
              ].map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="flex flex-col items-center gap-2 py-4" style={{ backgroundColor: "var(--dash-surface-2)", borderRadius: 12 }}>
                    <span className="flex h-11 w-11 items-center justify-center" style={{ backgroundColor: s.bg, borderRadius: 12 }}>
                      <Icon className="h-5 w-5" strokeWidth={2} style={{ color: s.color }} />
                    </span>
                    <p className="text-[11px]" style={{ color: "var(--dash-text-2)", fontWeight: 500 }}>{s.label}</p>
                  </div>
                )
              })}
            </div>

            <button onClick={next} className={primaryBtn} style={primaryStyle} onMouseEnter={onHover} onMouseLeave={offHover}>
              Get started <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}

        {/* ── Slide 2: Wallets ── */}
        {slide === 1 && (
          <div className="w-full text-center animate-[obFade_0.4s_ease-out] pt-6">
            <WalletCardPreview session={session} fiatAccount={fiatAccount} btcAccount={btcAccount} />

            <h2 className="mt-7 mb-2 text-[22px] tracking-tight" style={{ fontWeight: 700, color: "var(--dash-text)" }}>Your wallets are ready</h2>
            <p className="mb-7 text-[14px] leading-relaxed" style={{ color: "var(--dash-text-2)" }}>
              Manage cash and Bitcoin in one place, and swap between them instantly.
            </p>

            <div className="mb-8 space-y-4">
              <FeatureItem icon={ArrowLeftRight} title="Instant swaps" description="Convert between cash and BTC at competitive rates" color="#1A2CCE" bg="#EEF0FE" />
              <FeatureItem icon={TrendingUp}     title="Real-time tracking" description="Monitor your portfolio value around the clock" color="#12B76A" bg="#ECFDF3" />
            </div>

            <button onClick={next} className={primaryBtn} style={primaryStyle} onMouseEnter={onHover} onMouseLeave={offHover}>
              Continue <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}

        {/* ── Slide 3: Features ── */}
        {slide === 2 && (
          <div className="w-full text-center animate-[obFade_0.4s_ease-out] pt-4">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center" style={{ backgroundColor: "var(--dash-primary-bg)", borderRadius: 18 }}>
              <Zap className="h-8 w-8" strokeWidth={2} style={{ color: "var(--dash-primary)" }} />
            </div>

            <h2 className="mb-2 text-[22px] tracking-tight" style={{ fontWeight: 700, color: "var(--dash-text)" }}>Everything you need</h2>
            <p className="mb-8 text-[14px] leading-relaxed" style={{ color: "var(--dash-text-2)" }}>Powerful tools to manage your finances</p>

            <div className="mb-8 space-y-4">
              <FeatureItem icon={CreditCard} title="Virtual & physical cards" description="Spend anywhere with your Safe Haven card" color="#475467" bg="#F2F4F7" />
              <FeatureItem icon={Shield}     title="Bank-grade security" description="Your funds are protected with enterprise security" color="#12B76A" bg="#ECFDF3" />
              <FeatureItem icon={Globe}      title="Global transfers" description="Send money worldwide with low fees" color="#2775CA" bg="#EFF8FF" />
            </div>

            <button onClick={goToDashboard} className={primaryBtn} style={primaryStyle} onMouseEnter={onHover} onMouseLeave={offHover}>
              Go to dashboard <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        )}

        {/* Dots */}
        <div className="mt-8 flex items-center gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button key={i} onClick={() => goToSlide(i)} aria-label={`Slide ${i + 1}`}
              style={{ height: 8, width: i === slide ? 24 : 8, borderRadius: 4, backgroundColor: i === slide ? "var(--dash-primary)" : "var(--dash-border-2)", transition: "all 300ms" }} />
          ))}
        </div>
        <p className="mt-3 text-[11px]" style={{ color: "var(--dash-text-3)" }}>{slide + 1} of {totalSlides}</p>
      </div>

      <style>{`@keyframes obFade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
