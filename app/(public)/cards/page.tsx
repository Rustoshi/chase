import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import {
  ArrowRight,
  CreditCard,
  Shield,
  Check,
  Gift,
  Globe,
  Smartphone,
} from "lucide-react"

export const metadata: Metadata = {
  title: `Credit Cards | ${BANK_NAME}`,
  description: `Explore credit cards at ${BANK_NAME}. Cashback, travel rewards, and premium benefits with no annual fees.`,
}

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI = "var(--sh-font-ui)"
const MONO = "var(--sh-font-mono)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

const CARDS = [
  {
    name: "Everyday Cashback",
    tagline: "Simple rewards, no hassle",
    reward: "1.5%",
    rewardText: "cashback on everything",
    annualFee: "$0",
    features: [
      "1.5% unlimited cashback",
      "No annual fee",
      "No foreign transaction fees",
      "0% intro APR for 15 months",
    ],
    href: "/personal/cards",
    popular: false,
  },
  {
    name: "Premium Rewards",
    tagline: "Maximize your rewards",
    reward: "5%",
    rewardText: "on top categories",
    annualFee: "$0",
    features: [
      "5% on rotating categories",
      "3% on dining & groceries",
      "1% on everything else",
      "Welcome bonus: $200",
    ],
    href: "/personal/cards",
    popular: true,
  },
  {
    name: "Travel Elite",
    tagline: "For the frequent traveler",
    reward: "3X",
    rewardText: "points on travel",
    annualFee: "$95",
    features: [
      "3X points on travel & dining",
      "Airport lounge access",
      "Travel insurance included",
      "No foreign transaction fees",
    ],
    href: "/personal/cards",
    popular: false,
  },
]

const BENEFITS = [
  {
    icon: Shield,
    title: "Zero Liability",
    description: "You're never responsible for unauthorized purchases on your card.",
  },
  {
    icon: Smartphone,
    title: "Instant Notifications",
    description: "Get real-time alerts for every transaction on your card.",
  },
  {
    icon: Globe,
    title: "Worldwide Acceptance",
    description: "Use your card at millions of locations around the world.",
  },
  {
    icon: Gift,
    title: "Exclusive Offers",
    description: "Access special deals and discounts from our merchant partners.",
  },
]

const FEATURES = [
  "No annual fee options",
  "Contactless payments",
  "Virtual card numbers",
  "Freeze card instantly",
  "Custom spending limits",
  "Automatic fraud alerts",
]

const STEPS = [
  "Check if you're pre-approved",
  "Complete your application",
  "Get instant decision",
  "Start using your virtual card",
]

export default function CardsPage() {
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
                  Credit Cards
                </span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                Rewards that add up
              </h1>
              <p className="text-[16px] leading-relaxed mb-8 max-w-md" style={{ color: "var(--sh-ink-80)" }}>
                Earn cashback, travel points, and exclusive perks on every purchase. Find the
                card that fits your lifestyle.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/register"
                  className={LABEL + " inline-flex items-center px-7 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                >
                  Apply Now
                </Link>
                <Link href="#cards" className="text-[14px]" style={{ color: INK }}>
                  Compare Cards →
                </Link>
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/card-closeup.jpg"
                alt="Close-up of stacked premium cards"
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
          <div className="flex items-center gap-3 mb-4">
            <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
              Choose Your Card
            </span>
          </div>
          <h2
            className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4 max-w-xl"
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
          >
            A card for every way you spend
          </h2>
          <p className="text-[16px] leading-relaxed mb-14 max-w-2xl" style={{ color: "var(--sh-ink-80)" }}>
            From everyday cashback to premium travel rewards, we have a card for you.
          </p>

          <div className="grid lg:grid-cols-3 gap-8">
            {CARDS.map((card) => (
              <div
                key={card.name}
                className="relative p-7"
                style={{
                  backgroundColor: "var(--sh-surface)",
                  border: card.popular ? "0.5px solid " + BRONZE : "0.5px solid var(--sh-ink-10)",
                  borderRadius: "8px",
                }}
              >
                {card.popular && (
                  <div
                    className={LABEL + " absolute -top-3 left-6 px-3 py-1"}
                    style={{
                      backgroundColor: "var(--sh-surface)",
                      border: "0.5px solid " + BRONZE,
                      borderRadius: "2px",
                      color: "var(--sh-bronze-dark)",
                    }}
                  >
                    Most Popular
                  </div>
                )}

                {/* Card visual */}
                <div
                  className="w-full p-5 mb-6 flex flex-col justify-between"
                  style={{
                    aspectRatio: "1.6",
                    backgroundColor: "var(--sh-linen)",
                    border: "0.5px solid var(--sh-ink-20)",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <p className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                      {BANK_NAME}
                    </p>
                    <p className="text-[18px] mt-1" style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}>
                      {card.name}
                    </p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                        Annual Fee
                      </p>
                      <p style={{ fontFamily: MONO, fontWeight: 400, color: INK }}>{card.annualFee}</p>
                    </div>
                    <CreditCard className="h-6 w-6" strokeWidth={1.25} style={{ color: BRONZE }} />
                  </div>
                </div>

                <p className="text-[14px] mb-4" style={{ color: "var(--sh-ink-50)" }}>
                  {card.tagline}
                </p>

                <div className="mb-6 flex items-baseline gap-2">
                  <span className="text-[2rem]" style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}>
                    {card.reward}
                  </span>
                  <span className="text-[14px]" style={{ color: "var(--sh-ink-50)" }}>
                    {card.rewardText}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {card.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-[14px]" style={{ color: "var(--sh-ink-80)" }}>
                      <Check className="h-4 w-4 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={card.href}
                  className={
                    (card.popular ? LABEL : "text-[14px] font-medium") +
                    " flex items-center justify-center w-full px-6 py-3"
                  }
                  style={
                    card.popular
                      ? { color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }
                      : { color: INK, border: "0.5px solid var(--sh-ink-20)", borderRadius: "2px" }
                  }
                >
                  Apply Now
                  <ArrowRight className="h-4 w-4 ml-2" strokeWidth={1.25} />
                </Link>
              </div>
            ))}
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
                src="/images/stock/credit-card.jpg"
                alt="Hand tapping a card on a payment terminal"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-4">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                  Every Card Includes
                </span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                Premium benefits and protections
              </h2>
              <p className="text-[16px] leading-relaxed mb-10" style={{ color: "var(--sh-ink-80)" }}>
                Every card in our lineup carries the same baseline of protection and service, no
                matter which one you choose.
              </p>
              <div className="grid sm:grid-cols-2 gap-8">
                {BENEFITS.map((benefit) => {
                  const Icon = benefit.icon
                  return (
                    <div key={benefit.title}>
                      <Icon className="h-6 w-6 mb-3" strokeWidth={1.25} style={{ color: BRONZE }} />
                      <h3 className="text-[18px] font-medium mb-2" style={{ color: INK }}>
                        {benefit.title}
                      </h3>
                      <p className="text-[14px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
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

      {/* Modern Card Features */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                  Built For Today
                </span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                Modern card features
              </h2>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                Our cards are designed for the way you live today, with features that give you
                control and peace of mind.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {FEATURES.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check className="h-4 w-4 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                    <span className="text-[14px]" style={{ color: "var(--sh-ink-80)" }}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/online-payment.jpg"
                alt="Paying by card on a portable terminal"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* Apply in minutes */}
          <div
            className="max-w-xl mx-auto p-8"
            style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
          >
            <h3 className="text-[18px] font-medium mb-6" style={{ color: INK }}>
              Apply in minutes
            </h3>
            <div className="space-y-4 mb-8">
              {STEPS.map((step, i) => (
                <div key={step} className="flex items-center gap-4">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ border: "0.5px solid var(--sh-ink-20)" }}
                  >
                    <span style={{ fontFamily: MONO, fontWeight: 400, color: INK }} className="text-[13px]">
                      {i + 1}
                    </span>
                  </div>
                  <span className="text-[15px]" style={{ color: "var(--sh-ink-80)" }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/register"
              className={LABEL + " flex items-center justify-center w-full px-6 py-3.5"}
              style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
            >
              Check Your Eligibility
              <ArrowRight className="h-4 w-4 ml-2" strokeWidth={1.25} />
            </Link>
            <p className="text-[12px] text-center mt-4" style={{ color: "var(--sh-ink-50)" }}>
              No impact on your credit score
            </p>
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
            Ready to start earning?
          </h2>
          <p className="text-[16px] leading-relaxed mb-8 max-w-xl mx-auto" style={{ color: "var(--sh-linen-70)" }}>
            Apply now and get instant access to your virtual card.
          </p>
          <Link
            href="/register"
            className={LABEL + " inline-flex items-center px-7 py-3.5"}
            style={{ color: BRONZE, border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
          >
            Apply Now
            <ArrowRight className="h-4 w-4 ml-2" strokeWidth={1.25} />
          </Link>
        </div>
      </section>

    </>
  )
}
