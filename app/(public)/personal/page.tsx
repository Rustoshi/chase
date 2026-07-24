import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import { Wallet, Building2, CreditCard, ArrowRight, Shield, Smartphone, Clock } from "lucide-react"

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI = "var(--sh-font-ui)"
const MONO = "var(--sh-font-mono)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

export const metadata: Metadata = {
  title: `Personal Banking | ${BANK_NAME}`,
  description: `Discover personal banking solutions designed for your lifestyle. Checking accounts, savings, and credit cards with ${BANK_NAME}.`,
}

const PRODUCTS = [
  {
    icon: Wallet,
    title: "Checking Account",
    description: "Everyday banking with no monthly fees, unlimited transactions, and instant notifications.",
    href: "/personal/checking",
    features: ["No monthly fees", "Free ATM withdrawals", "Instant transfers"],
  },
  {
    icon: Building2,
    title: "Savings Account",
    description: "Grow your money with competitive interest rates and flexible access to your funds.",
    href: "/personal/savings",
    features: ["High-yield interest", "No minimum balance", "Automatic savings"],
  },
  {
    icon: CreditCard,
    title: "Credit Cards",
    description: "Earn rewards on every purchase with no annual fees and premium benefits.",
    href: "/personal/cards",
    features: ["Cashback rewards", "No annual fee", "Travel perks"],
  },
]

const BENEFITS = [
  {
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Your money is protected with 256-bit encryption and FDIC insurance up to $250,000.",
  },
  {
    icon: Smartphone,
    title: "Mobile-First Banking",
    description: "Manage your accounts, pay bills, and send money from anywhere with our app.",
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Our team is always available to help you with any questions or concerns.",
  },
]

export default function PersonalBankingPage() {
  return (
    <>
      {/* Hero Section */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Personal Banking</span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                Personal banking, reimagined
              </h1>
              <p className="text-[16px] leading-relaxed mb-9 max-w-md" style={{ color: "var(--sh-ink-80)" }}>
                Banking that fits your life. No hidden fees, no minimum balances, just simple and
                secure financial tools designed for you.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/register"
                  className={LABEL + " inline-flex items-center px-7 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                >
                  Open an Account
                </Link>
                <Link href="/contact" className="inline-flex items-center text-[14px]" style={{ color: INK }}>
                  Talk to an Expert <ArrowRight className="w-4 h-4 ml-1.5" strokeWidth={1.25} />
                </Link>
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/advisor-client.jpg"
                alt="A private banking advisor meeting with a client over a laptop"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-6">
            <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Accounts</span>
          </div>
          <div className="max-w-2xl mb-14">
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            >
              Choose the right account for you
            </h2>
            <p className="text-[16px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
              Whether you&apos;re saving for the future or managing daily expenses, we have the
              perfect solution.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {PRODUCTS.map((product) => {
              const Icon = product.icon
              return (
                <Link
                  key={product.title}
                  href={product.href}
                  className="group block p-7"
                  style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                >
                  <Icon className="h-6 w-6 mb-6" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <h3 className="text-[18px] font-medium mb-3" style={{ color: INK }}>
                    {product.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed mb-6" style={{ color: "var(--sh-ink-80)" }}>
                    {product.description}
                  </p>
                  <ul className="space-y-2 mb-7">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-[14px]" style={{ color: "var(--sh-ink-80)" }}>
                        <span aria-hidden style={{ width: 5, height: 5, backgroundColor: BRONZE, borderRadius: "9999px", display: "inline-block" }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <span className="inline-flex items-center text-[14px]" style={{ color: INK }}>
                    Learn more <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" strokeWidth={1.25} />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div
              className="relative overflow-hidden aspect-[5/4] order-2 lg:order-1"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/wealth-planning.jpg"
                alt="An advisor reviewing account details on a phone with a client"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Why Safe Haven</span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                Why bank with us?
              </h2>
              <p className="text-[16px] leading-relaxed mb-10" style={{ color: "var(--sh-ink-80)" }}>
                We&apos;re building banking for the modern world.
              </p>

              <div className="space-y-8">
                {BENEFITS.map((benefit) => {
                  const Icon = benefit.icon
                  return (
                    <div key={benefit.title} className="flex items-start gap-5">
                      <Icon className="h-6 w-6 flex-shrink-0 mt-0.5" strokeWidth={1.25} style={{ color: BRONZE }} />
                      <div>
                        <h3 className="text-[18px] font-medium mb-1.5" style={{ color: INK }}>
                          {benefit.title}
                        </h3>
                        <p className="text-[15px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
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
            Ready to get started?
          </h2>
          <p className="text-[16px] leading-relaxed mb-9 max-w-xl mx-auto" style={{ color: "var(--sh-linen-70)" }}>
            Open your account in minutes. No paperwork, no branch visits.
          </p>
          <Link
            href="/register"
            className={LABEL + " inline-flex items-center px-7 py-3.5"}
            style={{ color: BRONZE, border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
          >
            Open Your Account
          </Link>
        </div>
      </section>
    </>
  )
}
