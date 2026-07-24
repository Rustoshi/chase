import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import {
  ArrowRight,
  Wallet,
  Building2,
  CreditCard,
  Shield,
  Smartphone,
  Clock,
  Check,
  Zap,
} from "lucide-react"

const INK = '#17140F'
const BRONZE = '#A67C3D'
const DISPLAY = 'var(--sh-font-display)' // Newsreader — headings only
const UI = 'var(--sh-font-ui)'           // General Sans — body/UI/buttons
const MONO = 'var(--sh-font-mono)'       // Spline Sans Mono — figures/amounts/rates
const LABEL = 'text-[11px] uppercase tracking-[0.09em] font-medium'

export const metadata: Metadata = {
  title: `Personal Accounts | ${BANK_NAME}`,
  description: `Explore personal banking accounts at ${BANK_NAME}. Checking, savings, credit cards, and more with no hidden fees.`,
}

const ACCOUNT_TYPES = [
  {
    icon: Wallet,
    title: "Everyday Checking",
    description: "Your go-to account for daily transactions with no monthly fees and unlimited transfers.",
    features: ["No monthly fees", "Free ATM access", "Early direct deposit"],
    href: "/personal/checking",
  },
  {
    icon: Building2,
    title: "High-Yield Savings",
    description: "Grow your money faster with one of the highest APYs in the market.",
    features: ["4.50% APY", "No minimum balance", "Automatic savings"],
    href: "/personal/savings",
  },
  {
    icon: CreditCard,
    title: "Credit Cards",
    description: "Earn rewards on every purchase with no annual fees and premium benefits.",
    features: ["Up to 5% cashback", "No annual fee", "Travel perks"],
    href: "/personal/cards",
  },
]

const BENEFITS = [
  {
    icon: Shield,
    title: "FDIC Insured",
    description: "Your deposits are protected up to $250,000 by the Federal Deposit Insurance Corporation.",
  },
  {
    icon: Smartphone,
    title: "Mobile Banking",
    description: "Manage your accounts, pay bills, and send money from anywhere with our award-winning app.",
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Our customer support team is always available to help you with any questions.",
  },
  {
    icon: Zap,
    title: "Instant Transfers",
    description: "Send money to friends and family instantly, any time of day or night.",
  },
]

const COMPARISON = [
  { feature: "Monthly Fee", us: "$0", others: "$12-15" },
  { feature: "ATM Fees", us: "$0 (55,000+ ATMs)", others: "$2.50-5" },
  { feature: "Minimum Balance", us: "$0", others: "$500-1,500" },
  { feature: "Savings APY", us: "4.50%", others: "0.01-0.50%" },
  { feature: "Overdraft Fees", us: "$0 (with protection)", others: "$35" },
  { feature: "Foreign Transaction Fee", us: "$0", others: "1-3%" },
]

const STATS = [
  { value: "$0", label: "Monthly Fees" },
  { value: "4.50%", label: "Savings APY" },
  { value: "55K+", label: "Free ATMs" },
  { value: "2M+", label: "Happy Customers" },
]

export default function PersonalAccountsPage() {
  return (
    <>
      {/* Hero */}
      <section style={{ backgroundColor: 'var(--sh-linen)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>Personal Banking</span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                Banking that works for you
              </h1>
              <p className="text-[16px] leading-relaxed mb-9 max-w-lg" style={{ color: 'var(--sh-ink-80)' }}>
                No hidden fees. No minimum balances. Just simple, secure banking
                designed around your life. Open an account in minutes.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/register"
                  className={LABEL + ' inline-flex items-center px-7 py-3.5'}
                  style={{ color: 'var(--sh-bronze-dark)', border: '0.5px solid ' + BRONZE, borderRadius: '2px' }}
                >
                  Open an Account
                </Link>
                <Link href="#accounts" className="inline-flex items-center gap-1.5 text-[14px]" style={{ color: INK }}>
                  Compare Accounts
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Link>
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: '8px', border: '0.5px solid var(--sh-ink-20)' }}
            >
              <Image
                src="/images/stock/advisor-client.jpg"
                alt="A relationship manager reviewing a personal banking account with a client"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats — dark anchor */}
      <section style={{ backgroundColor: 'var(--sh-ink)', fontFamily: UI }} className="py-14 lg:py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-[2rem] sm:text-[2.25rem] mb-2" style={{ fontFamily: DISPLAY, fontWeight: 300, color: 'var(--sh-linen)' }}>
                  {stat.value}
                </p>
                <p className={LABEL} style={{ color: 'var(--sh-linen-70)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Account Types */}
      <section id="accounts" style={{ backgroundColor: 'var(--sh-surface)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl mb-14">
            <div className="flex items-center gap-3 mb-5">
              <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
              <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>Account Types</span>
            </div>
            <h2 className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4" style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}>
              Choose the right account for you
            </h2>
            <p className="text-[16px] leading-relaxed" style={{ color: 'var(--sh-ink-80)' }}>
              Whether you&apos;re saving for the future or managing daily expenses, we have the perfect solution.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {ACCOUNT_TYPES.map((account) => {
              const Icon = account.icon
              return (
                <Link
                  key={account.title}
                  href={account.href}
                  className="group block p-7"
                  style={{ backgroundColor: 'var(--sh-linen)', border: '0.5px solid var(--sh-ink-10)', borderRadius: '8px' }}
                >
                  <Icon className="h-6 w-6 mb-6" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <h3 className="text-[18px] mb-3" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                    {account.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed mb-6" style={{ color: 'var(--sh-ink-80)' }}>
                    {account.description}
                  </p>
                  <ul className="space-y-2.5 mb-7">
                    {account.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-[14px]" style={{ color: 'var(--sh-ink-80)' }}>
                        <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} style={{ color: BRONZE }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <span className="inline-flex items-center gap-1.5 text-[14px]" style={{ color: INK }}>
                    Learn more
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Wealth split — savings emphasis */}
      <section style={{ backgroundColor: 'var(--sh-linen)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="relative overflow-hidden aspect-[5/4] order-2 lg:order-1" style={{ borderRadius: '8px', border: '0.5px solid var(--sh-ink-20)' }}>
              <Image
                src="/images/stock/wealth-planning.jpg"
                alt="An advisor showing a savings plan to a client on a phone"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-5">
                <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>Why Bank With Us</span>
              </div>
              <h2 className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4" style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}>
                We&apos;re building banking for the modern world
              </h2>
              <p className="text-[16px] leading-relaxed" style={{ color: 'var(--sh-ink-80)' }}>
                Savings that actually grow, with a{' '}
                <span style={{ fontFamily: MONO, fontWeight: 400, color: INK }}>4.50% APY</span> and no minimum
                balance to worry about. Every account comes with the same disciplined attention, whether
                you&apos;re managing daily expenses or planning years ahead.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-16 lg:mt-20">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon
              return (
                <div key={benefit.title} className="text-center sm:text-left">
                  <Icon className="h-6 w-6 mb-4 mx-auto sm:mx-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <h3 className="text-[18px] mb-2" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                    {benefit.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed" style={{ color: 'var(--sh-ink-80)' }}>
                    {benefit.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section style={{ backgroundColor: 'var(--sh-surface)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-14">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>The Comparison</span>
              </div>
              <h2 className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4" style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}>
                See how we compare
              </h2>
              <p className="text-[16px] leading-relaxed" style={{ color: 'var(--sh-ink-80)' }}>
                We&apos;re different from traditional banks. Here&apos;s how.
              </p>
            </div>
            <div className="relative overflow-hidden aspect-[16/9]" style={{ borderRadius: '8px', border: '0.5px solid var(--sh-ink-20)' }}>
              <Image
                src="/images/stock/card-closeup.jpg"
                alt="A close-up of stacked personal banking cards"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full max-w-3xl mx-auto">
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--sh-ink-20)' }}>
                  <th className={LABEL + ' text-left py-4 px-4 sm:px-6'} style={{ color: 'var(--sh-ink-50)' }}>Feature</th>
                  <th className={LABEL + ' text-center py-4 px-4 sm:px-6'} style={{ color: 'var(--sh-bronze-dark)' }}>{BANK_NAME}</th>
                  <th className={LABEL + ' text-center py-4 px-4 sm:px-6'} style={{ color: 'var(--sh-ink-50)' }}>Traditional Banks</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature} style={{ borderBottom: '0.5px solid var(--sh-ink-10)' }}>
                    <td className="py-4 px-4 sm:px-6 text-[15px]" style={{ color: 'var(--sh-ink-80)' }}>{row.feature}</td>
                    <td className="text-center py-4 px-4 sm:px-6 text-[15px]" style={{ fontFamily: MONO, fontWeight: 400, color: INK }}>{row.us}</td>
                    <td className="text-center py-4 px-4 sm:px-6 text-[15px]" style={{ fontFamily: MONO, fontWeight: 400, color: 'var(--sh-ink-50)' }}>{row.others}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Closing CTA — dark anchor */}
      <section style={{ backgroundColor: 'var(--sh-ink)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h2 className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4" style={{ fontFamily: DISPLAY, fontWeight: 400, color: 'var(--sh-linen)' }}>
            Ready to get started?
          </h2>
          <p className="text-[16px] leading-relaxed mb-9 max-w-xl mx-auto" style={{ color: 'var(--sh-linen-70)' }}>
            Open your account in minutes. No paperwork, no branch visits.
          </p>
          <Link
            href="/register"
            className={LABEL + ' inline-flex items-center px-7 py-3.5'}
            style={{ color: BRONZE, border: '0.5px solid ' + BRONZE, borderRadius: '2px' }}
          >
            Open Your Account
          </Link>
        </div>
      </section>

    </>
  )
}
