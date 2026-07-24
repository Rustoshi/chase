import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import {
  Shield,
  Lock,
  Eye,
  Fingerprint,
  Smartphone,
  Server,
  ArrowRight,
  Check,
} from "lucide-react"

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)" // Newsreader — headings only
const UI = "var(--sh-font-ui)" // General Sans — body/UI/buttons
const MONO = "var(--sh-font-mono)" // Spline Sans Mono — figures/amounts/rates
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium" // eyebrows & button labels

export const metadata: Metadata = {
  title: `How We Protect You | ${BANK_NAME}`,
  description: `Learn about the security measures ${BANK_NAME} uses to protect your money and personal information.`,
}

const PROTECTION_LAYERS = [
  {
    icon: Lock,
    title: "Data Encryption",
    description:
      "All data transmitted between your device and our servers is encrypted using TLS 1.3 and AES-256 encryption, the same standards used by governments and financial institutions worldwide.",
    details: [
      "256-bit AES encryption for data at rest",
      "TLS 1.3 for data in transit",
      "End-to-end encryption for sensitive operations",
      "Regular security audits and penetration testing",
    ],
    image: {
      src: "/images/stock/security-data.jpg",
      alt: "Laptop screen displaying a cyber security dashboard",
    },
  },
  {
    icon: Fingerprint,
    title: "Multi-Factor Authentication",
    description:
      "We require multiple forms of verification to ensure only you can access your account, even if your password is compromised.",
    details: [
      "Biometric login (Face ID, Touch ID, Fingerprint)",
      "SMS and email verification codes",
      "Hardware security key support",
      "Trusted device management",
    ],
  },
  {
    icon: Eye,
    title: "Fraud Detection",
    description:
      "Our AI-powered systems analyze every transaction in real-time to detect and prevent fraudulent activity before it affects your account.",
    details: [
      "Real-time transaction monitoring",
      "Behavioral analysis and anomaly detection",
      "Automatic blocking of suspicious transactions",
      "24/7 fraud investigation team",
    ],
  },
  {
    icon: Smartphone,
    title: "Device Security",
    description:
      "We monitor the devices you use to access your account and alert you to any unusual login attempts.",
    details: [
      "Device fingerprinting and recognition",
      "Alerts for new device logins",
      "Remote session termination",
      "Automatic logout on inactive sessions",
    ],
  },
  {
    icon: Server,
    title: "Infrastructure Security",
    description:
      "Our systems are hosted in world-class data centers with multiple layers of physical and digital security.",
    details: [
      "SOC 2 Type II certified data centers",
      "Geographic redundancy and failover",
      "DDoS protection and mitigation",
      "Regular backup and disaster recovery testing",
    ],
    image: {
      src: "/images/stock/data-center.jpg",
      alt: "Data center security signage projected across a dim server hall",
    },
  },
  {
    icon: Shield,
    title: "Account Protection",
    description:
      "Your deposits are protected by FDIC insurance, and we offer additional protections against unauthorized access.",
    details: [
      "FDIC insurance up to $250,000",
      "Zero liability for unauthorized transactions",
      "Account freeze and recovery options",
      "Identity theft protection resources",
    ],
  },
]

const STATS = [
  { value: "256-bit", label: "AES encryption standard" },
  { value: "TLS 1.3", label: "Encryption in transit" },
  { value: "24/7", label: "Fraud monitoring & investigation" },
  { value: "$250,000", label: "FDIC insurance per depositor" },
]

export default function ProtectionPage() {
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
                  Security
                </span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                How we protect you
              </h1>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                We employ multiple layers of security to keep your money and personal
                information safe. Here&apos;s an in-depth look at how we protect you.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/contact"
                  className={LABEL + " inline-flex items-center px-7 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                >
                  Contact Us
                </Link>
                <Link href="/support" className="text-[14px]" style={{ color: INK }}>
                  Visit Help Center →
                </Link>
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/security-data.jpg"
                alt="Laptop screen displaying a cyber security dashboard"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Protection Layers */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="space-y-20 lg:space-y-24">
            {PROTECTION_LAYERS.map((layer, index) => {
              const Icon = layer.icon
              const reversed = index % 2 === 1
              return (
                <div key={layer.title} className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className={reversed ? "lg:order-2" : ""}>
                    <Icon className="h-6 w-6 mb-5" strokeWidth={1.25} style={{ color: BRONZE }} />
                    <h2
                      className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                      style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
                    >
                      {layer.title}
                    </h2>
                    <p className="text-[16px] leading-relaxed mb-6" style={{ color: "var(--sh-ink-80)" }}>
                      {layer.description}
                    </p>
                    <ul className="space-y-3">
                      {layer.details.map((detail) => (
                        <li key={detail} className="flex items-start gap-3">
                          <Check className="h-4 w-4 mt-0.5 flex-shrink-0" strokeWidth={1.5} style={{ color: BRONZE }} />
                          <span className="text-[15px]" style={{ color: "var(--sh-ink-80)" }}>
                            {detail}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {layer.image ? (
                    <div
                      className={`relative overflow-hidden aspect-[4/3] ${reversed ? "lg:order-1" : ""}`}
                      style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
                    >
                      <Image
                        src={layer.image.src}
                        alt={layer.image.alt}
                        fill
                        sizes="(max-width:1024px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={`flex items-center justify-center aspect-[4/3] ${reversed ? "lg:order-1" : ""}`}
                      style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                    >
                      <Icon className="h-16 w-16" strokeWidth={1} style={{ color: "var(--sh-ink-20)" }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats strip — dark anchor */}
      <section style={{ backgroundColor: "var(--sh-ink)", fontFamily: UI }} className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div className="text-[2rem] sm:text-[2.25rem] mb-2" style={{ fontFamily: MONO, fontWeight: 400, color: "var(--sh-linen)" }}>
                  {stat.value}
                </div>
                <div className="text-[13px] leading-snug" style={{ color: "var(--sh-linen-70)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div
            className="text-center max-w-2xl mx-auto py-4"
            style={{ borderTop: "0.5px solid var(--sh-ink-10)", borderBottom: "0.5px solid var(--sh-ink-10)" }}
          >
            <div className="flex items-center justify-center gap-3 mb-6 mt-10">
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
              <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                Get in touch
              </span>
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            </div>
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            >
              Questions about security?
            </h2>
            <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
              Our security team is available 24/7 to answer your questions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10">
              <Link
                href="/contact"
                className={LABEL + " inline-flex items-center px-7 py-3.5"}
                style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
              >
                Contact Us
                <ArrowRight className="h-4 w-4 ml-2" strokeWidth={1.5} />
              </Link>
              <Link href="/support" className="text-[14px]" style={{ color: INK }}>
                Visit Help Center →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
