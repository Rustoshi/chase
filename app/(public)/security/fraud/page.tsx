import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import { getContactInfo } from "@/lib/contact"
import {
  AlertTriangle,
  Phone,
  Mail,
  Shield,
  Lock,
  Eye,
  CreditCard,
} from "lucide-react"

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)" // Newsreader — headings only
const UI = "var(--sh-font-ui)" // General Sans — body/UI/buttons
const MONO = "var(--sh-font-mono)" // Spline Sans Mono — figures/amounts/rates
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium" // eyebrows & button labels

export const metadata: Metadata = {
  title: `Fraud Prevention & Reporting | ${BANK_NAME}`,
  description: `Report suspicious activity and learn how to protect yourself from fraud. ${BANK_NAME} is here to help 24/7.`,
}

const FRAUD_TYPES = [
  {
    icon: Mail,
    title: "Phishing Scams",
    description:
      "Fraudulent emails or messages pretending to be from us, asking for your login credentials or personal information.",
    warning: "We will never ask for your password via email or text.",
  },
  {
    icon: CreditCard,
    title: "Card Fraud",
    description:
      "Unauthorized transactions on your debit or credit card from stolen card information.",
    warning: "Review your transactions regularly and report any you don't recognize.",
  },
  {
    icon: Lock,
    title: "Account Takeover",
    description:
      "Someone gains access to your account through stolen credentials or social engineering.",
    warning: "Enable two-factor authentication and use a unique, strong password.",
  },
  {
    icon: Eye,
    title: "Identity Theft",
    description:
      "Someone uses your personal information to open accounts or make purchases in your name.",
    warning: "Monitor your credit report and be cautious about sharing personal info.",
  },
]

const STEPS_IF_FRAUD = [
  {
    step: 1,
    title: "Contact Us Immediately",
    description:
      "Call or text our 24/7 fraud hotline, or use the in-app chat to report the issue.",
  },
  {
    step: 2,
    title: "Freeze Your Card",
    description:
      "Use the app to instantly freeze your card and prevent any further unauthorized transactions.",
  },
  {
    step: 3,
    title: "Change Your Password",
    description:
      "Update your password and enable two-factor authentication if you haven't already.",
  },
  {
    step: 4,
    title: "Review Recent Activity",
    description:
      "Go through your recent transactions and identify any that you don't recognize.",
  },
  {
    step: 5,
    title: "File a Dispute",
    description:
      "We'll investigate the fraudulent transactions and work to recover your funds.",
  },
]

export default async function FraudPage() {
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
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                  Fraud Prevention
                </span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                Report fraud &amp; stay protected
              </h1>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                If you suspect fraudulent activity on your account, we&apos;re here to help
                24/7. Learn how to recognize and report fraud.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <a
                  href={contact.phoneHref}
                  className={LABEL + " inline-flex items-center px-7 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                >
                  <Phone className="h-4 w-4 mr-2" strokeWidth={1.25} />
                  {contact.phone}
                </a>
                <a
                  href={contact.textHref}
                  className="text-[14px] inline-flex items-center gap-1"
                  style={{ color: INK }}
                >
                  Text {contact.textPhone} →
                </a>
                <a
                  href={contact.emailHref}
                  className="text-[14px] inline-flex items-center gap-1"
                  style={{ color: INK }}
                >
                  Email security team →
                </a>
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/security-lock.jpg"
                alt="Security screen displaying a lock icon, representing account protection"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section style={{ backgroundColor: "var(--sh-ink)", fontFamily: UI }} className="py-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Phone className="h-6 w-6 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
              <div>
                <p className="text-[18px]" style={{ fontFamily: DISPLAY, fontWeight: 400, color: "var(--sh-linen)" }}>
                  24/7 Fraud Hotline
                </p>
                <p className="text-[14px]" style={{ color: "var(--sh-linen-70)" }}>
                  Report suspicious activity immediately
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={contact.phoneHref}
                className={LABEL + " inline-flex items-center justify-center px-7 py-3.5"}
                style={{ color: BRONZE, border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
              >
                <Phone className="h-4 w-4 mr-2" strokeWidth={1.25} />
                {contact.phone}
              </a>
              <a
                href={contact.emailHref}
                className={LABEL + " inline-flex items-center justify-center px-7 py-3.5"}
                style={{ color: "var(--sh-linen)", border: "0.5px solid var(--sh-linen-50)", borderRadius: "2px" }}
              >
                <Mail className="h-4 w-4 mr-2" strokeWidth={1.25} />
                Email Security Team
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Types of Fraud */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
              <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                Know the Signs
              </span>
            </div>
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            >
              Common types of fraud
            </h2>
            <p className="text-[16px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
              Learn to recognize these common fraud tactics to protect yourself.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {FRAUD_TYPES.map((fraud) => {
              const Icon = fraud.icon
              return (
                <div
                  key={fraud.title}
                  style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                  className="p-7"
                >
                  <Icon className="h-6 w-6 mb-4" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <h3 className="text-[18px] mb-2" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                    {fraud.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed mb-4" style={{ color: "var(--sh-ink-80)" }}>
                    {fraud.description}
                  </p>
                  <div
                    className="flex items-start gap-2 p-3"
                    style={{ backgroundColor: "var(--sh-bronze-10)", borderRadius: "2px" }}
                  >
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" strokeWidth={1.25} style={{ color: "var(--sh-bronze-dark)" }} />
                    <p className="text-[13px] leading-relaxed" style={{ color: "var(--sh-bronze-dark)" }}>
                      {fraud.warning}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* What to Do */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div className="lg:sticky lg:top-28">
              <div className="flex items-center gap-3 mb-6">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                  Respond Quickly
                </span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                What to do if you&apos;re a victim
              </h2>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                Follow these steps immediately if you suspect fraud on your account.
              </p>
              <div
                className="relative overflow-hidden aspect-[5/4] hidden lg:block"
                style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
              >
                <Image
                  src="/images/stock/reception.jpg"
                  alt="Support representative ready to assist with a fraud report"
                  fill
                  sizes="(max-width:1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="space-y-4">
              {STEPS_IF_FRAUD.map((item) => (
                <div
                  key={item.step}
                  style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                  className="flex gap-5 p-6"
                >
                  <div
                    className="w-10 h-10 flex items-center justify-center flex-shrink-0"
                    style={{ border: "0.5px solid " + BRONZE, borderRadius: "2px", fontFamily: MONO, fontWeight: 400, color: BRONZE }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-[18px] mb-2" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                      {item.title}
                    </h3>
                    <p className="text-[15px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Protection Promise */}
      <section style={{ backgroundColor: "var(--sh-ink)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-3xl mx-auto">
            <Shield className="h-8 w-8 mx-auto mb-6" strokeWidth={1.25} style={{ color: BRONZE }} />
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: "var(--sh-linen)" }}
            >
              Our protection promise
            </h2>
            <p className="text-[16px] leading-relaxed mb-10" style={{ color: "var(--sh-linen-70)" }}>
              You&apos;re protected against unauthorized transactions. If fraud occurs on
              your account, we&apos;ll work with you to investigate and recover your funds.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 mb-10">
              <div
                className="p-6"
                style={{ backgroundColor: "var(--sh-linen-08, rgba(242,238,228,0.08))", border: "0.5px solid var(--sh-linen-50)", borderRadius: "8px" }}
              >
                <p className="text-[1.75rem] mb-1" style={{ fontFamily: MONO, fontWeight: 400, color: "var(--sh-linen)" }}>
                  $0
                </p>
                <p className="text-[13px]" style={{ color: "var(--sh-linen-70)" }}>
                  Liability for unauthorized transactions
                </p>
              </div>
              <div
                className="p-6"
                style={{ backgroundColor: "var(--sh-linen-08, rgba(242,238,228,0.08))", border: "0.5px solid var(--sh-linen-50)", borderRadius: "8px" }}
              >
                <p className="text-[1.75rem] mb-1" style={{ fontFamily: MONO, fontWeight: 400, color: "var(--sh-linen)" }}>
                  24/7
                </p>
                <p className="text-[13px]" style={{ color: "var(--sh-linen-70)" }}>
                  Fraud monitoring
                </p>
              </div>
              <div
                className="p-6"
                style={{ backgroundColor: "var(--sh-linen-08, rgba(242,238,228,0.08))", border: "0.5px solid var(--sh-linen-50)", borderRadius: "8px" }}
              >
                <p className="text-[1.75rem] mb-1" style={{ fontFamily: MONO, fontWeight: 400, color: "var(--sh-linen)" }}>
                  10 days
                </p>
                <p className="text-[13px]" style={{ color: "var(--sh-linen-70)" }}>
                  Typical investigation time
                </p>
              </div>
            </div>
            <Link
              href="/security"
              className={LABEL + " inline-flex items-center px-7 py-3.5"}
              style={{ color: BRONZE, border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
            >
              Learn More About Security
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
