import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import {
  Check,
  Wallet,
  CreditCard,
  Globe,
  Bell,
  Shield,
  Zap,
  Receipt,
} from "lucide-react"

export const metadata: Metadata = {
  title: `Checking Account | ${BANK_NAME}`,
  description: `Open a free checking account with ${BANK_NAME}. No monthly fees, unlimited transactions, and instant notifications.`,
}

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI = "var(--sh-font-ui)"
const MONO = "var(--sh-font-mono)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

const FEATURES = [
  {
    icon: Wallet,
    title: "No Monthly Fees",
    description: "Keep more of your money. No minimum balance requirements or hidden charges.",
  },
  {
    icon: Globe,
    title: "Free ATM Access",
    description: "Withdraw cash from 55,000+ ATMs nationwide with no fees.",
  },
  {
    icon: Zap,
    title: "Instant Transfers",
    description: "Send money to friends and family instantly, 24/7.",
  },
  {
    icon: Bell,
    title: "Real-Time Alerts",
    description: "Get notified instantly for every transaction on your account.",
  },
  {
    icon: CreditCard,
    title: "Free Debit Card",
    description: "Get a contactless debit card with chip security, delivered free.",
  },
  {
    icon: Receipt,
    title: "Early Direct Deposit",
    description: "Get your paycheck up to 2 days early with direct deposit.",
  },
]

const INCLUDED = [
  "No monthly maintenance fees",
  "No minimum balance requirement",
  "Free standard checks",
  "Free online bill pay",
  "Mobile check deposit",
  "Overdraft protection options",
  "Free account alerts",
  "24/7 customer support",
]

export default function CheckingAccountPage() {
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
                  Personal Checking
                </span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                Checking that works for you
              </h1>
              <p className="text-[16px] leading-relaxed mb-8 max-w-lg" style={{ color: "var(--sh-ink-80)" }}>
                A checking account with no monthly fees, no minimum balance, and all the
                features you need to manage your money effortlessly.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/register"
                  className={LABEL + " inline-flex items-center px-7 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                >
                  Open Account
                </Link>
                <Link href="#features" className="text-[14px]" style={{ color: INK }}>
                  See features →
                </Link>
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/advisor-desk.jpg"
                alt="A Safe Haven Private banker assisting a client at her desk"
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
      <section id="features" style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
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
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="text-[16px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
              Our checking account is designed to make your daily banking simple and fee-free.
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

      {/* What's Included */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                  Included
                </span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                What&apos;s included
              </h2>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                Every checking account comes with these features at no extra cost.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {INCLUDED.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Check className="h-4 w-4 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                    <span className="text-[15px]" style={{ color: "var(--sh-ink-80)" }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }} className="p-8">
              <div className="flex items-center gap-4 mb-6 pb-6" style={{ borderBottom: "0.5px solid var(--sh-ink-10)" }}>
                <Wallet className="h-7 w-7" strokeWidth={1.25} style={{ color: BRONZE }} />
                <div>
                  <h3 className="text-[18px]" style={{ fontWeight: 500, color: INK }}>
                    Everyday Checking
                  </h3>
                  <p className="text-[14px]" style={{ color: "var(--sh-ink-50)" }}>
                    Personal Account
                  </p>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center py-3" style={{ borderBottom: "0.5px solid var(--sh-ink-10)" }}>
                  <span className="text-[15px]" style={{ color: "var(--sh-ink-50)" }}>Monthly Fee</span>
                  <span style={{ fontFamily: MONO, fontWeight: 400, color: INK }}>$0</span>
                </div>
                <div className="flex justify-between items-center py-3" style={{ borderBottom: "0.5px solid var(--sh-ink-10)" }}>
                  <span className="text-[15px]" style={{ color: "var(--sh-ink-50)" }}>Minimum Balance</span>
                  <span style={{ fontFamily: MONO, fontWeight: 400, color: INK }}>$0</span>
                </div>
                <div className="flex justify-between items-center py-3" style={{ borderBottom: "0.5px solid var(--sh-ink-10)" }}>
                  <span className="text-[15px]" style={{ color: "var(--sh-ink-50)" }}>ATM Fees</span>
                  <span style={{ fontFamily: MONO, fontWeight: 400, color: INK }}>$0</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-[15px]" style={{ color: "var(--sh-ink-50)" }}>APY on Balance</span>
                  <span style={{ fontFamily: MONO, fontWeight: 400, color: "var(--sh-bronze-dark)" }}>0.50%</span>
                </div>
              </div>
              <Link
                href="/register"
                className={LABEL + " flex items-center justify-center w-full px-6 py-3.5"}
                style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
              >
                Open Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div
              className="relative overflow-hidden aspect-[5/4] order-2 lg:order-1"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/online-payment.jpg"
                alt="Paying securely with a card on a portable payment terminal"
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
                Your money is protected
              </h2>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                Your deposits are FDIC insured up to $250,000. We use bank-grade encryption
                and 24/7 fraud monitoring to keep your account secure.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "2px" }}>
                  <Shield className="h-5 w-5" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <span className="text-[13px]" style={{ color: "var(--sh-ink-80)" }}>FDIC Insured</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "2px" }}>
                  <Shield className="h-5 w-5" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <span className="text-[13px]" style={{ color: "var(--sh-ink-80)" }}>256-bit SSL</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5" style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "2px" }}>
                  <Shield className="h-5 w-5" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <span className="text-[13px]" style={{ color: "var(--sh-ink-80)" }}>24/7 Monitoring</span>
                </div>
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
            Open your checking account today
          </h2>
          <p className="text-[16px] leading-relaxed mb-8 max-w-xl mx-auto" style={{ color: "var(--sh-linen-70)" }}>
            It only takes a few minutes. No paperwork, no branch visits required.
          </p>
          <Link
            href="/register"
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
