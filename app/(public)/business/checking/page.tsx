import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import {
  Check,
  Building2,
  Users,
  BarChart3,
  Shield,
  Zap,
  Globe,
  Receipt,
} from "lucide-react"

export const metadata: Metadata = {
  title: `Business Checking Account | ${BANK_NAME}`,
  description: `Open a free business checking account with ${BANK_NAME}. No monthly fees, unlimited transactions, and powerful financial tools.`,
}

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI = "var(--sh-font-ui)"
const MONO = "var(--sh-font-mono)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

const FEATURES = [
  {
    icon: Building2,
    title: "No Monthly Fees",
    description: "Keep more of your revenue. No minimum balance requirements or hidden charges.",
  },
  {
    icon: Zap,
    title: "Unlimited Transactions",
    description: "Process as many transactions as you need without per-transaction fees.",
  },
  {
    icon: Users,
    title: "Multi-User Access",
    description: "Add team members with customizable permissions and spending limits.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track cash flow, expenses, and revenue with powerful dashboards.",
  },
  {
    icon: Globe,
    title: "International Payments",
    description: "Send and receive payments in 30+ currencies at competitive rates.",
  },
  {
    icon: Receipt,
    title: "Expense Management",
    description: "Categorize expenses automatically and export for accounting.",
  },
]

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "/month",
    description: "Perfect for freelancers and small businesses",
    features: [
      "No monthly fees",
      "Unlimited transactions",
      "1 user included",
      "Basic analytics",
      "Email support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$25",
    period: "/month",
    description: "For growing businesses with a team",
    features: [
      "Everything in Starter",
      "Up to 5 users",
      "Advanced analytics",
      "API access",
      "Priority support",
      "Custom cards",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large organizations with complex needs",
    features: [
      "Everything in Growth",
      "Unlimited users",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "On-premise options",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
]

export default function BusinessCheckingPage() {
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
                  Business Checking
                </span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                A checking account built for business
              </h1>
              <p className="text-[16px] leading-relaxed mb-8 max-w-lg" style={{ color: "var(--sh-ink-80)" }}>
                Manage your business finances with powerful tools, no monthly fees, and
                unlimited transactions. Open your account in minutes.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/register?type=business"
                  className={LABEL + " inline-flex items-center px-7 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                >
                  Open Account
                </Link>
                <Link href="#pricing" className="text-[14px]" style={{ color: INK }}>
                  View pricing →
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
              Everything you need to run your business
            </h2>
            <p className="text-[16px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
              Powerful features designed for modern businesses.
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

      {/* Team / Owners Split */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div
              className="relative overflow-hidden aspect-[5/4] order-2 lg:order-1"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/business-team.jpg"
                alt="A small-business owner holding an OPEN sign"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                  Built for owners
                </span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                From first hire to full team
              </h2>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                Add team members with customizable permissions and spending limits, track
                cash flow in real time, and move money internationally without leaving your
                dashboard.
              </p>
              <Link href="#pricing" className="text-[14px]" style={{ color: INK }}>
                Compare plans →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
              <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                Pricing
              </span>
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            </div>
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            >
              Simple, transparent pricing
            </h2>
            <p className="text-[16px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
              Choose the plan that fits your business. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className="relative p-8"
                style={{
                  backgroundColor: plan.highlighted ? "var(--sh-bronze-10)" : "var(--sh-linen)",
                  border: plan.highlighted ? "0.5px solid " + BRONZE : "0.5px solid var(--sh-ink-10)",
                  borderRadius: "8px",
                }}
              >
                {plan.highlighted && (
                  <div
                    className={LABEL + " absolute -top-3 left-8 px-3 py-1"}
                    style={{ backgroundColor: BRONZE, color: "var(--sh-linen)", borderRadius: "2px" }}
                  >
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-[18px] mb-2" style={{ fontWeight: 500, color: INK }}>
                    {plan.name}
                  </h3>
                  <p className="text-[14px]" style={{ color: "var(--sh-ink-50)" }}>
                    {plan.description}
                  </p>
                </div>
                <div className="mb-6">
                  <span className="text-[2rem]" style={{ fontFamily: MONO, fontWeight: 400, color: INK }}>
                    {plan.price}
                  </span>
                  <span className="text-[14px]" style={{ color: "var(--sh-ink-50)" }}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-[14px]" style={{ color: "var(--sh-ink-80)" }}>
                      <Check className="h-4 w-4 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.name === "Enterprise" ? "/contact" : "/register?type=business"}
                  className={LABEL + " flex items-center justify-center w-full px-6 py-3.5"}
                  style={{
                    color: plan.highlighted ? "var(--sh-bronze-dark)" : INK,
                    border: plan.highlighted ? "0.5px solid " + BRONZE : "0.5px solid var(--sh-ink-20)",
                    borderRadius: "2px",
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
              <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                Security
              </span>
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            </div>
            <Shield className="h-8 w-8 mx-auto mb-6" strokeWidth={1.25} style={{ color: BRONZE }} />
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            >
              Enterprise-grade security
            </h2>
            <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
              Your business funds are protected with bank-grade encryption, FDIC insurance
              up to <span style={{ fontFamily: MONO, color: INK }}>$250,000</span>, and{" "}
              <span style={{ fontFamily: MONO, color: INK }}>24/7</span> fraud monitoring.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "2px" }}>
                <Shield className="h-5 w-5" strokeWidth={1.25} style={{ color: BRONZE }} />
                <span className="text-[13px]" style={{ color: "var(--sh-ink-80)" }}>FDIC Insured</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "2px" }}>
                <Shield className="h-5 w-5" strokeWidth={1.25} style={{ color: BRONZE }} />
                <span className="text-[13px]" style={{ color: "var(--sh-ink-80)" }}>SOC 2 Certified</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "2px" }}>
                <Shield className="h-5 w-5" strokeWidth={1.25} style={{ color: BRONZE }} />
                <span className="text-[13px]" style={{ color: "var(--sh-ink-80)" }}>PCI Compliant</span>
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
            Open your business account today
          </h2>
          <p className="text-[16px] leading-relaxed mb-8 max-w-xl mx-auto" style={{ color: "var(--sh-linen-70)" }}>
            Get started in minutes. No paperwork, no branch visits required.
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
