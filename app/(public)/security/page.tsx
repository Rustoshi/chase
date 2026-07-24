import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import { getContactInfo } from "@/lib/contact"
import {
  Shield,
  Lock,
  Eye,
  Fingerprint,
  Bell,
  Server,
  Check,
  AlertTriangle,
} from "lucide-react"

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)" // Newsreader — headings only
const UI = "var(--sh-font-ui)" // General Sans — body/UI/buttons
const MONO = "var(--sh-font-mono)" // Spline Sans Mono — figures/amounts/rates
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

export const metadata: Metadata = {
  title: `Security | ${BANK_NAME}`,
  description: `Learn how ${BANK_NAME} protects your money and personal information with bank-grade security, encryption, and 24/7 fraud monitoring.`,
}

const SECURITY_FEATURES = [
  {
    icon: Lock,
    title: "256-bit Encryption",
    description: "All data is encrypted using AES-256, the same standard used by governments and military.",
  },
  {
    icon: Fingerprint,
    title: "Biometric Authentication",
    description: "Log in securely with Face ID, Touch ID, or fingerprint recognition.",
  },
  {
    icon: Eye,
    title: "24/7 Fraud Monitoring",
    description: "Our AI systems monitor transactions around the clock to detect suspicious activity.",
  },
  {
    icon: Bell,
    title: "Real-Time Alerts",
    description: "Get instant notifications for every transaction and login attempt.",
  },
  {
    icon: Server,
    title: "Secure Infrastructure",
    description: "Our systems are hosted in SOC 2 certified data centers with redundant backups.",
  },
  {
    icon: Shield,
    title: "FDIC Insurance",
    description: "Your deposits are insured up to $250,000 by the Federal Deposit Insurance Corporation.",
  },
]

const CERTIFICATIONS = [
  { name: "FDIC Insured", description: "Deposits insured up to $250,000" },
  { name: "SOC 2 Type II", description: "Certified security controls" },
  { name: "PCI DSS", description: "Payment card industry compliant" },
  { name: "ISO 27001", description: "Information security management" },
]

const TIPS = [
  "Never share your password or PIN with anyone",
  "Enable two-factor authentication on your account",
  "Use a unique, strong password for your banking",
  "Review your transactions regularly for unauthorized activity",
  "Be cautious of phishing emails and suspicious links",
  "Keep your contact information up to date",
]

export default async function SecurityPage() {
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
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Security Center</span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                Your security is our top priority
              </h1>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                We use industry-leading security measures to protect your money and personal
                information. Bank with confidence.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/security/protection"
                  className={LABEL + " inline-flex items-center px-7 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                >
                  How We Protect You
                </Link>
                <Link href="/security/fraud" className="text-[14px]" style={{ color: INK }}>
                  Report Fraud →
                </Link>
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/security-lock.jpg"
                alt="A screen displaying a security lock icon representing account protection"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Layers of protection</span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                How we keep you safe
              </h2>
              <p className="text-[16px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
                Multiple layers of security protect your account at all times, from encryption
                at rest to round-the-clock monitoring of every transaction.
              </p>
            </div>
            <div
              className="relative overflow-hidden aspect-[3/2]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/security-data.jpg"
                alt="A laptop screen displaying a cyber security dashboard"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SECURITY_FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                  className="p-7"
                >
                  <Icon className="h-6 w-6 mb-4" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <h3 className="text-[18px] mb-2" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                    {feature.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed" style={{ color: "var(--sh-ink-50)" }}>
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section style={{ backgroundColor: "var(--sh-ink)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
              <span className={LABEL} style={{ color: "var(--sh-linen-50)" }}>Compliance</span>
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            </div>
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: "var(--sh-linen)" }}
            >
              Certified and compliant
            </h2>
            <p className="text-[16px] leading-relaxed max-w-2xl mx-auto" style={{ color: "var(--sh-linen-70)" }}>
              We meet the highest industry standards for security and compliance.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px" style={{ backgroundColor: "var(--sh-ink-20)" }}>
            {CERTIFICATIONS.map((cert) => (
              <div key={cert.name} style={{ backgroundColor: "var(--sh-ink)" }} className="p-8 text-center">
                <Shield className="h-6 w-6 mx-auto mb-4" strokeWidth={1.25} style={{ color: BRONZE }} />
                <h3
                  className="text-[18px] mb-1"
                  style={{ fontFamily: DISPLAY, fontWeight: 400, color: "var(--sh-linen)" }}
                >
                  {cert.name}
                </h3>
                <p className="text-[14px]" style={{ color: "var(--sh-linen-50)" }}>
                  {cert.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Protect Yourself */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>Your part</span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                Protect yourself
              </h2>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                While we work hard to keep your account secure, there are steps you can take to
                add an extra layer of protection.
              </p>
              <ul className="space-y-4">
                {TIPS.map((tip) => (
                  <li key={tip} className="flex items-start gap-3">
                    <Check className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={1.25} style={{ color: BRONZE }} />
                    <span className="text-[15px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
                      {tip}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }} className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <AlertTriangle className="h-7 w-7 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                <div>
                  <h3 className="text-[18px]" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                    Report Suspicious Activity
                  </h3>
                  <p className="text-[14px]" style={{ color: "var(--sh-ink-50)" }}>We&apos;re here to help 24/7</p>
                </div>
              </div>
              <p className="text-[15px] leading-relaxed mb-6" style={{ color: "var(--sh-ink-80)" }}>
                If you notice any unauthorized transactions or suspicious activity on your
                account, contact us immediately.
              </p>
              <div className="space-y-3">
                <a
                  href={contact.phoneHref}
                  className={LABEL + " flex items-center justify-center w-full px-6 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                >
                  Call {contact.phone}
                </a>
                <a
                  href={contact.textHref}
                  className={LABEL + " flex items-center justify-center w-full px-6 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                >
                  Text {contact.textPhone}
                </a>
                <Link
                  href="/security/fraud"
                  className={LABEL + " flex items-center justify-center w-full px-6 py-3.5"}
                  style={{ color: INK, border: "0.5px solid var(--sh-ink-20)", borderRadius: "2px" }}
                >
                  Report Online
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 lg:py-28 overflow-hidden">
        <Image
          src="/images/stock/data-center.jpg"
          alt="A moody portrait with the word security projected across it"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(23,20,15,0.45)" }} />
        <div className="relative max-w-3xl mx-auto px-6 sm:px-8 lg:px-12 text-center" style={{ fontFamily: UI }}>
          <h2
            className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: "var(--sh-linen)" }}
          >
            Bank with confidence
          </h2>
          <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-linen-70)" }}>
            Your money is protected by industry-leading security and FDIC insurance.
          </p>
          <Link
            href="/register"
            className={LABEL + " inline-flex items-center px-7 py-3.5"}
            style={{ color: BRONZE, border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
          >
            Open Your Account
          </Link>
        </div>
      </section>
    </>
  )
}
