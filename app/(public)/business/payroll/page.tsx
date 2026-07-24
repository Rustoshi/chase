import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import {
  Check,
  Users,
  Calendar,
  FileText,
  Shield,
  Zap,
  Calculator,
  DollarSign,
} from "lucide-react"

export const metadata: Metadata = {
  title: `Payroll Services | ${BANK_NAME}`,
  description: `Automated payroll processing, tax filing, and benefits management. Pay your team on time, every time with ${BANK_NAME}.`,
}

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI = "var(--sh-font-ui)"
const MONO = "var(--sh-font-mono)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

const FEATURES = [
  {
    icon: Zap,
    title: "Automated Payroll",
    description: "Set it and forget it. Payroll runs automatically on your schedule.",
  },
  {
    icon: FileText,
    title: "Tax Filing",
    description: "We calculate, file, and pay your federal, state, and local taxes.",
  },
  {
    icon: Calendar,
    title: "Direct Deposit",
    description: "Employees get paid on time with free direct deposit to any bank.",
  },
  {
    icon: Calculator,
    title: "Deductions & Benefits",
    description: "Manage health insurance, 401(k), and other deductions automatically.",
  },
  {
    icon: Users,
    title: "Employee Self-Service",
    description: "Employees can view pay stubs, W-2s, and update their info online.",
  },
  {
    icon: Shield,
    title: "Compliance Guaranteed",
    description: "Stay compliant with changing tax laws and labor regulations.",
  },
]

const PRICING = [
  {
    name: "Essential",
    price: "$40",
    perEmployee: "+ $6/employee",
    period: "/month",
    description: "For small teams getting started",
    features: [
      "Unlimited payroll runs",
      "Direct deposit",
      "Tax calculations",
      "Basic reporting",
      "Email support",
    ],
    highlighted: false,
  },
  {
    name: "Plus",
    price: "$80",
    perEmployee: "+ $12/employee",
    period: "/month",
    description: "For growing businesses",
    features: [
      "Everything in Essential",
      "Tax filing & payments",
      "Employee self-service",
      "Time tracking integration",
      "Priority support",
      "HR tools",
    ],
    highlighted: true,
  },
  {
    name: "Premium",
    price: "$135",
    perEmployee: "+ $16/employee",
    period: "/month",
    description: "For businesses with complex needs",
    features: [
      "Everything in Plus",
      "Benefits administration",
      "Workers' comp",
      "Dedicated support",
      "Custom reporting",
      "API access",
    ],
    highlighted: false,
  },
]

const STATS = [
  { value: "10K+", label: "Businesses trust us" },
  { value: "500K+", label: "Employees paid monthly" },
  { value: "99.9%", label: "On-time payroll rate" },
  { value: "$0", label: "Tax penalty guarantee" },
]

const STEPS = [
  {
    number: "1",
    title: "Add Employees",
    description: "Enter employee info or import from a spreadsheet.",
  },
  {
    number: "2",
    title: "Set Schedule",
    description: "Choose weekly, bi-weekly, or monthly pay periods.",
  },
  {
    number: "3",
    title: "Review & Approve",
    description: "Review payroll details and approve with one click.",
  },
  {
    number: "4",
    title: "We Handle the Rest",
    description: "We pay employees and file taxes automatically.",
  },
]

const GUARANTEE_ITEMS = [
  "Automatic tax calculations",
  "On-time federal, state, and local filings",
  "Year-end W-2 and 1099 preparation",
  "Penalty-free guarantee",
]

export default function PayrollServicesPage() {
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
                  Payroll Services
                </span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                Payroll that runs itself
              </h1>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                Automated payroll, tax filing, and benefits management. Pay your team
                accurately and on time, every time.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/register?type=business"
                  className={LABEL + " inline-flex items-center px-7 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                >
                  Start Free Trial
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
                src="/images/stock/business-team.jpg"
                alt="Small business owner holding an OPEN sign, ready to pay her team"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
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
                style={{ border: "0.5px solid rgba(242,238,228,0.15)", borderRadius: "8px" }}
              >
                <p className="text-3xl mb-1" style={{ fontFamily: MONO, fontWeight: 400, color: BRONZE }}>
                  {stat.value}
                </p>
                <p className="text-sm" style={{ color: "var(--sh-linen-70)" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
              <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                What's included
              </span>
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            </div>
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            >
              Everything you need to pay your team
            </h2>
            <p className="text-[16px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
              From payroll processing to tax compliance, we handle it all.
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
                  <h3 className="text-[18px] mb-2" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                    {feature.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
              <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                Getting started
              </span>
            </div>
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            >
              How it works
            </h2>
            <p className="text-[16px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
              Get started in minutes, not days.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step) => (
              <div key={step.number} className="text-center">
                <div
                  className="w-12 h-12 flex items-center justify-center mx-auto mb-4"
                  style={{ border: "0.5px solid " + BRONZE, borderRadius: "999px" }}
                >
                  <span style={{ fontFamily: MONO, fontWeight: 400, color: BRONZE }}>{step.number}</span>
                </div>
                <h3 className="text-[18px] mb-2" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                  {step.title}
                </h3>
                <p className="text-[15px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
              <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                Pricing
              </span>
            </div>
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            >
              Simple, transparent pricing
            </h2>
            <p className="text-[16px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
              No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className="relative p-8"
                style={{
                  backgroundColor: "var(--sh-linen)",
                  border: plan.highlighted ? "0.5px solid " + BRONZE : "0.5px solid var(--sh-ink-10)",
                  borderRadius: "8px",
                }}
              >
                {plan.highlighted && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1"
                    style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid " + BRONZE, borderRadius: "999px" }}
                  >
                    <span className={LABEL} style={{ color: "var(--sh-bronze-dark)" }}>
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-[18px] mb-2" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                    {plan.name}
                  </h3>
                  <p className="text-[15px]" style={{ color: "var(--sh-ink-50)" }}>
                    {plan.description}
                  </p>
                </div>
                <div className="mb-2">
                  <span className="text-4xl" style={{ fontFamily: MONO, fontWeight: 400, color: INK }}>
                    {plan.price}
                  </span>
                  <span className="text-[15px]" style={{ color: "var(--sh-ink-50)" }}>
                    {plan.period}
                  </span>
                </div>
                <p className="text-[14px] mb-6" style={{ fontFamily: MONO, color: "var(--sh-ink-80)" }}>
                  {plan.perEmployee}
                </p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-[14px]" style={{ color: "var(--sh-ink-80)" }}>
                      <Check className="h-4 w-4 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register?type=business"
                  className={LABEL + " flex items-center justify-center w-full px-6 py-3"}
                  style={{
                    color: plan.highlighted ? "var(--sh-bronze-dark)" : INK,
                    border: plan.highlighted ? "0.5px solid " + BRONZE : "0.5px solid var(--sh-ink-20)",
                    borderRadius: "2px",
                  }}
                >
                  Start Free Trial
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-[14px] mt-8" style={{ color: "var(--sh-ink-50)" }}>
            All plans include a 30-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* Tax Guarantee */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Shield className="h-6 w-6 mb-6" strokeWidth={1.25} style={{ color: BRONZE }} />
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                Tax penalty guarantee
              </h2>
              <p className="text-[16px] leading-relaxed mb-6" style={{ color: "var(--sh-ink-80)" }}>
                We guarantee accurate tax calculations and on-time filings. If we
                make a mistake, we'll pay the penalty.
              </p>
              <ul className="space-y-4">
                {GUARANTEE_ITEMS.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="h-5 w-5 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                    <span className="text-[15px]" style={{ color: "var(--sh-ink-80)" }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="p-8 text-center"
              style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
            >
              <DollarSign className="h-10 w-10 mx-auto mb-4" strokeWidth={1.25} style={{ color: BRONZE }} />
              <p className="text-5xl mb-2" style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}>
                $0
              </p>
              <p className="text-[16px] mb-6" style={{ color: "var(--sh-ink-80)" }}>
                Tax penalties, guaranteed
              </p>
              <p className="text-[14px]" style={{ color: "var(--sh-ink-50)" }}>
                If we make a tax filing error, we'll cover any resulting penalties
                and interest.
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
            Ready to simplify payroll?
          </h2>
          <p className="text-[16px] leading-relaxed mb-8 max-w-xl mx-auto" style={{ color: "var(--sh-linen-70)" }}>
            Start your free 30-day trial today. No credit card required.
          </p>
          <Link
            href="/register?type=business"
            className={LABEL + " inline-flex items-center px-7 py-3.5"}
            style={{ color: BRONZE, border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </>
  )
}
