import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import {
  Check,
  CreditCard,
  TrendingUp,
  Receipt,
  Users,
  Shield,
  Zap,
  PieChart,
  Clock,
} from "lucide-react"

const INK = '#17140F'
const BRONZE = '#A67C3D'
const DISPLAY = 'var(--sh-font-display)'
const UI = 'var(--sh-font-ui)'
const MONO = 'var(--sh-font-mono)'
const LABEL = 'text-[11px] uppercase tracking-[0.09em] font-medium'

export const metadata: Metadata = {
  title: `Business Credit & Cards | ${BANK_NAME}`,
  description: `Flexible business credit lines and corporate cards with cashback rewards. Fuel your business growth with ${BANK_NAME}.`,
}

const PRODUCTS = [
  {
    name: "Business Credit Card",
    description: "Earn rewards on every business purchase",
    features: [
      "1.5% cashback on all purchases",
      "No annual fee",
      "Employee cards at no extra cost",
      "Real-time expense tracking",
      "Custom spending limits",
    ],
    highlight: "Up to $50K credit limit",
  },
  {
    name: "Business Line of Credit",
    description: "Flexible funding when you need it",
    features: [
      "Credit lines up to $500K",
      "Only pay interest on what you use",
      "No prepayment penalties",
      "Fast approval process",
      "Flexible repayment terms",
    ],
    highlight: "Rates from 8.99% APR",
  },
]

const BENEFITS = [
  {
    icon: Zap,
    title: "Fast Approval",
    description: "Get a decision in minutes, not days. Funding available within 24 hours.",
  },
  {
    icon: PieChart,
    title: "Expense Management",
    description: "Track and categorize expenses automatically with detailed reporting.",
  },
  {
    icon: Users,
    title: "Team Cards",
    description: "Issue cards to employees with custom limits and real-time controls.",
  },
  {
    icon: Receipt,
    title: "Easy Integration",
    description: "Sync with QuickBooks, Xero, and other accounting software.",
  },
]

const REQUIREMENTS = [
  "Business registered for 6+ months",
  "Annual revenue of $50,000+",
  "Good personal credit (650+)",
  "US-based business",
]

const STEPS = [
  "Complete online application (5 min)",
  "Instant decision",
  "Access funds within 24 hours",
]

export default function BusinessCreditPage() {
  return (
    <>
      {/* Hero Section */}
      <section style={{ backgroundColor: 'var(--sh-linen)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>Business Credit</span>
              </div>
              <h1
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
              >
                Fuel your growth with flexible credit
              </h1>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: 'var(--sh-ink-80)' }}>
                Access the capital you need to grow your business. From credit cards to
                lines of credit, we have financing options that work for you.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/register?type=business"
                  className={LABEL + ' inline-flex items-center px-7 py-3.5'}
                  style={{ color: 'var(--sh-bronze-dark)', border: '0.5px solid ' + BRONZE, borderRadius: '2px' }}
                >
                  Check Eligibility
                </Link>
                <Link href="#products" className="text-[14px]" style={{ color: INK }}>
                  View Products →
                </Link>
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: '8px', border: '0.5px solid var(--sh-ink-20)' }}
            >
              <Image
                src="/images/stock/credit-card.jpg"
                alt="Business owner tapping a credit card on a payment terminal"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" style={{ backgroundColor: 'var(--sh-surface)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-4">
            <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>Products</span>
          </div>
          <h2
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
          >
            Choose your financing
          </h2>
          <p className="text-[16px] leading-relaxed max-w-2xl mb-16" style={{ color: 'var(--sh-ink-80)' }}>
            Flexible options to match your business needs.
          </p>

          <div className="grid lg:grid-cols-2 gap-8">
            {PRODUCTS.map((product) => (
              <div
                key={product.name}
                style={{ backgroundColor: 'var(--sh-linen)', border: '0.5px solid var(--sh-ink-10)', borderRadius: '8px' }}
                className="p-8"
              >
                {/* Card Visual */}
                <div
                  style={{ backgroundColor: INK, borderRadius: '8px', border: '0.5px solid var(--sh-ink-20)' }}
                  className="w-full h-40 p-6 mb-6 relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <p className="text-[13px] mb-1" style={{ color: 'var(--sh-linen-70)' }}>{BANK_NAME}</p>
                    <p className="text-[20px]" style={{ fontFamily: DISPLAY, fontWeight: 400, color: 'var(--sh-linen)' }}>
                      {product.name}
                    </p>
                  </div>
                  <CreditCard
                    className="absolute bottom-4 right-4 h-10 w-10"
                    strokeWidth={1.25}
                    style={{ color: 'var(--sh-linen-50)' }}
                  />
                </div>

                <p className="text-[15px] mb-4" style={{ color: 'var(--sh-ink-50)' }}>{product.description}</p>

                <div
                  className={LABEL + ' inline-flex items-center gap-2 px-3 py-1.5 mb-6'}
                  style={{ backgroundColor: 'var(--sh-bronze-10)', color: 'var(--sh-bronze-dark)', borderRadius: '2px' }}
                >
                  <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.25} />
                  <span style={{ fontFamily: MONO }}>{product.highlight}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-[15px]" style={{ color: 'var(--sh-ink-80)' }}>
                      <Check className="h-5 w-5 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register?type=business"
                  className={LABEL + ' flex items-center justify-center w-full px-6 py-3.5'}
                  style={{ color: 'var(--sh-bronze-dark)', border: '0.5px solid ' + BRONZE, borderRadius: '2px' }}
                >
                  Apply Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={{ backgroundColor: 'var(--sh-linen)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-4">
            <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>Platform</span>
          </div>
          <h2
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
          >
            Built for modern businesses
          </h2>
          <p className="text-[16px] leading-relaxed max-w-2xl mb-16" style={{ color: 'var(--sh-ink-80)' }}>
            Powerful tools to manage your business spending.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon
              return (
                <div
                  key={benefit.title}
                  style={{ backgroundColor: 'var(--sh-surface)', border: '0.5px solid var(--sh-ink-10)', borderRadius: '8px' }}
                  className="p-7"
                >
                  <Icon className="h-6 w-6 mb-4" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <h3 className="text-[18px] mb-2" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                    {benefit.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed" style={{ color: 'var(--sh-ink-50)' }}>
                    {benefit.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section style={{ backgroundColor: 'var(--sh-surface)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>Eligibility</span>
              </div>
              <h2
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-6"
              >
                Simple requirements
              </h2>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: 'var(--sh-ink-80)' }}>
                We&apos;ve streamlined the application process. Here&apos;s what you need to qualify:
              </p>
              <ul className="space-y-4 mb-10">
                {REQUIREMENTS.map((req) => (
                  <li key={req} className="flex items-center gap-3">
                    <Check className="h-5 w-5 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                    <span className="text-[15px]" style={{ color: 'var(--sh-ink-80)' }}>{req}</span>
                  </li>
                ))}
              </ul>
              <div
                className="relative overflow-hidden aspect-[16/9]"
                style={{ borderRadius: '8px', border: '0.5px solid var(--sh-ink-20)' }}
              >
                <Image
                  src="/images/stock/boardroom.jpg"
                  alt="Business partners reviewing financing documents"
                  fill
                  sizes="(max-width:1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div
              style={{ backgroundColor: 'var(--sh-linen)', border: '0.5px solid var(--sh-ink-10)', borderRadius: '8px' }}
              className="p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <Clock className="h-7 w-7" strokeWidth={1.25} style={{ color: BRONZE }} />
                <div>
                  <h3 className="text-[18px]" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                    Quick Application
                  </h3>
                  <p className="text-[14px]" style={{ color: 'var(--sh-ink-50)' }}>Get approved in minutes</p>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                {STEPS.map((step, i) => (
                  <div key={step} className="flex items-center gap-3">
                    <span
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '2px',
                        border: '0.5px solid ' + BRONZE,
                        fontFamily: MONO,
                        color: 'var(--sh-bronze-dark)',
                        fontSize: '13px',
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[15px]" style={{ color: 'var(--sh-ink-80)' }}>{step}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/register?type=business"
                className={LABEL + ' flex items-center justify-center w-full px-6 py-3.5'}
                style={{ color: 'var(--sh-bronze-dark)', border: '0.5px solid ' + BRONZE, borderRadius: '2px' }}
              >
                Check Your Eligibility
              </Link>
              <p className="text-[12px] text-center mt-4" style={{ color: 'var(--sh-ink-50)' }}>
                No impact on your credit score
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security / Closing CTA Section */}
      <section style={{ backgroundColor: 'var(--sh-ink)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto">
            <Shield className="h-8 w-8 mx-auto mb-6" strokeWidth={1.25} style={{ color: BRONZE }} />
            <h2
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: 'var(--sh-linen)' }}
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
            >
              Secure and compliant
            </h2>
            <p className="text-[16px] leading-relaxed mb-8" style={{ color: 'var(--sh-linen-70)' }}>
              Your business data is protected with enterprise-grade security.
              We&apos;re PCI compliant and use bank-level encryption for all transactions.
            </p>
            <Link
              href="/register?type=business"
              className={LABEL + ' inline-flex items-center px-7 py-3.5'}
              style={{ color: BRONZE, border: '0.5px solid ' + BRONZE, borderRadius: '2px' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

    </>
  )
}
