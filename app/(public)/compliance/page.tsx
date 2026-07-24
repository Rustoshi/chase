import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME, LEGAL_NAME } from "@/lib/brand"
import { getContactInfo } from "@/lib/contact"
import {
  Shield,
  FileText,
  Scale,
  Building2,
  CheckCircle,
  ArrowRight,
} from "lucide-react"

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)" // Newsreader — headings only
const UI = "var(--sh-font-ui)" // General Sans — body/UI/buttons
const MONO = "var(--sh-font-mono)" // Spline Sans Mono — figures/amounts/rates
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

export const metadata: Metadata = {
  title: `Compliance | ${BANK_NAME}`,
  description: `Learn about ${BANK_NAME}'s regulatory compliance, licenses, and commitment to financial regulations.`,
}

const REGULATIONS = [
  {
    title: "Bank Secrecy Act (BSA)",
    description:
      "We maintain comprehensive anti-money laundering (AML) programs to detect and prevent financial crimes.",
    icon: Shield,
  },
  {
    title: "USA PATRIOT Act",
    description:
      "We verify customer identities and monitor transactions to prevent terrorism financing.",
    icon: Shield,
  },
  {
    title: "Gramm-Leach-Bliley Act (GLBA)",
    description:
      "We protect customer financial information and provide privacy notices as required.",
    icon: FileText,
  },
  {
    title: "Electronic Fund Transfer Act (EFTA)",
    description:
      "We provide disclosures and error resolution procedures for electronic transfers.",
    icon: FileText,
  },
  {
    title: "Truth in Savings Act (TISA)",
    description:
      "We provide clear disclosures about deposit account terms and interest rates.",
    icon: Scale,
  },
  {
    title: "Fair Credit Reporting Act (FCRA)",
    description:
      "We handle consumer credit information responsibly and provide required disclosures.",
    icon: Scale,
  },
]

const CERTIFICATIONS = [
  {
    name: "FDIC Member",
    description: "Deposits insured up to $250,000 per depositor",
    icon: Building2,
  },
  {
    name: "SOC 2 Type II",
    description: "Certified security, availability, and confidentiality controls",
    icon: Shield,
  },
  {
    name: "PCI DSS Level 1",
    description: "Highest level of payment card industry compliance",
    icon: CheckCircle,
  },
  {
    name: "ISO 27001",
    description: "International standard for information security management",
    icon: CheckCircle,
  },
]

const COMMITMENTS = [
  {
    title: "Anti-Money Laundering",
    description:
      "We maintain robust AML programs including customer due diligence, transaction monitoring, and suspicious activity reporting.",
  },
  {
    title: "Know Your Customer",
    description:
      "We verify the identity of all customers and monitor accounts for unusual activity to prevent fraud and financial crimes.",
  },
  {
    title: "Consumer Protection",
    description:
      "We comply with all consumer protection regulations and provide clear, transparent information about our products and services.",
  },
  {
    title: "Data Privacy",
    description:
      "We protect customer data in accordance with applicable privacy laws and maintain strict data security standards.",
  },
  {
    title: "Fair Lending",
    description:
      "We provide equal access to credit and do not discriminate based on race, color, religion, national origin, sex, marital status, or age.",
  },
  {
    title: "Accessibility",
    description:
      "We strive to make our services accessible to all customers, including those with disabilities, in compliance with ADA requirements.",
  },
]

const REGULATORS = [
  {
    name: "Federal Deposit Insurance Corporation (FDIC)",
    description: "Primary federal regulator for deposit insurance",
  },
  {
    name: "State Banking Department",
    description: "State-level examination and supervision",
  },
  {
    name: "Consumer Financial Protection Bureau (CFPB)",
    description: "Consumer protection oversight",
  },
]

const RELATED_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Security", href: "/security" },
  { label: "Licenses", href: "/licenses" },
]

function Eyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
      <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
        {label}
      </span>
    </div>
  )
}

export default async function CompliancePage() {
  const contact = await getContactInfo()
  return (
    <>
      {/* Hero */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <Eyebrow label="Regulatory Compliance" />
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mt-5 mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                Committed to compliance
              </h1>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                {BANK_NAME} is committed to operating in full compliance with all applicable
                laws and regulations. We maintain the highest standards of integrity and
                transparency in all our operations.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <a
                  href={contact.compliance.href}
                  className={LABEL + " inline-flex items-center px-7 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                >
                  Contact compliance team
                </a>
                <a href="#certifications" className="text-[14px]" style={{ color: INK }}>
                  View certifications &rarr;
                </a>
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/office-architecture.jpg"
                alt="Cluster of modern corporate glass towers representing the regulatory institutions we answer to"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section id="certifications" style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <Eyebrow label="Certifications" />
          <h2
            className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mt-5 mb-12"
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
          >
            Independently verified
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CERTIFICATIONS.map((cert) => {
              const Icon = cert.icon
              return (
                <div
                  key={cert.name}
                  style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                  className="p-7"
                >
                  <Icon className="h-6 w-6 mb-4" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <h3 className="text-[18px] font-medium mb-1" style={{ color: INK }}>
                    {cert.name}
                  </h3>
                  <p className="text-[14px] leading-relaxed" style={{ color: "var(--sh-ink-50)" }}>
                    {cert.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Regulatory Framework */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <Eyebrow label="Regulatory Framework" />
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-5 mb-12">
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15]"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            >
              Laws we comply with
            </h2>
            <p className="text-[16px] leading-relaxed max-w-md" style={{ color: "var(--sh-ink-80)" }}>
              We comply with all applicable federal and state banking regulations.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {REGULATIONS.map((reg) => {
              const Icon = reg.icon
              return (
                <div
                  key={reg.title}
                  style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                  className="p-7"
                >
                  <Icon className="h-6 w-6 mb-4" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <h3 className="text-[18px] font-medium mb-2" style={{ color: INK }}>
                    {reg.title}
                  </h3>
                  <p className="text-[14px] leading-relaxed" style={{ color: "var(--sh-ink-50)" }}>
                    {reg.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Our Commitments */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <Eyebrow label="Our Commitments" />
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-5 mb-12">
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15]"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            >
              Beyond minimum requirements
            </h2>
            <p className="text-[16px] leading-relaxed max-w-md" style={{ color: "var(--sh-ink-80)" }}>
              We go beyond minimum requirements to ensure the highest standards of compliance.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {COMMITMENTS.map((commitment) => (
              <div
                key={commitment.title}
                style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                className="p-7"
              >
                <CheckCircle className="h-6 w-6 mb-4" strokeWidth={1.25} style={{ color: BRONZE }} />
                <h3 className="text-[18px] font-medium mb-2" style={{ color: INK }}>
                  {commitment.title}
                </h3>
                <p className="text-[14px] leading-relaxed" style={{ color: "var(--sh-ink-50)" }}>
                  {commitment.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Regulatory Oversight + Report a Concern */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <Eyebrow label="Oversight" />
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mt-5 mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                Regulatory oversight
              </h2>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                {LEGAL_NAME} is subject to examination and supervision by federal and
                state banking regulators. We maintain open communication with our
                regulators and promptly address any concerns.
              </p>
              <div className="space-y-0">
                {REGULATORS.map((reg, i) => (
                  <div
                    key={reg.name}
                    className="py-5"
                    style={{ borderTop: i === 0 ? "0.5px solid var(--sh-ink-10)" : undefined, borderBottom: "0.5px solid var(--sh-ink-10)" }}
                  >
                    <h4 className="text-[15px] font-medium mb-1" style={{ color: INK }}>
                      {reg.name}
                    </h4>
                    <p className="text-[14px]" style={{ color: "var(--sh-ink-50)" }}>
                      {reg.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }} className="p-8">
              <h3 className="text-[18px] font-medium mb-4" style={{ color: INK }}>
                Report a concern
              </h3>
              <p className="text-[16px] leading-relaxed mb-6" style={{ color: "var(--sh-ink-80)" }}>
                If you have concerns about our compliance practices or wish to report
                potential violations, please contact our compliance team.
              </p>
              <div className="space-y-5">
                <div>
                  <p className={LABEL + " mb-1"} style={{ color: "var(--sh-ink-50)" }}>
                    Email
                  </p>
                  <a
                    href={contact.compliance.href}
                    className="text-[15px]"
                    style={{ color: "var(--sh-bronze-dark)" }}
                  >
                    {contact.compliance.address}
                  </a>
                </div>
                <div>
                  <p className={LABEL + " mb-1"} style={{ color: "var(--sh-ink-50)" }}>
                    Phone
                  </p>
                  <a
                    href={contact.phoneHref}
                    className="text-[15px]"
                    style={{ color: "var(--sh-bronze-dark)", fontFamily: MONO }}
                  >
                    {contact.phone}
                  </a>
                </div>
                <div>
                  <p className={LABEL + " mb-1"} style={{ color: "var(--sh-ink-50)" }}>
                    Mail
                  </p>
                  <p className="text-[15px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
                    Compliance Department
                    <br />
                    123 Financial District
                    <br />
                    New York, NY 10004
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Policies — dark anchor */}
      <section style={{ backgroundColor: "var(--sh-ink)", fontFamily: UI }} className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-8">
            <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: "var(--sh-linen-50)" }}>
              Related Policies
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RELATED_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between p-5 transition-colors group"
                style={{ border: "0.5px solid var(--sh-linen-12, rgba(242,238,228,0.12))", borderRadius: "8px" }}
              >
                <span className="text-[15px]" style={{ color: "var(--sh-linen-70)" }}>
                  {link.label}
                </span>
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={1.25}
                  style={{ color: BRONZE }}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

    </>
  )
}
