import Link from "next/link"
import Image from "next/image"
import { Check } from "lucide-react"

/* ══════════════════════════════════════════════════════════════════════════
   Safe Haven Private — public hero
   Split layout borrowed from a classic bank hero (copy + single CTA left,
   imagery with a floating statement chip right). Styling per design.md:
   linen base, ink type in Newsreader, a single bronze accent, sharp 2px CTA,
   hairline framing, mono amounts — no shadows, no gradients.
   ══════════════════════════════════════════════════════════════════════════ */

const INK      = "#17140F"
const BRONZE   = "#A67C3D"
const DISPLAY  = "var(--sh-font-display)"
const UI_FONT  = "var(--sh-font-ui)"
const MONO     = "var(--sh-font-mono)"
const LABEL    = "text-[11px] uppercase tracking-[0.09em] font-medium"

export function HeroSection() {
  return (
    <section
      className="relative"
      style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI_FONT }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Copy column ─────────────────────────────────────────────── */}
          <div className="max-w-xl">
            <h1
              className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08]"
              style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
            >
              Your money, kept
              <br />
              in careful order.
            </h1>

            <p
              className="mt-6 text-[16px] leading-relaxed"
              style={{ color: "var(--sh-ink-80, #17140FCC)" }}
            >
              Open accounts, move funds, and review every statement in one
              considered place, with unhurried verification, real-time alerts,
              and complete control over what your balance does.
            </p>

            {/* One primary action; the rest is a quiet text link */}
            <div className="mt-9 flex items-center gap-7">
              <Link
                href="/register"
                className={`${LABEL} inline-flex items-center px-7 py-3.5 transition-colors duration-200`}
                style={{
                  color: "var(--sh-bronze-dark)",
                  border: `0.5px solid ${BRONZE}`,
                  borderRadius: "2px",
                }}
              >
                Open an account
              </Link>
              <Link
                href="/login"
                className="text-[14px] transition-colors duration-200"
                style={{ color: INK }}
              >
                Log in →
              </Link>
            </div>
          </div>

          {/* ── Image column ────────────────────────────────────────────── */}
          <div className="relative">
            <div
              className="relative overflow-hidden aspect-[4/3] lg:aspect-[5/4]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/hero.jpg"
                alt="A client and adviser reviewing accounts together"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* Floating statement chip — a card: surface, hairline, no shadow */}
            <div
              className="absolute -bottom-5 left-5 sm:-left-5 px-5 py-4 w-[220px]"
              style={{
                backgroundColor: "var(--sh-surface)",
                border: "0.5px solid var(--sh-ink-10)",
                borderRadius: "8px",
              }}
            >
              <div className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                Interest credited
              </div>
              <div className="mt-1 text-[12px]" style={{ color: "var(--sh-ink-50)" }}>
                Reserve · Jul 2026
              </div>
              <div
                className="mt-2 text-[18px]"
                style={{ fontFamily: MONO, fontWeight: 400, color: INK }}
              >
                + $1,240.00
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

// ── Trust Badges Section ─────────────────────────────────────────────────────

const TRUST_ITEMS = ["FDIC Insured", "256-bit SSL", "PCI DSS Compliant", "SOC 2 Certified"]

export function TrustBadges() {
  return (
    <section
      className="py-10"
      style={{
        backgroundColor: "var(--sh-surface)",
        fontFamily: UI_FONT,
        borderTop: "0.5px solid var(--sh-ink-10)",
        borderBottom: "0.5px solid var(--sh-ink-10)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex flex-col items-center gap-7">
          <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Trusted &amp; Secure</span>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {TRUST_ITEMS.map((label, i) => (
              <div key={label} className="flex items-center">
                {i > 0 && (
                  <span
                    aria-hidden
                    className="hidden sm:block mr-10"
                    style={{ width: "0.5px", height: 16, backgroundColor: "var(--sh-ink-20)" }}
                  />
                )}
                <span className="flex items-center gap-2.5 text-[13px]" style={{ color: INK }}>
                  <Check className="h-4 w-4" strokeWidth={1.5} style={{ color: BRONZE }} />
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
