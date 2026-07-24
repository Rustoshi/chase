import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import {
  ArrowRight,
  Building2,
  CreditCard,
  Users,
  Shield,
  Check,
  Zap,
  PieChart,
  Receipt,
} from "lucide-react"

export const metadata: Metadata = {
  title: `Business Accounts | ${BANK_NAME}`,
  description: `Business banking accounts at ${BANK_NAME}. Checking, credit, payroll, and more for businesses of all sizes.`,
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
    description: "A powerful checking account with no monthly fees and unlimited transactions.",
    features: ["No monthly fees", "Unlimited transactions", "Free ACH transfers"],
    href: "/business/checking",
  },
  {
    icon: CreditCard,
    title: "Business Credit",
    description: "Credit cards and lines of credit to fuel your business growth.",
    features: ["Up to $500K credit line", "1.5% cashback", "No annual fee"],
    href: "/business/credit",
  },
  {
    icon: Users,
    title: "Payroll Services",
    description: "Automated payroll, tax filing, and benefits management.",
    features: ["Automated payroll", "Tax filing included", "Employee self-service"],
    href: "/business/payroll",
  },
]

const BENEFITS = [
  {
    icon: Zap,
    title: "Fast Onboarding",
    description: "Open your business account in minutes, not days. No branch visits required.",
  },
  {
    icon: PieChart,
    title: "Financial Insights",
    description: "Real-time dashboards and reports to track your business performance.",
  },
  {
    icon: Receipt,
    title: "Expense Management",
    description: "Categorize expenses automatically and sync with your accounting software.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade security with fraud monitoring and custom access controls.",
  },
]

const STATS = [
  { value: "50K+", label: "Businesses Trust Us" },
  { value: "$10B+", label: "Processed Monthly" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support" },
]

const INTEGRATIONS = [
  "QuickBooks",
  "Xero",
  "Stripe",
  "Shopify",
  "Square",
  "Gusto",
  "Slack",
  "Zapier",
]

export default function BusinessAccountsPage() {
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
                  Business Banking
                </span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                Banking built for business
              </h1>
              <p className="text-[16px] leading-relaxed mb-8 max-w-xl" style={{ color: "var(--sh-ink-80)" }}>
                From startups to enterprises, we have the tools you need to manage
                your finances, pay your team, and grow your business.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/register?type=business"
                  className={LABEL + " inline-flex items-center px-7 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                >
                  Open Business Account
                </Link>
                <Link href="#products" className="text-[14px] inline-flex items-center gap-1" style={{ color: INK }}>
                  Explore products <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.25} />
                </Link>
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/boardroom.jpg"
                alt="Three businesspeople in suits reviewing documents in a boardroom"
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
                <p className="text-2xl mb-1" style={{ fontFamily: MONO, fontWeight: 400, color: "var(--sh-linen)" }}>
                  {stat.value}
                </p>
                <p className="text-[13px]" style={{ color: "var(--sh-linen-70)" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-4">
            <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
              Products
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15]"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            >
              Everything your business needs
            </h2>
            <p className="text-[16px] leading-relaxed max-w-md" style={{ color: "var(--sh-ink-80)" }}>
              Comprehensive banking solutions designed for modern businesses.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PRODUCTS.map((product) => {
              const Icon = product.icon
              return (
                <Link
                  key={product.title}
                  href={product.href}
                  className="group p-7 block"
                  style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                >
                  <Icon className="h-6 w-6 mb-6" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <h3 className="text-[18px] mb-3" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                    {product.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed mb-6" style={{ color: "var(--sh-ink-80)" }}>
                    {product.description}
                  </p>
                  <ul className="space-y-2 mb-6">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-[14px]" style={{ color: "var(--sh-ink-80)" }}>
                        <Check className="h-4 w-4 shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <span className="text-[14px] inline-flex items-center gap-1" style={{ color: INK }}>
                    Learn more
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.25} />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                  Why Us
                </span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                Why businesses choose us
              </h2>
              <p className="text-[16px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
                Built from the ground up for the way modern businesses operate.
              </p>
            </div>
            <div
              className="relative overflow-hidden aspect-[3/2]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/office-architecture.jpg"
                alt="Cluster of modern corporate glass office towers"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
      </section>

      {/* Integrations */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
              <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                Integrations
              </span>
            </div>
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            >
              Integrates with your tools
            </h2>
            <p className="text-[16px] leading-relaxed max-w-2xl mx-auto" style={{ color: "var(--sh-ink-80)" }}>
              Connect with the apps you already use to streamline your workflow.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {INTEGRATIONS.map((integration) => (
              <div
                key={integration}
                className="px-6 py-3 text-[14px]"
                style={{
                  backgroundColor: "var(--sh-linen)",
                  border: "0.5px solid var(--sh-ink-10)",
                  borderRadius: "8px",
                  color: INK,
                }}
              >
                {integration}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial + supporting image */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div
              className="relative overflow-hidden aspect-[5/4] order-2 lg:order-1"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/business-team.jpg"
                alt="Small-business owner holding an OPEN sign"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div
              className="p-8 order-1 lg:order-2"
              style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
            >
              <p className="text-[18px] leading-relaxed italic mb-6" style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}>
                &ldquo;Switching to {BANK_NAME} was the best decision we made for our business.
                The integrated payroll and expense management saves us hours every week.&rdquo;
              </p>
              <div>
                <p className="text-[15px]" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                  Sarah Chen
                </p>
                <p className="text-[13px]" style={{ color: "var(--sh-ink-50)" }}>
                  CEO, TechStart Inc.
                </p>
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
            Ready to grow your business?
          </h2>
          <p className="text-[16px] leading-relaxed mb-8 max-w-xl mx-auto" style={{ color: "var(--sh-linen-70)" }}>
            Open your business account in minutes. No paperwork, no hassle.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/register?type=business"
              className={LABEL + " inline-flex items-center px-7 py-3.5"}
              style={{ color: BRONZE, border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
            >
              Open Business Account
            </Link>
            <Link href="/contact" className="text-[14px] inline-flex items-center gap-1" style={{ color: "var(--sh-linen-70)" }}>
              Talk to Sales <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.25} />
            </Link>
          </div>
        </div>
      </section>

    </>
  )
}
