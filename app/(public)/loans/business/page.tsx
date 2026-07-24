import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import { Check, Clock, Percent, Shield } from "lucide-react"

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI = "var(--sh-font-ui)"
const MONO = "var(--sh-font-mono)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

export const metadata: Metadata = {
  title: `Business Loans | ${BANK_NAME}`,
  description: `Business loans and lines of credit from ${BANK_NAME}. Flexible financing for your business growth.`,
}

const LOAN_TYPES = [
  {
    title: "Term Loan",
    description: "Fixed-rate loans with predictable monthly payments",
    amount: "Up to $500,000",
    term: "1-5 years",
    rate: "From 7.99% APR",
  },
  {
    title: "Line of Credit",
    description: "Flexible access to funds when you need them",
    amount: "Up to $250,000",
    term: "Revolving",
    rate: "From 8.99% APR",
  },
  {
    title: "SBA Loans",
    description: "Government-backed loans with competitive terms",
    amount: "Up to $5,000,000",
    term: "Up to 25 years",
    rate: "From 6.50% APR",
  },
]

const REQUIREMENTS = [
  "Business operating for 1+ years",
  "Annual revenue of $100,000+",
  "Good personal credit (650+)",
  "US-based business",
]

const USE_CASES = [
  "Working capital",
  "Equipment purchase",
  "Inventory financing",
  "Business expansion",
  "Real estate",
  "Debt refinancing",
]

export default function BusinessLoansPage() {
  return (
    <>
      {/* Hero */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                  Business Loans
                </span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                Fuel your business growth
              </h1>
              <p className="text-[16px] leading-relaxed mb-9 max-w-lg" style={{ color: "var(--sh-ink-80)" }}>
                Flexible financing solutions to help your business thrive. From term loans
                to lines of credit, we have options for every stage of growth.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/register?type=business"
                  className={LABEL + " inline-flex items-center px-7 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                >
                  Check Eligibility
                </Link>
                <Link href="/contact" className="text-[14px]" style={{ color: INK }}>
                  Talk to an Expert →
                </Link>
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/office-architecture.jpg"
                alt="Cluster of modern corporate glass towers"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Loan Types */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-4">
            <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
              Financing Options
            </span>
          </div>
          <h2
            className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-14 max-w-2xl"
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
          >
            Choose the right financing for your business needs
          </h2>

          <div className="grid lg:grid-cols-3 gap-8">
            {LOAN_TYPES.map((loan) => (
              <div
                key={loan.title}
                style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                className="p-7 flex flex-col"
              >
                <h3 className="text-[18px] font-medium mb-2" style={{ color: INK }}>
                  {loan.title}
                </h3>
                <p className="text-[15px] leading-relaxed mb-6" style={{ color: "var(--sh-ink-50)" }}>
                  {loan.description}
                </p>
                <div className="space-y-3 mb-7">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[13px]" style={{ color: "var(--sh-ink-50)" }}>
                      Amount
                    </span>
                    <span className="text-[15px]" style={{ fontFamily: MONO, fontWeight: 400, color: INK }}>
                      {loan.amount}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[13px]" style={{ color: "var(--sh-ink-50)" }}>
                      Term
                    </span>
                    <span className="text-[15px]" style={{ fontFamily: MONO, fontWeight: 400, color: INK }}>
                      {loan.term}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[13px]" style={{ color: "var(--sh-ink-50)" }}>
                      Rate
                    </span>
                    <span className="text-[15px]" style={{ fontFamily: MONO, fontWeight: 400, color: "var(--sh-bronze-dark)" }}>
                      {loan.rate}
                    </span>
                  </div>
                </div>
                <Link
                  href="/register?type=business"
                  className="mt-auto flex items-center justify-center w-full px-6 py-3 text-[14px]"
                  style={{ border: "0.5px solid var(--sh-ink-20)", color: INK, borderRadius: "2px" }}
                >
                  Learn More
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases & Requirements */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                  Use of Funds
                </span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-8"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                Use your funds for
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {USE_CASES.map((useCase) => (
                  <div key={useCase} className="flex items-center gap-3">
                    <Check className="h-5 w-5 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                    <span className="text-[15px]" style={{ color: "var(--sh-ink-80)" }}>
                      {useCase}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                  Eligibility
                </span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-8"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                Requirements
              </h2>
              <div className="space-y-4">
                {REQUIREMENTS.map((req) => (
                  <div key={req} className="flex items-center gap-3">
                    <Check className="h-5 w-5 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                    <span className="text-[15px]" style={{ color: "var(--sh-ink-80)" }}>
                      {req}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supporting imagery */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div
              className="relative overflow-hidden aspect-[3/2] order-2 lg:order-1"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/entrepreneur.jpg"
                alt="Small business owner at a desk with a sign supporting small businesses"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-4">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                  Built For Owners
                </span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                A financing partner that understands your business
              </h2>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                Whether you're purchasing equipment, expanding to a new location, or
                smoothing out seasonal cash flow, our team works with you to structure
                financing that fits how your business actually operates.
              </p>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <Clock className="h-6 w-6" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <span className="text-[14px]" style={{ color: "var(--sh-ink-80)" }}>
                    Fast decisions
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <Percent className="h-6 w-6" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <span className="text-[14px]" style={{ color: "var(--sh-ink-80)" }}>
                    Competitive rates
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <Shield className="h-6 w-6" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <span className="text-[14px]" style={{ color: "var(--sh-ink-80)" }}>
                    Secure process
                  </span>
                </div>
              </div>
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
            Ready to grow your business?
          </h2>
          <p className="text-[16px] leading-relaxed mb-9 max-w-xl mx-auto" style={{ color: "var(--sh-linen-70)" }}>
            Check your eligibility in minutes with no impact to your credit score.
          </p>
          <Link
            href="/register?type=business"
            className={LABEL + " inline-flex items-center px-7 py-3.5"}
            style={{ color: BRONZE, border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
          >
            Get Started
          </Link>
        </div>
      </section>

    </>
  )
}
