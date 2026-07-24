import Image from "next/image"
import {
  Wallet,
  CreditCard,
  Landmark,
  PiggyBank,
  ArrowLeftRight,
  ShieldCheck,
} from "lucide-react"

/* Safe Haven Private — features grid. Linen section, surface cards defined by
   hairline (not shadow), Newsreader heading, line icons without tiles. */

const INK     = "#17140F"
const BRONZE  = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI_FONT = "var(--sh-font-ui)"
const LABEL   = "text-[11px] uppercase tracking-[0.09em] font-medium"

const FEATURES = [
  { icon: Wallet,        title: "Accounts",     description: "Open checking and savings accounts in minutes, and manage them all from one considered dashboard." },
  { icon: CreditCard,    title: "Cards",        description: "Apply for debit and credit cards with competitive rates and instant virtual card access." },
  { icon: Landmark,      title: "Loans",        description: "Personal and business lending with flexible terms, quick decisions, and transparent rates." },
  { icon: PiggyBank,     title: "Deposits",     description: "Fixed and recurring deposit options that grow your savings with guaranteed returns." },
  { icon: ArrowLeftRight,title: "Transfers",    description: "Send money locally or internationally. Fast, secure, and low-fee movement of funds." },
  { icon: ShieldCheck,   title: "Verification", description: "Complete your KYC in minutes. Upload documents and get verified the same day." },
]

export function FeaturesGrid() {
  return (
    <section
      className="py-20 lg:py-24"
      style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI_FONT }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3">
            <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>What we offer</span>
          </div>
          <h2
            className="mt-5 text-[1.75rem] sm:text-[2rem] leading-[1.15]"
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
          >
            Everything in one considered place
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed" style={{ color: "var(--sh-ink-80, #17140FCC)" }}>
            The tools to hold, move, and grow your money, disciplined, secure, and quietly capable.
          </p>
        </div>

        {/* Showcase band */}
        <div
          className="mt-14 relative overflow-hidden aspect-[16/9] sm:aspect-[16/7]"
          style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
        >
          <Image
            src="/images/stock/team-collaboration.jpg"
            alt="A Safe Haven team collaborating in the office"
            fill
            sizes="(max-width: 1024px) 100vw, 1152px"
            className="object-cover"
          />
        </div>

        {/* Grid */}
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="p-7 transition-colors duration-200"
                style={{
                  backgroundColor: "var(--sh-surface)",
                  border: "0.5px solid var(--sh-ink-10)",
                  borderRadius: "8px",
                }}
              >
                <Icon className="h-6 w-6" strokeWidth={1.25} style={{ color: BRONZE }} />
                <h3 className="mt-5 text-[18px]" style={{ fontWeight: 500, color: INK }}>
                  {feature.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "var(--sh-ink-80, #17140FCC)" }}>
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
