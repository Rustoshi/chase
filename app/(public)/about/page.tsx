import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME, LEGAL_NAME } from "@/lib/brand"
import {
  Users,
  Target,
  Heart,
  Globe,
  Award,
} from "lucide-react"

const INK = '#17140F'
const BRONZE = '#A67C3D'
const DISPLAY = 'var(--sh-font-display)' // Newsreader — headings only
const UI = 'var(--sh-font-ui)'           // General Sans — body/UI/buttons
const MONO = 'var(--sh-font-mono)'       // Spline Sans Mono — figures/amounts/rates
const LABEL = 'text-[11px] uppercase tracking-[0.09em] font-medium'

export const metadata: Metadata = {
  title: `About Us | ${BANK_NAME}`,
  description: `Learn about ${BANK_NAME}'s mission to make banking simple, secure, and accessible for everyone.`,
}

const VALUES = [
  {
    icon: Users,
    title: "Customer First",
    description: "Every decision we make starts with our customers. We build products that solve real problems and make banking easier.",
  },
  {
    icon: Target,
    title: "Simplicity",
    description: "Banking shouldn't be complicated. We strip away the jargon and complexity to deliver a straightforward experience.",
  },
  {
    icon: Heart,
    title: "Transparency",
    description: "No hidden fees, no surprises. We believe in being upfront about everything, from pricing to how we use your data.",
  },
  {
    icon: Globe,
    title: "Accessibility",
    description: "Everyone deserves access to quality financial services. We're building banking that works for all.",
  },
]

const MILESTONES = [
  { year: "2019", title: "Founded", description: "Started with a mission to reimagine banking" },
  { year: "2020", title: "100K Customers", description: "Reached our first major milestone" },
  { year: "2021", title: "Series B Funding", description: "Raised $50M to accelerate growth" },
  { year: "2022", title: "1M Customers", description: "Crossed one million happy customers" },
  { year: "2023", title: "Business Banking", description: "Launched products for businesses" },
  { year: "2024", title: "Global Expansion", description: "Expanded to serve customers worldwide" },
]

const STATS = [
  { value: "2M+", label: "Customers" },
  { value: "$10B+", label: "Assets managed" },
  { value: "50+", label: "Countries served" },
  { value: "500+", label: "Team members" },
]

const AWARDS = [
  "Best Digital Bank 2024",
  "Top Fintech Startup",
  "Customer Choice Award",
  "Innovation in Banking",
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section style={{ backgroundColor: 'var(--sh-linen)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>About {BANK_NAME}</span>
              </div>
              <h1
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
              >
                Banking for the modern world
              </h1>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: 'var(--sh-ink-80)' }}>
                We're on a mission to make banking simple, secure, and accessible for everyone.
                No hidden fees, no complicated processes, just banking that works.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/register"
                  className={LABEL + ' inline-flex items-center px-7 py-3.5'}
                  style={{ color: 'var(--sh-bronze-dark)', border: '0.5px solid ' + BRONZE, borderRadius: '2px' }}
                >
                  Open an account
                </Link>
                <a href="#story" className="text-[14px]" style={{ color: INK }}>
                  Read our story →
                </a>
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: '8px', border: '0.5px solid var(--sh-ink-20)' }}
            >
              <Image
                src="/images/stock/corporate-meeting.jpg"
                alt="Executives in a bright glass conference room discussing strategy"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats band — dark anchor */}
      <section style={{ backgroundColor: 'var(--sh-ink)', fontFamily: UI }} className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-10">
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="text-center px-4"
                style={{ borderLeft: i % 2 === 0 ? 'none' : '0.5px solid var(--sh-linen-12)' }}
              >
                <p
                  style={{ fontFamily: MONO, fontWeight: 400, color: 'var(--sh-linen)' }}
                  className="text-3xl sm:text-4xl mb-2"
                >
                  {stat.value}
                </p>
                <p className={LABEL} style={{ color: 'var(--sh-linen-50)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our story */}
      <section id="story" style={{ backgroundColor: 'var(--sh-surface)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1 relative overflow-hidden aspect-[4/3]" style={{ borderRadius: '8px', border: '0.5px solid var(--sh-ink-20)' }}>
              <Image
                src="/images/stock/boardroom.jpg"
                alt="Three colleagues in suits reviewing documents around a table"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>Since our founding</span>
              </div>
              <h2 style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }} className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-6">
                Our story
              </h2>
              <div className="space-y-4 text-[16px] leading-relaxed" style={{ color: 'var(--sh-ink-80)' }}>
                <p>
                  {BANK_NAME} was founded with a simple belief: banking should be easy,
                  transparent, and accessible to everyone. We saw an industry stuck in the
                  past, with hidden fees, confusing terms, and outdated technology.
                </p>
                <p>
                  We set out to build something different. A bank that puts customers first,
                  uses technology to simplify the complex, and treats people with respect.
                </p>
                <p>
                  Today, {LEGAL_NAME} serves millions of customers who trust us with their money.
                  But we're just getting started. Our mission is to build the bank we
                  always wished existed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ backgroundColor: 'var(--sh-linen)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-6">
            <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>What guides us</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
            <h2 style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }} className="text-[1.75rem] sm:text-[2rem] leading-[1.15]">
              Our values
            </h2>
            <p className="text-[16px] leading-relaxed max-w-md" style={{ color: 'var(--sh-ink-50)' }}>
              The principles that guide everything we do.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((value) => {
              const Icon = value.icon
              return (
                <div
                  key={value.title}
                  style={{ backgroundColor: 'var(--sh-surface)', border: '0.5px solid var(--sh-ink-10)', borderRadius: '8px' }}
                  className="p-7"
                >
                  <Icon className="h-6 w-6 mb-5" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <h3 className="text-[18px] font-medium mb-2" style={{ color: INK }}>
                    {value.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed" style={{ color: 'var(--sh-ink-50)' }}>
                    {value.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Journey / timeline */}
      <section style={{ backgroundColor: 'var(--sh-surface)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-6">
            <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>Milestones</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-14">
            <h2 style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }} className="text-[1.75rem] sm:text-[2rem] leading-[1.15]">
              Our journey
            </h2>
            <p className="text-[16px] leading-relaxed max-w-md" style={{ color: 'var(--sh-ink-50)' }}>
              Key milestones in our mission to transform banking.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {MILESTONES.map((milestone) => (
              <div key={milestone.year} className="pt-6" style={{ borderTop: '0.5px solid var(--sh-ink-20)' }}>
                <p style={{ fontFamily: MONO, fontWeight: 400, color: 'var(--sh-bronze-dark)' }} className="text-[15px] mb-2">
                  {milestone.year}
                </p>
                <h3 className="text-[18px] font-medium mb-1" style={{ color: INK }}>{milestone.title}</h3>
                <p className="text-[15px] leading-relaxed" style={{ color: 'var(--sh-ink-50)' }}>{milestone.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recognition */}
      <section style={{ backgroundColor: 'var(--sh-linen)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>Recognition</span>
              </div>
              <h2 style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }} className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4">
                We're honored to be recognized
              </h2>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: 'var(--sh-ink-80)' }}>
                For our work building a bank that puts people first.
              </p>
              <div>
                {AWARDS.map((award, i) => (
                  <div
                    key={award}
                    className="flex items-center gap-4 py-4"
                    style={{ borderTop: i === 0 ? '0.5px solid var(--sh-ink-10)' : undefined, borderBottom: '0.5px solid var(--sh-ink-10)' }}
                  >
                    <Award className="h-6 w-6 shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                    <p className="text-[16px] font-medium" style={{ color: INK }}>{award}</p>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[5/4]"
              style={{ borderRadius: '8px', border: '0.5px solid var(--sh-ink-20)' }}
            >
              <Image
                src="/images/stock/skyline.jpg"
                alt="Financial-district skyline at dusk"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA — dark anchor */}
      <section style={{ backgroundColor: 'var(--sh-ink)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <h2 style={{ fontFamily: DISPLAY, fontWeight: 300, color: 'var(--sh-linen)' }} className="text-[2rem] sm:text-[2.5rem] leading-[1.15] mb-4">
            Join us on our mission
          </h2>
          <p className="text-[16px] leading-relaxed mb-10 max-w-xl mx-auto" style={{ color: 'var(--sh-linen-70)' }}>
            Experience banking that puts you first. Open your account today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/register"
              className={LABEL + ' inline-flex items-center px-7 py-3.5'}
              style={{ color: BRONZE, border: '0.5px solid ' + BRONZE, borderRadius: '2px' }}
            >
              Open account
            </Link>
            <Link href="/careers" className="text-[14px]" style={{ color: 'var(--sh-linen-70)' }}>
              Join our team →
            </Link>
          </div>
        </div>
      </section>

    </>
  )
}
