import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import { getContactInfo } from "@/lib/contact"
import { ChatLink } from "@/components/shared/ChatLink"
import {
  MessageCircle,
  Phone,
  MessageSquare,
  Mail,
  FileText,
  CreditCard,
  Wallet,
  Shield,
  ArrowRight,
  Search,
  ChevronRight,
  AlertTriangle,
} from "lucide-react"

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI = "var(--sh-font-ui)"
const MONO = "var(--sh-font-mono)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"
const ERROR = "#B3261E"
const ERROR_BG = "#F7E8E6"

export const metadata: Metadata = {
  title: `Help & Support | ${BANK_NAME}`,
  description: `Get help with your ${BANK_NAME} account. Browse FAQs, contact support, or find answers to common questions.`,
}

const HELP_CATEGORIES = [
  {
    icon: Wallet,
    title: "Account & Profile",
    description: "Manage your account settings, update personal info, and more.",
    href: "/support/account",
    articles: 24,
  },
  {
    icon: CreditCard,
    title: "Cards & Payments",
    description: "Card activation, payments, transfers, and transaction issues.",
    href: "/support/payments",
    articles: 31,
  },
  {
    icon: Shield,
    title: "Security & Privacy",
    description: "Password reset, two-factor authentication, and fraud protection.",
    href: "/support/security",
    articles: 18,
  },
  {
    icon: FileText,
    title: "Statements & Documents",
    description: "Access statements, tax documents, and account records.",
    href: "/support/documents",
    articles: 12,
  },
]

const POPULAR_QUESTIONS = [
  { question: "How do I reset my password?", href: "/support/password-reset" },
  { question: "How do I activate my new card?", href: "/support/card-activation" },
  { question: "How do I set up direct deposit?", href: "/support/direct-deposit" },
  { question: "How do I dispute a transaction?", href: "/support/dispute" },
  { question: "How do I close my account?", href: "/support/close-account" },
  { question: "How do I update my address?", href: "/support/update-address" },
]

export default async function SupportPage() {
  const contact = await getContactInfo()

  const CONTACT_OPTIONS = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team",
      availability: "Available 24/7",
      action: "Start Chat",
      href: "#chat",
      primary: true,
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: `Call us at ${contact.phone}`,
      availability: "Mon-Fri, 8am-8pm ET",
      action: "Call Now",
      href: contact.phoneHref,
      primary: false,
    },
    {
      icon: MessageSquare,
      title: "Text Support",
      description: `Text a specialist at ${contact.textPhone}`,
      availability: "Speak directly or text with a specialist",
      action: "Text Us",
      href: contact.textHref,
      primary: false,
    },
    {
      icon: Mail,
      title: "Email Support",
      description: `Email us at ${contact.email}`,
      availability: "Response within 24 hours",
      action: "Send Email",
      href: contact.emailHref,
      primary: false,
    },
  ]

  return (
    <>
      {/* Hero */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Help Center</span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                How can we help you?
              </h1>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                Search our help center or browse categories below to find answers, or reach a member
                of our support team directly.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5"
                  strokeWidth={1.25}
                  style={{ color: "var(--sh-ink-50)" }}
                />
                <input
                  type="text"
                  placeholder="Search for help..."
                  style={{
                    backgroundColor: "var(--sh-surface)",
                    border: "0.5px solid var(--sh-ink-10)",
                    borderRadius: "2px",
                    color: INK,
                  }}
                  className="w-full pl-12 pr-4 py-3.5 text-[15px] focus:outline-none focus:border-[#A67C3D]"
                />
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
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-6">
            <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Browse Topics</span>
          </div>
          <h2
            className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
          >
            Browse by category
          </h2>
          <p className="text-[16px] leading-relaxed max-w-2xl mb-12" style={{ color: "var(--sh-ink-80)" }}>
            Find answers organized by topic.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HELP_CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <Link
                  key={category.title}
                  href={category.href}
                  className="group p-7 transition-colors"
                  style={{
                    backgroundColor: "var(--sh-linen)",
                    border: "0.5px solid var(--sh-ink-10)",
                    borderRadius: "8px",
                  }}
                >
                  <Icon className="h-6 w-6 mb-4" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <h3 className="text-[18px] font-medium mb-2" style={{ color: INK }}>
                    {category.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed mb-4" style={{ color: "var(--sh-ink-50)" }}>
                    {category.description}
                  </p>
                  <p className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                    {category.articles} articles
                  </p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Popular Questions + Contact */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>FAQ</span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                Popular questions
              </h2>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                Quick answers to the most common questions.
              </p>
              <div className="space-y-3">
                {POPULAR_QUESTIONS.map((item) => (
                  <Link
                    key={item.question}
                    href={item.href}
                    className="group flex items-center justify-between px-5 py-4 transition-colors"
                    style={{
                      backgroundColor: "var(--sh-surface)",
                      border: "0.5px solid var(--sh-ink-10)",
                      borderRadius: "8px",
                    }}
                  >
                    <span className="text-[15px]" style={{ color: INK }}>
                      {item.question}
                    </span>
                    <ChevronRight
                      className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1"
                      strokeWidth={1.25}
                      style={{ color: BRONZE }}
                    />
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact Options */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Reach Us</span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                Contact us
              </h2>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                Can&apos;t find what you&apos;re looking for? We&apos;re here to help.
              </p>
              <div className="space-y-4">
                {CONTACT_OPTIONS.map((option) => {
                  const Icon = option.icon
                  const rowClass = "flex items-center gap-4 px-5 py-4 transition-colors"
                  const rowStyle = {
                    backgroundColor: option.primary ? "var(--sh-bronze-10)" : "var(--sh-surface)",
                    border: option.primary
                      ? "0.5px solid " + BRONZE
                      : "0.5px solid var(--sh-ink-10)",
                    borderRadius: "8px",
                  }
                  const inner = (
                    <>
                      <Icon className="h-6 w-6 shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                      <div className="flex-1">
                        <p className="text-[15px] font-medium" style={{ color: INK }}>
                          {option.title}
                        </p>
                        <p className="text-[13px]" style={{ color: "var(--sh-ink-50)" }}>
                          {option.availability}
                        </p>
                      </div>
                      <span className={LABEL} style={{ color: option.primary ? "var(--sh-bronze-dark)" : INK }}>
                        {option.action}
                      </span>
                    </>
                  )
                  return option.href === "#chat" ? (
                    <ChatLink key={option.title} className={rowClass} style={rowStyle}>{inner}</ChatLink>
                  ) : (
                    <a key={option.title} href={option.href} className={rowClass} style={rowStyle}>{inner}</a>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Section */}
      <section style={{ backgroundColor: ERROR_BG, fontFamily: UI }} className="py-14 lg:py-16" >
        <div
          className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 border-y"
          style={{ borderColor: "var(--sh-ink-10)" }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-6 w-6 shrink-0 mt-1" strokeWidth={1.25} style={{ color: ERROR }} />
              <div>
                <h3 className="text-[18px] font-medium mb-1" style={{ color: INK }}>
                  Lost or stolen card?
                </h3>
                <p className="text-[15px]" style={{ color: "var(--sh-ink-80)" }}>
                  Report it immediately to prevent unauthorized use.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={contact.phoneHref}
                className={LABEL + " inline-flex items-center justify-center px-7 py-3.5"}
                style={{ color: ERROR, border: "0.5px solid " + ERROR, borderRadius: "2px" }}
              >
                <Phone className="h-4 w-4 mr-2" strokeWidth={1.25} />
                Call Emergency Line
              </a>
              <Link
                href="/security/fraud"
                className={LABEL + " inline-flex items-center justify-center px-7 py-3.5"}
                style={{ color: INK, border: "0.5px solid var(--sh-ink-20)", borderRadius: "2px" }}
              >
                Report Fraud Online
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section style={{ backgroundColor: "var(--sh-ink)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
              <span className={LABEL} style={{ color: "var(--sh-linen-50)" }}>Still Stuck?</span>
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            </div>
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: "var(--sh-linen)" }}
            >
              Still have questions?
            </h2>
            <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-linen-70)" }}>
              Our support team is available 24/7 to help you with anything you need.
            </p>
            <Link
              href="/contact"
              className={LABEL + " inline-flex items-center px-7 py-3.5"}
              style={{ color: BRONZE, border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
            >
              Contact Us
              <ArrowRight className="h-4 w-4 ml-2" strokeWidth={1.25} />
            </Link>
          </div>
        </div>
      </section>

    </>
  )
}
