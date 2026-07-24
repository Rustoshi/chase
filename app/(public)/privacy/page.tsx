import { Metadata } from "next"
import { BANK_NAME, LEGAL_NAME } from "@/lib/brand"
import { getContactInfo } from "@/lib/contact"

export const metadata: Metadata = {
  title: `Privacy Policy | ${BANK_NAME}`,
  description: `Learn how ${BANK_NAME} collects, uses, and protects your personal information.`,
}

const INK = '#17140F'
const BRONZE = '#A67C3D'
const DISPLAY = 'var(--sh-font-display)'
const UI = 'var(--sh-font-ui)'
const MONO = 'var(--sh-font-mono)'
const LABEL = 'text-[11px] uppercase tracking-[0.09em] font-medium'

function Eyebrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
      <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>{label}</span>
    </div>
  )
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
      className="text-[1.5rem] sm:text-[1.75rem] leading-[1.15] mb-4"
    >
      {children}
    </h2>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{ fontFamily: UI, fontWeight: 500, color: INK }}
      className="text-[17px] mt-6 mb-3"
    >
      {children}
    </h3>
  )
}

function P({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p style={{ color: 'var(--sh-ink-80)' }} className={`text-[16px] leading-relaxed ${className}`}>
      {children}
    </p>
  )
}

function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul
      style={{ color: 'var(--sh-ink-80)' }}
      className="list-disc pl-6 mt-3 space-y-2 text-[16px] leading-relaxed marker:text-[#A67C3D]"
    >
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      style={{ color: 'var(--sh-bronze-dark)' }}
      className="underline underline-offset-2 decoration-[0.5px] hover:no-underline"
    >
      {children}
    </a>
  )
}

function Block({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ borderTop: '0.5px solid var(--sh-ink-10)' }}
      className="pt-12 mt-12 first:pt-0 first:mt-0 first:border-t-0"
    >
      {children}
    </div>
  )
}

export default async function PrivacyPolicyPage() {
  const contact = await getContactInfo()
  return (
    <>
      {/* Hero */}
      <section style={{ backgroundColor: 'var(--sh-linen)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-3xl mx-auto">
            <Eyebrow label="Legal" />
            <h1
              style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              className="text-[2.25rem] sm:text-[2.75rem] leading-[1.1] mt-5 mb-6"
            >
              Privacy Policy
            </h1>
            <p style={{ fontFamily: MONO, fontWeight: 400, color: 'var(--sh-ink-50)' }} className="text-[13px] mb-6">
              Last updated: March 1, 2024
            </p>
            <P>
              {LEGAL_NAME} ("we," "our," or "us") is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our banking services, website, and mobile application.
              Please read this policy carefully — by using our services, you consent to the
              practices described here.
            </P>
          </div>
        </div>
      </section>

      {/* Content */}
      <section style={{ backgroundColor: 'var(--sh-surface)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-3xl mx-auto">

            {/* Introduction */}
            <Block>
              <H2>Introduction</H2>
              <P>
                {LEGAL_NAME} ("we," "our," or "us") is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your
                information when you use our banking services, website, and mobile application.
              </P>
              <P className="mt-4">
                Please read this privacy policy carefully. By using our services, you consent
                to the practices described in this policy.
              </P>
            </Block>

            {/* Information We Collect */}
            <Block>
              <H2>Information We Collect</H2>

              <H3>Personal Information</H3>
              <P>We may collect the following personal information:</P>
              <UL
                items={[
                  "Name, email address, phone number, and mailing address",
                  "Date of birth and Social Security Number (for identity verification)",
                  "Government-issued identification documents",
                  "Employment information and income details",
                  "Bank account and payment card information",
                ]}
              />

              <H3>Financial Information</H3>
              <P>To provide our banking services, we collect:</P>
              <UL
                items={[
                  "Transaction history and account balances",
                  "Credit history and credit scores (with your consent)",
                  "Information about linked external accounts",
                  "Payment and transfer details",
                ]}
              />

              <H3>Technical Information</H3>
              <P>We automatically collect certain information when you use our services:</P>
              <UL
                items={[
                  "Device information (type, operating system, unique identifiers)",
                  "IP address and location data",
                  "Browser type and settings",
                  "Usage data and interaction with our services",
                  "Cookies and similar tracking technologies",
                ]}
              />
            </Block>

            {/* How We Use Your Information */}
            <Block>
              <H2>How We Use Your Information</H2>
              <P>We use the information we collect to:</P>
              <UL
                items={[
                  "Provide, maintain, and improve our banking services",
                  "Process transactions and send related information",
                  "Verify your identity and prevent fraud",
                  "Comply with legal and regulatory requirements",
                  "Communicate with you about your account and our services",
                  "Send promotional communications (with your consent)",
                  "Analyze usage patterns to improve user experience",
                  "Protect the security of our services and users",
                ]}
              />
            </Block>

            {/* Information Sharing */}
            <Block>
              <H2>Information Sharing</H2>
              <P>We may share your information with:</P>

              <H3>Service Providers</H3>
              <P>
                Third-party companies that help us provide our services, such as payment
                processors, identity verification services, and cloud hosting providers.
              </P>

              <H3>Financial Partners</H3>
              <P>
                Banks, card networks, and other financial institutions necessary to
                process your transactions and provide our services.
              </P>

              <H3>Legal Requirements</H3>
              <P>
                We may disclose information when required by law, regulation, legal process,
                or governmental request, or to protect our rights and safety.
              </P>

              <H3>Business Transfers</H3>
              <P>
                In connection with a merger, acquisition, or sale of assets, your information
                may be transferred as part of that transaction.
              </P>
            </Block>

            {/* Data Security */}
            <Block>
              <H2>Data Security</H2>
              <P>
                We implement industry-standard security measures to protect your information:
              </P>
              <UL
                items={[
                  "256-bit AES encryption for data at rest and in transit",
                  "Multi-factor authentication for account access",
                  "Regular security audits and penetration testing",
                  "Employee training on data protection practices",
                  "SOC 2 Type II certified infrastructure",
                ]}
              />
              <P className="mt-4">
                While we strive to protect your information, no method of transmission over
                the internet is 100% secure. We cannot guarantee absolute security.
              </P>
            </Block>

            {/* Your Rights */}
            <Block>
              <H2>Your Rights</H2>
              <P>Depending on your location, you may have the right to:</P>
              <UL
                items={[
                  "Access the personal information we hold about you",
                  "Correct inaccurate or incomplete information",
                  "Delete your personal information (subject to legal requirements)",
                  "Opt out of marketing communications",
                  "Request data portability",
                  "Withdraw consent for certain processing activities",
                ]}
              />
              <P className="mt-4">
                To exercise these rights, please contact us at{" "}
                <TextLink href={contact.emailHref}>{contact.email}</TextLink>.
              </P>
            </Block>

            {/* Cookies */}
            <Block>
              <H2>Cookies and Tracking</H2>
              <P>
                We use cookies and similar technologies to enhance your experience,
                analyze usage, and deliver personalized content. You can manage cookie
                preferences through your browser settings.
              </P>
              <P className="mt-4">
                For more information, please see our{" "}
                <TextLink href="/cookies">Cookie Policy</TextLink>.
              </P>
            </Block>

            {/* Children's Privacy */}
            <Block>
              <H2>Children&apos;s Privacy</H2>
              <P>
                Our services are not intended for individuals under 18 years of age.
                We do not knowingly collect personal information from children. If you
                believe we have collected information from a child, please contact us.
              </P>
            </Block>

            {/* Changes to This Policy */}
            <Block>
              <H2>Changes to This Policy</H2>
              <P>
                We may update this Privacy Policy from time to time. We will notify you
                of any material changes by posting the new policy on this page and updating
                the "Last updated" date. Your continued use of our services after changes
                constitutes acceptance of the updated policy.
              </P>
            </Block>

            {/* Contact Us */}
            <Block>
              <H2>Contact Us</H2>
              <P>
                If you have questions about this Privacy Policy or our privacy practices,
                please contact us:
              </P>
              <div
                style={{ backgroundColor: 'var(--sh-linen)', border: '0.5px solid var(--sh-ink-10)', borderRadius: '8px' }}
                className="mt-5 p-7"
              >
                <p style={{ fontFamily: UI, fontWeight: 500, color: INK }} className="text-[17px]">
                  {LEGAL_NAME}
                </p>
                <p style={{ color: 'var(--sh-ink-80)' }} className="text-[16px] leading-relaxed mt-2">Privacy Team</p>
                <p style={{ color: 'var(--sh-ink-80)' }} className="text-[16px] leading-relaxed">123 Financial District</p>
                <p style={{ color: 'var(--sh-ink-80)' }} className="text-[16px] leading-relaxed">New York, NY 10004</p>
                <p style={{ color: 'var(--sh-ink-80)' }} className="text-[16px] leading-relaxed mt-2">
                  Email:{" "}
                  <TextLink href={contact.privacy.href}>{contact.privacy.address}</TextLink>
                </p>
              </div>
            </Block>

          </div>
        </div>
      </section>

    </>
  )
}
