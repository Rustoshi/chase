import Link from "next/link"
import Image from "next/image"
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Phone, MapPin, Check } from "lucide-react"
import { BANK_NAME, LEGAL_NAME } from "@/lib/brand"
import { getContactInfo } from "@/lib/contact"

/* Safe Haven Private — footer. design.md §5: ink background, linen text at
   50–100% opacity, bronze on hover. Hairline dividers, no shadows/fills. */

const INK   = "#17140F"
const BRONZE = "#A67C3D"
const UI_FONT = "var(--sh-font-ui)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

const FOOTER_LINKS = {
  products: {
    title: "Products",
    links: [
      { label: "Personal Accounts", href: "/accounts/personal" },
      { label: "Business Accounts", href: "/accounts/business" },
      { label: "Credit Cards", href: "/cards" },
      { label: "Personal Loans", href: "/loans/personal" },
      { label: "Business Loans", href: "/loans/business" },
      { label: "Fixed Deposits", href: "/deposits" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Compliance", href: "/compliance" },
      { label: "Licenses", href: "/licenses" },
    ],
  },
}

const SOCIAL_LINKS = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Youtube, href: "#", label: "YouTube" },
]

const TRUST_BADGES = ["FDIC Insured", "256-bit SSL", "PCI Compliant"]

export async function Footer() {
  const currentYear = new Date().getFullYear()
  const contact = await getContactInfo()

  return (
    <footer style={{ backgroundColor: INK, fontFamily: UI_FONT }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-16 pb-12">

        {/* Top: logo + description + contact / social */}
        <div
          className="grid lg:grid-cols-2 gap-12 pb-12"
          style={{ borderBottom: "0.5px solid var(--sh-linen-12)" }}
        >
          <div>
            <Link href="/" aria-label={BANK_NAME} className="inline-flex">
              <Image src="/images/logo.png" alt={BANK_NAME} width={256} height={128} className="h-7 w-auto" />
            </Link>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed" style={{ color: "var(--sh-linen-70)" }}>
              Private banking for a considered life — holding, moving, and growing your
              money with discipline, security, and restraint.
            </p>

            <div className="mt-7 space-y-3">
              <a href={contact.emailHref} className="flex items-center gap-3 text-[14px] sh-foot-link" style={{ color: "var(--sh-linen-70)" }}>
                <Mail className="h-4 w-4" strokeWidth={1.5} />
                <span>{contact.email}</span>
              </a>
              <a href={contact.phoneHref} className="flex items-center gap-3 text-[14px] sh-foot-link" style={{ color: "var(--sh-linen-70)" }}>
                <Phone className="h-4 w-4" strokeWidth={1.5} />
                <span>{contact.phone}</span>
              </a>
              <div className="flex items-center gap-3 text-[14px]" style={{ color: "var(--sh-linen-70)" }}>
                <MapPin className="h-4 w-4" strokeWidth={1.5} />
                <span>{contact.address}</span>
              </div>
            </div>
          </div>

          <div className="lg:pl-12">
            <h3 className={LABEL} style={{ color: "var(--sh-linen-50)" }}>Follow us</h3>
            <div className="mt-5 flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex h-10 w-10 items-center justify-center sh-foot-social"
                    style={{ border: "0.5px solid var(--sh-linen-12)", borderRadius: "2px", color: "var(--sh-linen-70)" }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* Link columns */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12"
          style={{ borderBottom: "0.5px solid var(--sh-linen-12)" }}
        >
          {Object.values(FOOTER_LINKS).map((section) => (
            <div key={section.title}>
              <h4 className={LABEL} style={{ color: "var(--sh-linen-50)" }}>{section.title}</h4>
              <ul className="mt-5 space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-[14px] sh-foot-link" style={{ color: "var(--sh-linen-70)" }}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust + regulatory */}
        <div className="pt-10">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {TRUST_BADGES.map((label) => (
              <span key={label} className="flex items-center gap-2 text-[13px]" style={{ color: "var(--sh-linen-70)" }}>
                <Check className="h-4 w-4" strokeWidth={1.5} style={{ color: BRONZE }} />
                {label}
              </span>
            ))}
          </div>

          <p className="mt-8 text-center text-[12px] leading-relaxed max-w-4xl mx-auto" style={{ color: "var(--sh-linen-50)" }}>
            {LEGAL_NAME} is a licensed financial institution regulated by the Financial Conduct Authority.
            Deposits are protected up to $250,000 by the Federal Deposit Insurance Corporation (FDIC).
            Banking services are provided by our partner banks. Investment products are not FDIC insured,
            not bank guaranteed, and may lose value.
          </p>

          <div
            className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6"
            style={{ borderTop: "0.5px solid var(--sh-linen-08)" }}
          >
            <p className="text-[13px]" style={{ color: "var(--sh-linen-50)" }}>
              © {currentYear} {BANK_NAME}. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Privacy", "Terms", "Cookies"].map((l) => (
                <Link
                  key={l}
                  href={`/${l.toLowerCase()}`}
                  className="text-[13px] sh-foot-link"
                  style={{ color: "var(--sh-linen-50)" }}
                >
                  {l}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
