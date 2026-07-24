import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import { getContactInfo } from "@/lib/contact"
import {
  ArrowRight,
  Download,
  Mail,
  Calendar,
  ExternalLink,
  FileText,
  Image as ImageIcon
} from "lucide-react"

const INK = '#17140F'
const BRONZE = '#A67C3D'
const DISPLAY = 'var(--sh-font-display)'
const UI = 'var(--sh-font-ui)'
const MONO = 'var(--sh-font-mono)'
const LABEL = 'text-[11px] uppercase tracking-[0.09em] font-medium'

export const metadata: Metadata = {
  title: `Press & Media | ${BANK_NAME}`,
  description: `${BANK_NAME} press releases, media resources, and company news. Contact our press team for inquiries.`,
}

const PRESS_RELEASES = [
  {
    date: "March 15, 2024",
    title: `${BANK_NAME} Raises $100M Series C to Expand Global Operations`,
    excerpt: "Funding will accelerate international expansion and product development as the company crosses 2 million customers.",
    href: "/press/series-c-funding",
  },
  {
    date: "February 28, 2024",
    title: `${BANK_NAME} Launches Business Banking Suite`,
    excerpt: "New suite of products designed for small and medium businesses includes checking, credit, and payroll services.",
    href: "/press/business-banking-launch",
  },
  {
    date: "January 10, 2024",
    title: `${BANK_NAME} Named Best Digital Bank of 2024`,
    excerpt: "Industry recognition for innovation in mobile banking and customer experience.",
    href: "/press/best-digital-bank-2024",
  },
  {
    date: "December 5, 2023",
    title: `${BANK_NAME} Crosses 2 Million Customer Milestone`,
    excerpt: "Rapid growth driven by word-of-mouth and industry-leading customer satisfaction scores.",
    href: "/press/2-million-customers",
  },
  {
    date: "October 20, 2023",
    title: `${BANK_NAME} Introduces High-Yield Savings at 4.50% APY`,
    excerpt: "New savings product offers one of the highest rates in the market with no minimum balance.",
    href: "/press/high-yield-savings",
  },
]

const MEDIA_COVERAGE = [
  {
    outlet: "TechCrunch",
    title: "How this fintech is disrupting traditional banking",
    date: "March 2024",
    href: "#",
  },
  {
    outlet: "Forbes",
    title: "The future of digital banking is here",
    date: "February 2024",
    href: "#",
  },
  {
    outlet: "Bloomberg",
    title: "Neobanks gain ground on traditional institutions",
    date: "January 2024",
    href: "#",
  },
  {
    outlet: "The Wall Street Journal",
    title: "Digital banks see surge in business accounts",
    date: "December 2023",
    href: "#",
  },
]

const BRAND_ASSETS = [
  {
    title: "Logo Package",
    description: "Primary and secondary logos in various formats",
    icon: ImageIcon,
    href: "/press/brand-assets/logos.zip",
  },
  {
    title: "Brand Guidelines",
    description: "Colors, typography, and usage guidelines",
    icon: FileText,
    href: "/press/brand-assets/guidelines.pdf",
  },
  {
    title: "Executive Photos",
    description: "High-resolution photos of leadership team",
    icon: ImageIcon,
    href: "/press/brand-assets/executives.zip",
  },
  {
    title: "Product Screenshots",
    description: "App and web interface screenshots",
    icon: ImageIcon,
    href: "/press/brand-assets/screenshots.zip",
  },
]

const COMPANY_FACTS = [
  { label: "Founded", value: "2019" },
  { label: "Headquarters", value: "New York, NY" },
  { label: "Customers", value: "2M+" },
  { label: "Team Size", value: "500+" },
  { label: "Funding Raised", value: "$200M" },
  { label: "Countries", value: "50+" },
]

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
      <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>{children}</span>
    </div>
  )
}

export default async function PressPage() {
  const contact = await getContactInfo()
  return (
    <>
      {/* Hero */}
      <section style={{ backgroundColor: 'var(--sh-linen)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <Eyebrow>Press &amp; Media</Eyebrow>
              <h1
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
                className="mt-5 text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08]"
              >
                News from {BANK_NAME}
              </h1>
              <p className="mt-6 text-[16px] leading-relaxed max-w-lg" style={{ color: 'var(--sh-ink-90)' }}>
                News, press releases, and media resources from {BANK_NAME}. For press
                inquiries, contact our media team.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <a
                  href={`mailto:${contact.email}`}
                  className={LABEL + ' inline-flex items-center gap-2 px-7 py-3.5'}
                  style={{ color: 'var(--sh-bronze-dark)', border: '0.5px solid ' + BRONZE, borderRadius: '2px' }}
                >
                  <Mail className="h-4 w-4" strokeWidth={1.25} />
                  Contact Press Team
                </a>
                <Link href="/press/all" className="text-[14px] inline-flex items-center gap-1" style={{ color: INK }}>
                  View all releases <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.25} />
                </Link>
              </div>
            </div>

            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: '8px', border: '0.5px solid var(--sh-ink-20)' }}
            >
              <Image
                src="/images/stock/skyline.jpg"
                alt="Frankfurt financial district skyline at dusk"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Company Facts */}
      <section style={{ backgroundColor: 'var(--sh-ink)', fontFamily: UI }} className="py-16">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {COMPANY_FACTS.map((fact) => (
              <div
                key={fact.label}
                className="text-center px-4 py-6"
                style={{ border: '0.5px solid var(--sh-linen-12)', borderRadius: '8px' }}
              >
                <p style={{ fontFamily: MONO, fontWeight: 400, color: BRONZE }} className="text-2xl mb-1">
                  {fact.value}
                </p>
                <p className={LABEL} style={{ color: 'var(--sh-linen-70)' }}>{fact.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section style={{ backgroundColor: 'var(--sh-linen)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-end justify-between gap-6 mb-12">
            <div>
              <Eyebrow>Newsroom</Eyebrow>
              <h2
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
                className="mt-5 text-[1.75rem] sm:text-[2rem] leading-[1.15]"
              >
                Press releases
              </h2>
            </div>
            <Link
              href="/press/all"
              className="hidden sm:inline-flex items-center text-[14px] gap-1"
              style={{ color: INK }}
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.25} />
            </Link>
          </div>

          <div className="space-y-5">
            {PRESS_RELEASES.map((release) => (
              <Link
                key={release.title}
                href={release.href}
                className="group block p-7"
                style={{ backgroundColor: 'var(--sh-surface)', border: '0.5px solid var(--sh-ink-10)', borderRadius: '8px' }}
              >
                <div className="flex items-center gap-2 text-[13px] mb-3" style={{ color: 'var(--sh-ink-50)' }}>
                  <Calendar className="h-4 w-4" strokeWidth={1.25} style={{ color: BRONZE }} />
                  {release.date}
                </div>
                <h3
                  className="text-[18px] mb-2 transition-colors"
                  style={{ fontWeight: 500, color: INK }}
                >
                  {release.title}
                </h3>
                <p className="text-[16px] leading-relaxed" style={{ color: 'var(--sh-ink-90)' }}>
                  {release.excerpt}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link href="/press/all" className="inline-flex items-center text-[14px] gap-1" style={{ color: INK }}>
              View all press releases
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.25} />
            </Link>
          </div>
        </div>
      </section>

      {/* Media Coverage */}
      <section style={{ backgroundColor: 'var(--sh-surface)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-14">
            <div>
              <Eyebrow>In the News</Eyebrow>
              <h2
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
                className="mt-5 text-[1.75rem] sm:text-[2rem] leading-[1.15]"
              >
                Recent media coverage
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed max-w-md" style={{ color: 'var(--sh-ink-90)' }}>
                Recent media coverage and features about {BANK_NAME}.
              </p>
            </div>
            <div
              className="relative overflow-hidden aspect-[16/9]"
              style={{ borderRadius: '8px', border: '0.5px solid var(--sh-ink-20)' }}
            >
              <Image
                src="/images/stock/city.jpg"
                alt="New York City skyline by day"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MEDIA_COVERAGE.map((article) => (
              <a
                key={article.title}
                href={article.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-6"
                style={{ backgroundColor: 'var(--sh-linen)', border: '0.5px solid var(--sh-ink-10)', borderRadius: '8px' }}
              >
                <p className={LABEL} style={{ color: 'var(--sh-bronze-dark)' }}>{article.outlet}</p>
                <h3 className="mt-3 mb-4 text-[16px]" style={{ fontWeight: 500, color: INK }}>
                  {article.title}
                </h3>
                <div className="flex items-center justify-between text-[13px]" style={{ color: 'var(--sh-ink-50)' }}>
                  <span>{article.date}</span>
                  <ExternalLink className="h-4 w-4" strokeWidth={1.25} />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Assets */}
      <section style={{ backgroundColor: 'var(--sh-linen)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-12">
            <div className="flex justify-center">
              <Eyebrow>Media Kit</Eyebrow>
            </div>
            <h2
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              className="mt-5 text-[1.75rem] sm:text-[2rem] leading-[1.15]"
            >
              Brand assets
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--sh-ink-90)' }}>
              Download logos, brand guidelines, and media resources.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BRAND_ASSETS.map((asset) => {
              const Icon = asset.icon
              return (
                <a
                  key={asset.title}
                  href={asset.href}
                  className="group p-7"
                  style={{ backgroundColor: 'var(--sh-surface)', border: '0.5px solid var(--sh-ink-10)', borderRadius: '8px' }}
                >
                  <Icon className="h-6 w-6 mb-4" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <h3 className="text-[18px] mb-1" style={{ fontWeight: 500, color: INK }}>
                    {asset.title}
                  </h3>
                  <p className="text-[14px] mb-5" style={{ color: 'var(--sh-ink-50)' }}>
                    {asset.description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-[14px]" style={{ color: 'var(--sh-bronze-dark)' }}>
                    <Download className="h-4 w-4" strokeWidth={1.25} />
                    Download
                  </span>
                </a>
              )
            })}
          </div>
        </div>
      </section>

      {/* Press Contact */}
      <section style={{ backgroundColor: 'var(--sh-ink)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div
              className="relative overflow-hidden aspect-[4/3] order-2 lg:order-1"
              style={{ borderRadius: '8px', border: '0.5px solid var(--sh-linen-12)' }}
            >
              <Image
                src="/images/stock/support-headset.jpg"
                alt="Media relations contact microphone"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3">
                <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: 'var(--sh-linen-70)' }}>Get in touch</span>
              </div>
              <h2
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: 'var(--sh-linen)' }}
                className="mt-5 text-[1.75rem] sm:text-[2rem] leading-[1.15]"
              >
                Press inquiries
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed max-w-md" style={{ color: 'var(--sh-linen-70)' }}>
                For press inquiries, interview requests, or additional information,
                please contact our media relations team.
              </p>

              <div className="mt-8 p-6 flex items-center gap-4" style={{ border: '0.5px solid var(--sh-linen-12)', borderRadius: '8px' }}>
                <Mail className="h-6 w-6 shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                <div>
                  <p className="text-[15px]" style={{ fontWeight: 500, color: 'var(--sh-linen)' }}>Media Relations</p>
                  <a href={`mailto:${contact.email}`} className="text-[14px]" style={{ color: BRONZE }}>
                    {contact.email}
                  </a>
                </div>
              </div>
              <p className="mt-4 text-[13px]" style={{ color: 'var(--sh-linen-50)' }}>
                We typically respond to press inquiries within 24 hours.
              </p>

              <a
                href={`mailto:${contact.email}`}
                className={LABEL + ' inline-flex items-center gap-2 px-7 py-3.5 mt-8'}
                style={{ color: BRONZE, border: '0.5px solid ' + BRONZE, borderRadius: '2px' }}
              >
                <Mail className="h-4 w-4" strokeWidth={1.25} />
                Email Press Team
              </a>
            </div>
          </div>
        </div>
      </section>

    </>
  )
}
