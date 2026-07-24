import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import {
  ArrowRight,
  Lock,
  TrendingUp,
  Shield,
  Calendar,
} from "lucide-react"

const INK = '#17140F'
const BRONZE = '#A67C3D'
const DISPLAY = 'var(--sh-font-display)' // Newsreader — headings only
const UI = 'var(--sh-font-ui)'           // General Sans — body/UI/buttons
const MONO = 'var(--sh-font-mono)'       // Spline Sans Mono — figures/amounts/rates
const LABEL = 'text-[11px] uppercase tracking-[0.09em] font-medium'

export const metadata: Metadata = {
  title: `Fixed Deposits & CDs | ${BANK_NAME}`,
  description: `Earn guaranteed returns with fixed deposits and CDs from ${BANK_NAME}. FDIC insured up to $250,000.`,
}

const CD_TERMS = [
  { term: "3 Months", apy: "4.00%", minDeposit: "$500" },
  { term: "6 Months", apy: "4.25%", minDeposit: "$500" },
  { term: "9 Months", apy: "4.50%", minDeposit: "$500" },
  { term: "12 Months", apy: "4.75%", minDeposit: "$500", popular: true },
  { term: "18 Months", apy: "4.50%", minDeposit: "$500" },
  { term: "24 Months", apy: "4.25%", minDeposit: "$500" },
  { term: "36 Months", apy: "4.00%", minDeposit: "$500" },
  { term: "60 Months", apy: "3.75%", minDeposit: "$500" },
]

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Guaranteed Returns",
    description: "Lock in your rate for the full term. No market risk.",
  },
  {
    icon: Shield,
    title: "FDIC Insured",
    description: "Your deposits are protected up to $250,000.",
  },
  {
    icon: Lock,
    title: "Fixed Rate",
    description: "Your APY stays the same for the entire term.",
  },
  {
    icon: Calendar,
    title: "Flexible Terms",
    description: "Choose from 3 months to 5 years.",
  },
]

const STEPS = [
  {
    n: "01",
    title: "Choose your term",
    description: "Select a term that fits your savings goals, from 3 months to 5 years.",
  },
  {
    n: "02",
    title: "Deposit your funds",
    description: "Make your initial deposit. Minimum $500 to open.",
  },
  {
    n: "03",
    title: "Earn guaranteed interest",
    description: "Your rate is locked in. At maturity, withdraw or renew.",
  },
]

const FAQS = [
  {
    q: "What happens when my CD matures?",
    a: "You'll have a 10-day grace period to withdraw your funds or renew your CD. If you don't take action, your CD will automatically renew at the current rate.",
  },
  {
    q: "Can I withdraw early?",
    a: "Yes, but early withdrawal penalties apply. The penalty varies by term length and is typically a portion of the interest earned.",
  },
  {
    q: "Are my deposits insured?",
    a: "Yes, all deposits are FDIC insured up to $250,000 per depositor, per insured bank.",
  },
]

export default function DepositsPage() {
  return (
    <>
      {/* Hero */}
      <section style={{ backgroundColor: 'var(--sh-linen)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>Fixed Deposits</span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                Earn up to{" "}
                <span style={{ fontFamily: MONO, fontWeight: 400, color: BRONZE }}>4.75% APY</span>
              </h1>
              <p className="text-[16px] leading-relaxed mb-8 max-w-lg" style={{ color: 'var(--sh-ink-80)' }}>
                Lock in guaranteed returns with our Certificates of Deposit. FDIC insured
                up to $250,000 with flexible terms from 3 months to 5 years.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/register"
                  className={LABEL + ' inline-flex items-center px-7 py-3.5'}
                  style={{ color: 'var(--sh-bronze-dark)', border: '0.5px solid ' + BRONZE, borderRadius: '2px' }}
                >
                  Open a CD
                </Link>
                <Link href="#rates" className="text-[14px] inline-flex items-center gap-1" style={{ color: INK }}>
                  View rates <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.25} />
                </Link>
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: '8px', border: '0.5px solid var(--sh-ink-20)' }}
            >
              <Image
                src="/images/stock/wealth-planning.jpg"
                alt="Advisor reviewing fixed deposit options with a client"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ backgroundColor: 'var(--sh-surface)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-12">
            <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>Why a CD</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  style={{ backgroundColor: 'var(--sh-linen)', border: '0.5px solid var(--sh-ink-10)', borderRadius: '8px' }}
                  className="p-7"
                >
                  <Icon className="h-6 w-6 mb-4" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <h3 className="text-[18px] mb-2" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                    {feature.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed" style={{ color: 'var(--sh-ink-50)' }}>
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CD Rates */}
      <section id="rates" style={{ backgroundColor: 'var(--sh-linen)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-3 mb-5">
              <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
              <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>Current Rates</span>
              <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
            </div>
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            >
              Current CD rates
            </h2>
            <p className="text-[16px] max-w-2xl mx-auto" style={{ color: 'var(--sh-ink-50)' }}>
              Rates are subject to change. APY accurate as of today.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CD_TERMS.map((cd) => (
              <div
                key={cd.term}
                className="relative p-6 text-center"
                style={{
                  backgroundColor: 'var(--sh-surface)',
                  borderRadius: '8px',
                  border: cd.popular ? '0.5px solid ' + BRONZE : '0.5px solid var(--sh-ink-10)',
                }}
              >
                {cd.popular && (
                  <div
                    className={LABEL + ' absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1'}
                    style={{ backgroundColor: 'var(--sh-linen)', border: '0.5px solid ' + BRONZE, color: 'var(--sh-bronze-dark)', borderRadius: '2px' }}
                  >
                    Best Rate
                  </div>
                )}
                <p className="text-[13px] mb-3" style={{ color: 'var(--sh-ink-50)' }}>{cd.term}</p>
                <p
                  className="text-[1.75rem] mb-1"
                  style={{ fontFamily: MONO, fontWeight: 400, color: cd.popular ? BRONZE : INK }}
                >
                  {cd.apy}
                </p>
                <p className="text-[11px] uppercase tracking-[0.09em] mb-4" style={{ color: 'var(--sh-ink-50)' }}>APY</p>
                <p className="text-[13px]" style={{ fontFamily: MONO, color: 'var(--sh-ink-50)' }}>
                  Min: {cd.minDeposit}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/register"
              className={LABEL + ' inline-flex items-center px-7 py-3.5'}
              style={{ color: 'var(--sh-bronze-dark)', border: '0.5px solid ' + BRONZE, borderRadius: '2px' }}
            >
              Open a CD Account
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ backgroundColor: 'var(--sh-surface)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div
              className="relative overflow-hidden aspect-[5/4] order-2 lg:order-1"
              style={{ borderRadius: '8px', border: '0.5px solid var(--sh-ink-20)' }}
            >
              <Image
                src="/images/stock/skyline.jpg"
                alt="Financial district skyline at dusk"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-5">
                <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>Process</span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                How CDs work
              </h2>
              <p className="text-[16px] mb-10" style={{ color: 'var(--sh-ink-50)' }}>
                Simple, straightforward, and secure.
              </p>
              <div className="space-y-8">
                {STEPS.map((step) => (
                  <div key={step.n} className="flex gap-5">
                    <span
                      className="shrink-0 text-[13px]"
                      style={{ fontFamily: MONO, fontWeight: 400, color: BRONZE }}
                    >
                      {step.n}
                    </span>
                    <div>
                      <h3 className="text-[18px] mb-1" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                        {step.title}
                      </h3>
                      <p className="text-[14px] leading-relaxed" style={{ color: 'var(--sh-ink-50)' }}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ backgroundColor: 'var(--sh-linen)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>FAQ</span>
          </div>
          <h2
            className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-10 text-center"
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
          >
            Frequently asked questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div
                key={faq.q}
                style={{ backgroundColor: 'var(--sh-surface)', border: '0.5px solid var(--sh-ink-10)', borderRadius: '8px' }}
                className="p-7"
              >
                <h3 className="text-[18px] mb-2" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                  {faq.q}
                </h3>
                <p className="text-[14px] leading-relaxed" style={{ color: 'var(--sh-ink-50)' }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section style={{ backgroundColor: 'var(--sh-ink)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: 'var(--sh-linen-70)' }}>Get Started</span>
            <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
          </div>
          <h2
            className="text-[1.75rem] sm:text-[2.25rem] leading-[1.15] mb-4"
            style={{ fontFamily: DISPLAY, fontWeight: 300, color: 'var(--sh-linen)' }}
          >
            Start earning today
          </h2>
          <p className="text-[16px] mb-10 max-w-xl mx-auto" style={{ color: 'var(--sh-linen-70)' }}>
            Lock in a great rate and watch your savings grow.
          </p>
          <Link
            href="/register"
            className={LABEL + ' inline-flex items-center px-7 py-3.5'}
            style={{ color: BRONZE, border: '0.5px solid ' + BRONZE, borderRadius: '2px' }}
          >
            Open a CD
          </Link>
        </div>
      </section>
    </>
  )
}
