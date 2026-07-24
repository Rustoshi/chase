import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import {
  ArrowRight,
  Check,
  DollarSign,
  Clock,
  Percent,
  Calculator,
} from "lucide-react"

export const metadata: Metadata = {
  title: `Personal Loans | ${BANK_NAME}`,
  description: `Get a personal loan with competitive rates from ${BANK_NAME}. Fast approval, flexible terms.`,
}

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI = "var(--sh-font-ui)"
const MONO = "var(--sh-font-mono)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

const FEATURES = [
  {
    icon: Percent,
    title: "Competitive Rates",
    description: "Fixed rates starting at 6.99% APR for qualified borrowers.",
  },
  {
    icon: DollarSign,
    title: "Borrow Up to $50,000",
    description: "Get the funds you need for any purpose.",
  },
  {
    icon: Clock,
    title: "Fast Funding",
    description: "Receive funds as soon as the next business day.",
  },
  {
    icon: Calculator,
    title: "Flexible Terms",
    description: "Choose repayment terms from 12 to 84 months.",
  },
]

const USE_CASES = [
  "Debt consolidation",
  "Home improvement",
  "Major purchases",
  "Medical expenses",
  "Wedding expenses",
  "Vacation",
]

const RATE_STATS = [
  { value: "6.99%", label: "Starting APR" },
  { value: "$50K", label: "Maximum Loan" },
  { value: "$0", label: "Origination Fee" },
  { value: "1 Day", label: "Funding Time" },
]

const STEPS = [
  "Tell us about yourself",
  "See your personalized rate",
  "Get funded as soon as tomorrow",
]

export default function PersonalLoansPage() {
  return (
    <>
      {/* Hero */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Personal Loans</span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                Get the funds you need, fast
              </h1>
              <p className="text-[16px] leading-relaxed mb-8 max-w-xl" style={{ color: "var(--sh-ink-80)" }}>
                Personal loans with competitive rates, no hidden fees, and flexible
                repayment terms. Check your rate without affecting your credit score.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/register"
                  className={LABEL + " inline-flex items-center px-7 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                >
                  Check Your Rate
                </Link>
                <Link href="#calculator" className="text-[14px] inline-flex items-center gap-1" style={{ color: INK }}>
                  Calculate Payment
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.25} />
                </Link>
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/advisor-desk.jpg"
                alt="Banker at a desk assisting a client with a personal loan application"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Rate Highlight */}
      <section style={{ backgroundColor: "var(--sh-ink)", fontFamily: UI }} className="py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid sm:grid-cols-4 gap-6">
            {RATE_STATS.map((stat) => (
              <div
                key={stat.label}
                className="p-6 text-center"
                style={{ border: "0.5px solid var(--sh-linen-12)", borderRadius: "8px" }}
              >
                <p className="text-3xl mb-2" style={{ fontFamily: MONO, fontWeight: 400, color: "var(--sh-linen)" }}>
                  {stat.value}
                </p>
                <p className="text-sm" style={{ color: "var(--sh-linen-70)" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-4">
            <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Why Safe Haven</span>
          </div>
          <h2
            className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-12 max-w-2xl"
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
          >
            Why choose our personal loans?
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                  className="p-7"
                >
                  <Icon className="h-6 w-6 mb-4" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <h3 className="text-[18px] mb-2" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                    {feature.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed" style={{ color: "var(--sh-ink-50)" }}>
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Flexibility</span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                Use your loan for anything
              </h2>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                Our personal loans can be used for any purpose. No restrictions.
              </p>
              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                {USE_CASES.map((useCase) => (
                  <div key={useCase} className="flex items-center gap-3">
                    <Check className="h-4 w-4 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                    <span className="text-[15px]" style={{ color: "var(--sh-ink-80)" }}>{useCase}</span>
                  </div>
                ))}
              </div>
              <div
                className="relative overflow-hidden aspect-[16/9]"
                style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
              >
                <Image
                  src="/images/stock/new-home.jpg"
                  alt="Handing over house keys, one common use for a personal loan"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div
              id="calculator"
              style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
              className="p-8"
            >
              <h3 className="text-[18px] mb-6" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                Check your rate in minutes
              </h3>
              <div className="space-y-4 mb-8">
                {STEPS.map((step, index) => (
                  <div key={step} className="flex items-center gap-4">
                    <div
                      className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                      style={{ border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                    >
                      <span style={{ fontFamily: MONO, fontWeight: 400, color: BRONZE }} className="text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <span className="text-[15px]" style={{ color: "var(--sh-ink-80)" }}>{step}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/register"
                className={LABEL + " flex items-center justify-center w-full px-6 py-3.5"}
                style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
              >
                Check Your Rate
                <ArrowRight className="h-3.5 w-3.5 ml-2" strokeWidth={1.25} />
              </Link>
              <p className="text-[12px] text-center mt-4" style={{ color: "var(--sh-ink-50)" }}>
                Checking your rate won&apos;t affect your credit score
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section style={{ backgroundColor: "var(--sh-ink)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h2
            className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: "var(--sh-linen)" }}
          >
            Ready to get started?
          </h2>
          <p className="text-[16px] leading-relaxed mb-8 max-w-xl mx-auto" style={{ color: "var(--sh-linen-70)" }}>
            Check your rate in minutes with no impact to your credit score.
          </p>
          <Link
            href="/register"
            className={LABEL + " inline-flex items-center px-7 py-3.5"}
            style={{ color: BRONZE, border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
          >
            Check Your Rate
            <ArrowRight className="h-3.5 w-3.5 ml-2" strokeWidth={1.25} />
          </Link>
        </div>
      </section>
    </>
  )
}
