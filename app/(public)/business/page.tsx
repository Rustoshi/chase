import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import { Building2, CreditCard, Users, Shield, BarChart3, Clock, Zap } from "lucide-react"

export const metadata: Metadata = {
  title: `Business Banking | ${BANK_NAME}`,
  description: `Business banking solutions for startups, SMBs, and enterprises. Checking, credit, and payroll services with ${BANK_NAME}.`,
}

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI = "var(--sh-font-ui)"
const MONO = "var(--sh-font-mono)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

const PRODUCTS = [
  {
    icon: Building2,
    title: "Business Checking",
    description: "A powerful checking account built for businesses of all sizes with no monthly fees.",
    href: "/business/checking",
    features: ["No monthly fees", "Unlimited transactions", "Multi-user access"],
  },
  {
    icon: CreditCard,
    title: "Business Credit",
    description: "Flexible credit lines and business cards to fuel your growth.",
    href: "/business/credit",
    features: ["Up to $500K credit line", "1.5% cashback", "Expense management"],
  },
  {
    icon: Users,
    title: "Payroll Services",
    description: "Pay your team on time, every time with automated payroll processing.",
    href: "/business/payroll",
    features: ["Direct deposit", "Tax filing", "Benefits management"],
  },
]

const BENEFITS = [
  {
    icon: Zap,
    title: "Fast Onboarding",
    description: "Open your business account in minutes, not days. No branch visits required.",
  },
  {
    icon: BarChart3,
    title: "Financial Insights",
    description: "Real-time dashboards and reports to track your business performance.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade encryption, fraud monitoring, and role-based access controls.",
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Dedicated business support team available around the clock.",
  },
]

const STATS = [
  { value: "50K+", label: "Businesses served" },
  { value: "$2B+", label: "Processed monthly" },
  { value: "99.9%", label: "Uptime guarantee" },
  { value: "4.9/5", label: "Customer rating" },
]

export default function BusinessBankingPage() {
  return (
    <>
      {/* Hero */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Business Banking</span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                Banking built for business
              </h1>
              <p className="text-[16px] leading-relaxed mb-9 max-w-lg" style={{ color: "var(--sh-ink-80)" }}>
                From startups to enterprises, we provide the financial tools you need to
                manage cash flow, pay your team, and grow your business.
              </p>
              <div className="flex flex-wrap items-center gap-8">
                <Link
                  href="/register?type=business"
                  className={LABEL + " inline-flex items-center px-7 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                >
                  Open Business Account
                </Link>
                <Link href="/contact" className="text-[14px]" style={{ color: INK }}>
                  Contact Sales →
                </Link>
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/small-business.jpg"
                alt="Small business owner working in her shop"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ backgroundColor: "var(--sh-ink)", fontFamily: UI }} className="py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="text-center p-6"
                style={{ border: "0.5px solid var(--sh-linen-12)", borderRadius: "8px" }}
              >
                <p className="text-3xl mb-1" style={{ fontFamily: MONO, fontWeight: 400, color: "var(--sh-linen)" }}>
                  {stat.value}
                </p>
                <p className="text-sm" style={{ color: "var(--sh-linen-50)" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Products</span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                Everything your business needs
              </h2>
              <p className="text-[16px] leading-relaxed max-w-md" style={{ color: "var(--sh-ink-80)" }}>
                Comprehensive financial solutions designed for modern businesses.
              </p>
            </div>
            <div
              className="relative overflow-hidden aspect-[3/2]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/entrepreneur.jpg"
                alt="Entrepreneur at her desk supporting small businesses"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PRODUCTS.map((product) => {
              const Icon = product.icon
              return (
                <div
                  key={product.title}
                  style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                  className="p-7 flex flex-col"
                >
                  <Icon className="h-6 w-6 mb-6" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <h3 className="text-[18px] mb-3" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                    {product.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed mb-6" style={{ color: "var(--sh-ink-80)" }}>
                    {product.description}
                  </p>
                  <ul className="space-y-2 mb-7">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-[14px]" style={{ color: "var(--sh-ink-80)" }}>
                        <span aria-hidden style={{ width: 4, height: 4, borderRadius: "9999px", backgroundColor: BRONZE, flexShrink: 0 }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={product.href} className="text-[14px] mt-auto" style={{ color: INK }}>
                    Learn more →
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div
              className="relative overflow-hidden aspect-[4/3] order-2 lg:order-1"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/boardroom.jpg"
                alt="Business leaders reviewing documents in a boardroom"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Why Us</span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                Why businesses choose us
              </h2>
              <p className="text-[16px] leading-relaxed mb-10 max-w-md" style={{ color: "var(--sh-ink-80)" }}>
                We understand what it takes to run a successful business.
              </p>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-8">
                {BENEFITS.map((benefit) => {
                  const Icon = benefit.icon
                  return (
                    <div key={benefit.title}>
                      <Icon className="h-6 w-6 mb-4" strokeWidth={1.25} style={{ color: BRONZE }} />
                      <h3 className="text-[18px] mb-2" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                        {benefit.title}
                      </h3>
                      <p className="text-[15px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
                        {benefit.description}
                      </p>
                    </div>
                  )
                })}
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
          <p className="text-[16px] leading-relaxed mb-10 max-w-xl mx-auto" style={{ color: "var(--sh-linen-70)" }}>
            Open your business account today and get the tools you need to succeed.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <Link
              href="/register?type=business"
              className={LABEL + " inline-flex items-center px-7 py-3.5"}
              style={{ color: BRONZE, border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
            >
              Get Started
            </Link>
            <Link href="/contact" className="text-[14px]" style={{ color: "var(--sh-linen-70)" }}>
              Talk to Sales →
            </Link>
          </div>
        </div>
      </section>

    </>
  )
}
