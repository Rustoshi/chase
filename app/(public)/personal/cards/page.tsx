import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import {
  Check,
  Percent,
  Plane,
  ShoppingBag,
  Shield,
  Gift,
  Smartphone,
  Globe,
} from "lucide-react"

export const metadata: Metadata = {
  title: `Credit Cards | ${BANK_NAME}`,
  description: `Explore our credit cards with cashback rewards, no annual fees, and premium travel benefits. Apply today with ${BANK_NAME}.`,
}

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI = "var(--sh-font-ui)"
const MONO = "var(--sh-font-mono)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

const CARDS = [
  {
    name: "Everyday Rewards",
    tagline: "Best for daily spending",
    icon: ShoppingBag,
    apr: "15.99% - 23.99%",
    annualFee: "$0",
    rewards: [
      "3% cashback on groceries",
      "2% cashback on gas",
      "1% cashback on everything else",
    ],
    perks: [
      "No annual fee",
      "0% intro APR for 15 months",
      "No foreign transaction fees",
    ],
    featured: false,
  },
  {
    name: "Premium Travel",
    tagline: "Best for frequent travelers",
    icon: Plane,
    apr: "17.99% - 24.99%",
    annualFee: "$95",
    rewards: [
      "5x points on travel",
      "3x points on dining",
      "1x points on everything else",
    ],
    perks: [
      "$200 annual travel credit",
      "Airport lounge access",
      "Travel insurance included",
    ],
    featured: true,
  },
  {
    name: "Cash Back Plus",
    tagline: "Best for maximizing cashback",
    icon: Percent,
    apr: "16.99% - 24.99%",
    annualFee: "$0",
    rewards: [
      "5% cashback on rotating categories",
      "3% cashback on online shopping",
      "1.5% cashback on everything else",
    ],
    perks: [
      "No annual fee",
      "$150 sign-up bonus",
      "Cell phone protection",
    ],
    featured: false,
  },
]

const BENEFITS = [
  {
    icon: Shield,
    title: "Fraud Protection",
    description: "Zero liability for unauthorized purchases. We monitor 24/7.",
  },
  {
    icon: Smartphone,
    title: "Instant Notifications",
    description: "Get alerts for every transaction in real-time.",
  },
  {
    icon: Gift,
    title: "Bonus Rewards",
    description: "Earn extra points on special promotions throughout the year.",
  },
  {
    icon: Globe,
    title: "Worldwide Acceptance",
    description: "Use your card at millions of locations worldwide.",
  },
]

const STEPS = [
  {
    number: "1",
    title: "Check Eligibility",
    description: "See which cards you qualify for without affecting your credit score.",
  },
  {
    number: "2",
    title: "Apply Online",
    description: "Complete your application in just a few minutes.",
  },
  {
    number: "3",
    title: "Start Earning",
    description: "Get your card and start earning rewards right away.",
  },
]

export default function CreditCardsPage() {
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
                  Personal Cards
                </span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                Rewards that actually matter
              </h1>
              <p className="text-[16px] leading-relaxed mb-8 max-w-lg" style={{ color: "var(--sh-ink-80)" }}>
                Earn cashback, travel points, and exclusive perks with every purchase.
                No annual fees on most cards.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="#cards"
                  className={LABEL + " inline-flex items-center px-7 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                >
                  Compare Cards
                </Link>
                <Link href="#benefits" className="text-[14px]" style={{ color: INK }}>
                  See all benefits →
                </Link>
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/card-closeup.jpg"
                alt="Close-up of a stack of Safe Haven Private credit cards"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Cards Grid */}
      <section id="cards" style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
              <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                Compare Cards
              </span>
            </div>
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            >
              Find your perfect card
            </h2>
            <p className="text-[16px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
              Whether you want cashback, travel rewards, or low interest, we have a card for you.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {CARDS.map((card) => {
              const Icon = card.icon
              return (
                <div
                  key={card.name}
                  style={{
                    backgroundColor: "var(--sh-linen)",
                    border: card.featured ? "0.5px solid " + BRONZE : "0.5px solid var(--sh-ink-10)",
                    borderRadius: "8px",
                  }}
                  className="p-7 flex flex-col"
                >
                  {card.featured && (
                    <span className={LABEL} style={{ color: "var(--sh-bronze-dark)" }}>
                      Most Popular
                    </span>
                  )}

                  {/* Card Visual */}
                  <div
                    style={{ backgroundColor: INK, borderRadius: "8px" }}
                    className={"relative overflow-hidden p-6 h-40 " + (card.featured ? "mt-4 mb-6" : "mt-0 mb-6")}
                  >
                    <p className="text-[13px] mb-1" style={{ color: "var(--sh-linen-70)" }}>
                      {BANK_NAME}
                    </p>
                    <p className="text-[18px]" style={{ fontFamily: DISPLAY, fontWeight: 400, color: "var(--sh-linen)" }}>
                      {card.name}
                    </p>
                    <Icon
                      className="h-8 w-8 absolute bottom-6 right-6"
                      strokeWidth={1.25}
                      style={{ color: BRONZE }}
                    />
                  </div>

                  <p className="text-[14px] mb-5" style={{ color: "var(--sh-ink-50)" }}>
                    {card.tagline}
                  </p>

                  {/* Rewards */}
                  <div className="mb-5">
                    <p className="text-[15px] mb-3" style={{ fontWeight: 500, color: INK }}>
                      Rewards
                    </p>
                    <ul className="space-y-2">
                      {card.rewards.map((reward) => (
                        <li key={reward} className="flex items-start gap-2 text-[14px]" style={{ color: "var(--sh-ink-80)" }}>
                          <Check className="h-4 w-4 mt-0.5 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                          {reward}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Perks */}
                  <div className="mb-6">
                    <p className="text-[15px] mb-3" style={{ fontWeight: 500, color: INK }}>
                      Perks
                    </p>
                    <ul className="space-y-2">
                      {card.perks.map((perk) => (
                        <li key={perk} className="flex items-start gap-2 text-[14px]" style={{ color: "var(--sh-ink-80)" }}>
                          <Check className="h-4 w-4 mt-0.5 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                          {perk}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-6 pt-4" style={{ borderTop: "0.5px solid var(--sh-ink-10)" }}>
                    <div className="flex justify-between items-center text-[14px]">
                      <span style={{ color: "var(--sh-ink-50)" }}>APR</span>
                      <span style={{ fontFamily: MONO, fontWeight: 400, color: INK }}>{card.apr}</span>
                    </div>
                    <div className="flex justify-between items-center text-[14px]">
                      <span style={{ color: "var(--sh-ink-50)" }}>Annual Fee</span>
                      <span style={{ fontFamily: MONO, fontWeight: 400, color: INK }}>{card.annualFee}</span>
                    </div>
                  </div>

                  <Link
                    href="/register"
                    className={LABEL + " flex items-center justify-center w-full px-6 py-3.5 mt-auto"}
                    style={
                      card.featured
                        ? { color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }
                        : { color: INK, border: "0.5px solid var(--sh-ink-20)", borderRadius: "2px" }
                    }
                  >
                    Apply Now
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
              <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                Standard Benefits
              </span>
            </div>
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            >
              Every card includes
            </h2>
            <p className="text-[16px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
              Premium benefits that come standard with all our credit cards.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon
              return (
                <div
                  key={benefit.title}
                  style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                  className="p-7"
                >
                  <Icon className="h-6 w-6 mb-4" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <h3 className="text-[18px] mb-2" style={{ fontWeight: 500, color: INK }}>
                    {benefit.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed" style={{ color: "var(--sh-ink-50)" }}>
                    {benefit.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How to Apply */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div
              className="relative overflow-hidden aspect-[5/4] order-2 lg:order-1"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/credit-card.jpg"
                alt="Tapping a card to pay on a point-of-sale terminal"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                  Getting Started
                </span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                Apply in minutes
              </h2>
              <p className="text-[16px] leading-relaxed mb-10" style={{ color: "var(--sh-ink-80)" }}>
                Get a decision in seconds. No impact on your credit score to check your eligibility.
              </p>

              <div className="space-y-8">
                {STEPS.map((step) => (
                  <div key={step.number} className="flex items-start gap-4">
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "9999px",
                        border: "0.5px solid var(--sh-ink-20)",
                        fontFamily: MONO,
                        color: "var(--sh-bronze-dark)",
                      }}
                    >
                      {step.number}
                    </div>
                    <div>
                      <h3 className="text-[18px] mb-1" style={{ fontWeight: 500, color: INK }}>
                        {step.title}
                      </h3>
                      <p className="text-[15px] leading-relaxed" style={{ color: "var(--sh-ink-50)" }}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
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
            Ready to earn rewards?
          </h2>
          <p className="text-[16px] leading-relaxed mb-8 max-w-xl mx-auto" style={{ color: "var(--sh-linen-70)" }}>
            Apply now and start earning on every purchase.
          </p>
          <Link
            href="/register"
            className={LABEL + " inline-flex items-center px-7 py-3.5"}
            style={{ color: BRONZE, border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
          >
            Apply Now
          </Link>
        </div>
      </section>
    </>
  )
}
