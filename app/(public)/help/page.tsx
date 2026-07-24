import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import { getContactInfo } from "@/lib/contact"
import { ChatLink } from "@/components/shared/ChatLink"
import {
  Search,
  Wallet,
  CreditCard,
  Shield,
  FileText,
  Users,
  Settings,
  ChevronRight,
  Phone,
  MessageCircle,
  Mail,
  ArrowRight,
  PlayCircle,
} from "lucide-react"

export const metadata: Metadata = {
  title: `Help Center | ${BANK_NAME}`,
  description: `Find answers to common questions about your ${BANK_NAME} account, cards, payments, and more.`,
}

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI = "var(--sh-font-ui)"
const MONO = "var(--sh-font-mono)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

const CATEGORIES = [
  {
    icon: Wallet,
    title: "Account Management",
    description: "Opening, closing, and managing your accounts",
    articles: 24,
    href: "/help/account",
    topics: ["Open an account", "Close account", "Account settings", "Statements"],
  },
  {
    icon: CreditCard,
    title: "Cards & Payments",
    description: "Debit cards, credit cards, and transactions",
    articles: 31,
    href: "/help/cards",
    topics: ["Activate card", "Report lost card", "Disputes", "Limits"],
  },
  {
    icon: Shield,
    title: "Security & Privacy",
    description: "Protecting your account and data",
    articles: 18,
    href: "/help/security",
    topics: ["Password reset", "Two-factor auth", "Fraud alerts", "Privacy"],
  },
  {
    icon: FileText,
    title: "Statements & Documents",
    description: "Tax forms, statements, and records",
    articles: 12,
    href: "/help/documents",
    topics: ["Download statements", "Tax documents", "Account history"],
  },
  {
    icon: Users,
    title: "Transfers & Payments",
    description: "Sending and receiving money",
    articles: 22,
    href: "/help/transfers",
    topics: ["Wire transfers", "Direct deposit", "Bill pay", "International"],
  },
  {
    icon: Settings,
    title: "App & Technical",
    description: "Mobile app and technical support",
    articles: 15,
    href: "/help/technical",
    topics: ["App issues", "Login problems", "Notifications", "Updates"],
  },
]

const POPULAR_ARTICLES = [
  { title: "How do I reset my password?", href: "/help/password-reset", views: "12.5K" },
  { title: "How do I activate my new card?", href: "/help/card-activation", views: "10.2K" },
  { title: "How do I set up direct deposit?", href: "/help/direct-deposit", views: "8.7K" },
  { title: "How do I dispute a transaction?", href: "/help/dispute-transaction", views: "7.3K" },
  { title: "How do I enable two-factor authentication?", href: "/help/2fa-setup", views: "6.8K" },
  { title: "How do I update my address?", href: "/help/update-address", views: "5.4K" },
  { title: "How do I download my statements?", href: "/help/download-statements", views: "4.9K" },
  { title: "How do I report a lost or stolen card?", href: "/help/lost-card", views: "4.2K" },
]

const QUICK_LINKS = [
  { title: "Reset Password", href: "/help/password-reset", icon: Shield },
  { title: "Activate Card", href: "/help/card-activation", icon: CreditCard },
  { title: "Report Fraud", href: "/security/fraud", icon: Shield },
  { title: "Contact Support", href: "/contact", icon: MessageCircle },
]

const VIDEOS = [
  { title: "Getting Started with Your Account", duration: "3:45" },
  { title: "Setting Up Direct Deposit", duration: "2:30" },
  { title: "Using the Mobile App", duration: "4:15" },
]

export default async function HelpCenterPage() {
  const contact = await getContactInfo()
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
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
              >
                How can we help?
              </h1>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                Search our knowledge base or browse categories below to find answers about
                your account, cards, payments, and more.
              </p>

              {/* Search */}
              <div className="relative max-w-xl mb-6">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5"
                  strokeWidth={1.25}
                  style={{ color: "var(--sh-ink-50)" }}
                />
                <input
                  type="text"
                  placeholder="Search for help articles..."
                  style={{
                    backgroundColor: "var(--sh-surface)",
                    border: "0.5px solid var(--sh-ink-10)",
                    borderRadius: "2px",
                    color: INK,
                  }}
                  className="w-full pl-12 pr-4 py-3.5 text-[15px] focus:outline-none focus:border-[#A67C3D]"
                />
              </div>

              {/* Quick links */}
              <div className="flex flex-wrap items-center gap-3">
                {QUICK_LINKS.map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.title}
                      href={link.href}
                      style={{ border: "0.5px solid var(--sh-ink-20)", borderRadius: "2px", color: INK }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-[13px] hover:border-[#A67C3D] transition-colors"
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.25} style={{ color: BRONZE }} />
                      {link.title}
                    </Link>
                  )
                })}
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

      {/* Categories */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-4">
            <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Browse</span>
          </div>
          <h2
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
          >
            Browse by category
          </h2>
          <p className="text-[16px] leading-relaxed mb-12 max-w-2xl" style={{ color: "var(--sh-ink-80)" }}>
            Find answers organized by topic.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((category) => {
              const Icon = category.icon
              return (
                <Link
                  key={category.title}
                  href={category.href}
                  style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                  className="group p-7 hover:border-[#A67C3D] transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <Icon className="h-6 w-6" strokeWidth={1.25} style={{ color: BRONZE }} />
                    <span style={{ fontFamily: MONO, color: "var(--sh-ink-50)" }} className="text-[13px]">
                      {category.articles} articles
                    </span>
                  </div>
                  <h3 className="text-[18px] font-medium mb-2" style={{ color: INK }}>
                    {category.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed mb-4" style={{ color: "var(--sh-ink-50)" }}>
                    {category.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {category.topics.map((topic) => (
                      <span
                        key={topic}
                        style={{ border: "0.5px solid var(--sh-ink-10)", borderRadius: "2px", color: "var(--sh-ink-50)" }}
                        className="px-2 py-1 text-[12px]"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Popular articles + Contact panel */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Popular articles list */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Most viewed</span>
              </div>
              <h2
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              >
                Popular articles
              </h2>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                The most viewed help articles this month.
              </p>
              <div>
                {POPULAR_ARTICLES.map((article, index) => (
                  <Link
                    key={article.title}
                    href={article.href}
                    style={{ borderTop: index === 0 ? "0.5px solid var(--sh-ink-10)" : undefined, borderBottom: "0.5px solid var(--sh-ink-10)" }}
                    className="group flex items-center justify-between py-4 hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center gap-4">
                      <span style={{ fontFamily: MONO, color: BRONZE }} className="text-[13px] w-6">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[15px]" style={{ color: INK }}>
                        {article.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span style={{ fontFamily: MONO, color: "var(--sh-ink-50)" }} className="text-[13px] hidden sm:block">
                        {article.views}
                      </span>
                      <ChevronRight className="h-4 w-4" strokeWidth={1.25} style={{ color: BRONZE }} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact support panel */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Still need help?</span>
              </div>
              <h2
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              >
                Reach our support team
              </h2>
              <p className="text-[16px] leading-relaxed mb-6" style={{ color: "var(--sh-ink-80)" }}>
                Our support team is available 24/7 to assist you.
              </p>

              <div
                className="relative overflow-hidden aspect-[5/4] mb-6"
                style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
              >
                <Image
                  src="/images/stock/reception.jpg"
                  alt="A Safe Haven Private support specialist ready to assist over the phone"
                  fill
                  sizes="(max-width:1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              <div className="space-y-3">
                <ChatLink
                  style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                  className="flex items-center gap-4 p-5 hover:border-[#A67C3D] transition-colors"
                >
                  <MessageCircle className="h-6 w-6 shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <div className="flex-1">
                    <p className="text-[15px] font-medium" style={{ color: INK }}>Live Chat</p>
                    <p className="text-[13px]" style={{ color: "var(--sh-ink-50)" }}>Get instant help from our team</p>
                  </div>
                  <span className={LABEL} style={{ color: "var(--sh-bronze-dark)" }}>Online</span>
                </ChatLink>
                <a
                  href={contact.phoneHref}
                  style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                  className="flex items-center gap-4 p-5 hover:border-[#A67C3D] transition-colors"
                >
                  <Phone className="h-6 w-6 shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <div className="flex-1">
                    <p className="text-[15px] font-medium" style={{ color: INK }}>Phone Support</p>
                    <p style={{ fontFamily: MONO, color: "var(--sh-ink-50)" }} className="text-[13px]">{contact.phone}</p>
                  </div>
                  <span className="text-[12px]" style={{ color: "var(--sh-ink-50)" }}>Mon&ndash;Fri, 8am&ndash;8pm</span>
                </a>
                <a
                  href={contact.textHref}
                  style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                  className="flex items-center gap-4 p-5 hover:border-[#A67C3D] transition-colors"
                >
                  <MessageCircle className="h-6 w-6 shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <div className="flex-1">
                    <p className="text-[15px] font-medium" style={{ color: INK }}>Text Support</p>
                    <p style={{ fontFamily: MONO, color: "var(--sh-ink-50)" }} className="text-[13px]">{contact.textPhone}</p>
                  </div>
                  <span className="text-[12px]" style={{ color: "var(--sh-ink-50)" }}>Text a specialist</span>
                </a>
                <a
                  href={contact.emailHref}
                  style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                  className="flex items-center gap-4 p-5 hover:border-[#A67C3D] transition-colors"
                >
                  <Mail className="h-6 w-6 shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <div className="flex-1">
                    <p className="text-[15px] font-medium" style={{ color: INK }}>Email Support</p>
                    <p className="text-[13px]" style={{ color: "var(--sh-ink-50)" }}>{contact.email}</p>
                  </div>
                  <span className="text-[12px]" style={{ color: "var(--sh-ink-50)" }}>Within 24 hours</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video tutorials */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-4">
            <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Watch &amp; learn</span>
          </div>
          <h2
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
          >
            Video tutorials
          </h2>
          <p className="text-[16px] leading-relaxed mb-12 max-w-2xl" style={{ color: "var(--sh-ink-80)" }}>
            Watch step-by-step guides on how to use {BANK_NAME}.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VIDEOS.map((video) => (
              <div
                key={video.title}
                style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                className="group overflow-hidden cursor-pointer hover:border-[#A67C3D] transition-colors"
              >
                <div
                  className="aspect-video flex items-center justify-center"
                  style={{ backgroundColor: "var(--sh-bronze-10)" }}
                >
                  <PlayCircle className="h-12 w-12" strokeWidth={1} style={{ color: BRONZE }} />
                </div>
                <div className="p-5">
                  <h3 className="text-[15px] font-medium mb-1" style={{ color: INK }}>{video.title}</h3>
                  <p style={{ fontFamily: MONO, color: "var(--sh-ink-50)" }} className="text-[13px]">{video.duration}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/help/videos"
              className="inline-flex items-center gap-1 text-[14px] hover:gap-2 transition-all"
              style={{ color: INK }}
            >
              View all tutorials
              <ArrowRight className="h-4 w-4" strokeWidth={1.25} />
            </Link>
          </div>
        </div>
      </section>

    </>
  )
}
