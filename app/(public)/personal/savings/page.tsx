import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import {
  ArrowRight,
  Check,
  TrendingUp,
  PiggyBank,
  Target,
  Calculator,
  Shield,
  Repeat,
  Lock,
} from "lucide-react"

export const metadata: Metadata = {
  title: `High-Yield Savings Account | ${BANK_NAME}`,
  description: `Earn more with our high-yield savings account. Competitive APY, no minimum balance, and FDIC insured up to $250,000.`,
}

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI = "var(--sh-font-ui)"
const MONO = "var(--sh-font-mono)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

const FEATURES = [
  {
    icon: TrendingUp,
    title: "High-Yield APY",
    description: "Earn 4.50% APY on your savings, one of the highest rates in the market.",
  },
  {
    icon: PiggyBank,
    title: "No Minimum Balance",
    description: "Start saving with any amount. No minimum deposit required to open.",
  },
  {
    icon: Repeat,
    title: "Automatic Savings",
    description: "Set up recurring transfers to grow your savings automatically.",
  },
  {
    icon: Target,
    title: "Savings Goals",
    description: "Create multiple savings goals and track your progress visually.",
  },
  {
    icon: Calculator,
    title: "Interest Calculator",
    description: "See exactly how much you'll earn with our built-in calculator.",
  },
  {
    icon: Lock,
    title: "Flexible Access",
    description: "Access your money anytime. No lock-in periods or penalties.",
  },
]

const COMPARISON = [
  { bank: BANK_NAME, apy: "4.50%", minBalance: "$0", monthlyFee: "$0", highlight: true },
  { bank: "National Average", apy: "0.46%", minBalance: "Varies", monthlyFee: "Varies", highlight: false },
  { bank: "Big Bank A", apy: "0.01%", minBalance: "$500", monthlyFee: "$5", highlight: false },
  { bank: "Big Bank B", apy: "0.05%", minBalance: "$300", monthlyFee: "$4", highlight: false },
]

export default function SavingsAccountPage() {
  return (
    <>
      {/* Hero Section */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                  High-Yield Savings
                </span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                Earn{" "}
                <span style={{ fontFamily: MONO, fontWeight: 400 }}>4.50% APY</span>{" "}
                on your savings
              </h1>
              <p className="text-[16px] leading-relaxed mb-8 max-w-lg" style={{ color: "var(--sh-ink-80)" }}>
                Make your money work harder. Our high-yield savings account offers one of
                the best rates in the market with no fees and no minimum balance.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/register"
                  className={LABEL + " inline-flex items-center px-7 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                >
                  Start Saving
                </Link>
                <Link href="#calculator" className="text-[14px]" style={{ color: INK }}>
                  Calculate earnings →
                </Link>
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/wealth-planning.jpg"
                alt="A Safe Haven Private advisor reviewing a savings plan with a client"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* APY Highlight */}
      <section style={{ backgroundColor: "var(--sh-ink)", fontFamily: UI }} className="py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid sm:grid-cols-3 gap-6">
            <div
              className="p-7 text-center"
              style={{ backgroundColor: "var(--sh-linen-08)", border: "0.5px solid var(--sh-linen-12)", borderRadius: "8px" }}
            >
              <p className="text-4xl mb-2" style={{ fontFamily: MONO, fontWeight: 400, color: BRONZE }}>
                4.50%
              </p>
              <p className="text-[14px]" style={{ color: "var(--sh-linen-70)" }}>Annual Percentage Yield</p>
            </div>
            <div
              className="p-7 text-center"
              style={{ backgroundColor: "var(--sh-linen-08)", border: "0.5px solid var(--sh-linen-12)", borderRadius: "8px" }}
            >
              <p className="text-4xl mb-2" style={{ fontFamily: MONO, fontWeight: 400, color: "var(--sh-linen)" }}>
                $0
              </p>
              <p className="text-[14px]" style={{ color: "var(--sh-linen-70)" }}>Minimum Balance</p>
            </div>
            <div
              className="p-7 text-center"
              style={{ backgroundColor: "var(--sh-linen-08)", border: "0.5px solid var(--sh-linen-12)", borderRadius: "8px" }}
            >
              <p className="text-4xl mb-2" style={{ fontFamily: MONO, fontWeight: 400, color: "var(--sh-linen)" }}>
                $0
              </p>
              <p className="text-[14px]" style={{ color: "var(--sh-linen-70)" }}>Monthly Fees</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
              <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                Features
              </span>
            </div>
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            >
              Savings made simple
            </h2>
            <p className="text-[16px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
              All the tools you need to grow your savings effortlessly.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                  className="p-7"
                >
                  <Icon className="h-6 w-6 mb-4" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <h3 className="text-[18px] mb-2" style={{ fontWeight: 500, color: INK }}>
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

      {/* Comparison Table */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
              <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                Comparison
              </span>
            </div>
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            >
              See how we compare
            </h2>
            <p className="text-[16px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
              Our rates beat the national average by over 9x.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid var(--sh-ink-20)" }}>
                  <th className={LABEL + " text-left py-4 px-6"} style={{ color: "var(--sh-ink-50)", fontWeight: 500 }}>
                    Bank
                  </th>
                  <th className={LABEL + " text-center py-4 px-6"} style={{ color: "var(--sh-ink-50)", fontWeight: 500 }}>
                    APY
                  </th>
                  <th className={LABEL + " text-center py-4 px-6"} style={{ color: "var(--sh-ink-50)", fontWeight: 500 }}>
                    Min Balance
                  </th>
                  <th className={LABEL + " text-center py-4 px-6"} style={{ color: "var(--sh-ink-50)", fontWeight: 500 }}>
                    Monthly Fee
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.bank} style={{ borderBottom: "0.5px solid var(--sh-ink-10)" }}>
                    <td
                      className="py-4 px-6"
                      style={row.highlight ? { borderLeft: "2px solid " + BRONZE } : undefined}
                    >
                      <span
                        className="text-[15px]"
                        style={{ fontWeight: row.highlight ? 500 : 400, color: row.highlight ? "var(--sh-bronze-dark)" : "var(--sh-ink-80)" }}
                      >
                        {row.bank}
                      </span>
                    </td>
                    <td className="text-center py-4 px-6">
                      <span
                        style={{
                          fontFamily: MONO,
                          fontWeight: 400,
                          color: row.highlight ? "var(--sh-bronze-dark)" : INK,
                        }}
                      >
                        {row.apy}
                      </span>
                    </td>
                    <td className="text-center py-4 px-6" style={{ fontFamily: MONO, fontWeight: 400, color: "var(--sh-ink-80)" }}>
                      {row.minBalance}
                    </td>
                    <td className="text-center py-4 px-6" style={{ fontFamily: MONO, fontWeight: 400, color: "var(--sh-ink-80)" }}>
                      {row.monthlyFee}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section id="calculator" style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                  Calculator
                </span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                See your savings grow
              </h2>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                With our high-yield savings account, your money grows faster.
                Here&apos;s what you could earn:
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <span className="text-[15px]" style={{ color: "var(--sh-ink-80)" }}>
                    <span style={{ fontFamily: MONO }}>$10,000</span> deposit earns ~
                    <span style={{ fontFamily: MONO }}>$450</span>/year
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <span className="text-[15px]" style={{ color: "var(--sh-ink-80)" }}>
                    <span style={{ fontFamily: MONO }}>$25,000</span> deposit earns ~
                    <span style={{ fontFamily: MONO }}>$1,125</span>/year
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <span className="text-[15px]" style={{ color: "var(--sh-ink-80)" }}>
                    <span style={{ fontFamily: MONO }}>$50,000</span> deposit earns ~
                    <span style={{ fontFamily: MONO }}>$2,250</span>/year
                  </span>
                </div>
              </div>
            </div>
            <div style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }} className="p-8">
              <div className="text-center mb-8 pb-8" style={{ borderBottom: "0.5px solid var(--sh-ink-10)" }}>
                <p className="text-[14px] mb-3" style={{ color: "var(--sh-ink-50)" }}>
                  If you save $500/month for 5 years
                </p>
                <p className="text-5xl mb-3" style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}>
                  $33,847
                </p>
                <p className="text-[13px]" style={{ color: "var(--sh-ink-50)" }}>
                  Total balance (including <span style={{ fontFamily: MONO }}>$3,847</span> in interest)
                </p>
              </div>
              <Link
                href="/register"
                className={LABEL + " flex items-center justify-center w-full px-6 py-3.5"}
                style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
              >
                Start Saving Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div
              className="relative overflow-hidden aspect-[5/4] order-2 lg:order-1"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/skyline.jpg"
                alt="Frankfurt financial district skyline at dusk"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                  Security
                </span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                Your savings are protected
              </h2>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                Your deposits are FDIC insured up to <span style={{ fontFamily: MONO }}>$250,000</span>. We
                use bank-grade encryption and never invest your savings in risky assets.
              </p>
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                <span className="text-[13px]" style={{ color: "var(--sh-ink-80)" }}>FDIC Insured up to $250,000</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ backgroundColor: "var(--sh-ink)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h2
            className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: "var(--sh-linen)" }}
          >
            Open your savings account today
          </h2>
          <p className="text-[16px] leading-relaxed mb-8 max-w-xl mx-auto" style={{ color: "var(--sh-linen-70)" }}>
            It only takes a few minutes to start earning a market-leading rate.
          </p>
          <Link
            href="/register"
            className={LABEL + " inline-flex items-center gap-2 px-7 py-3.5"}
            style={{ color: BRONZE, border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
          >
            Open Savings Account
            <ArrowRight className="h-4 w-4" strokeWidth={1.25} />
          </Link>
        </div>
      </section>
    </>
  )
}
