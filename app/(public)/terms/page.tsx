import { Metadata } from "next"
import { BANK_NAME, LEGAL_NAME } from "@/lib/brand"
import { getContactInfo } from "@/lib/contact"

const INK = '#17140F'
const BRONZE = '#A67C3D'
const DISPLAY = 'var(--sh-font-display)'
const UI = 'var(--sh-font-ui)'
const MONO = 'var(--sh-font-mono)'
const LABEL = 'text-[11px] uppercase tracking-[0.09em] font-medium'

export const metadata: Metadata = {
  title: `Terms of Service | ${BANK_NAME}`,
  description: `Read the terms and conditions for using ${BANK_NAME}'s banking services.`,
}

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "Agreement to Terms",
    body: (
      <>
        <p>
          These Terms of Service ("Terms") constitute a legally binding agreement between
          you and {LEGAL_NAME} ("{BANK_NAME}," "we," "our," or "us") governing your access
          to and use of our banking services, website, and mobile application.
        </p>
        <p className="mt-4">
          By opening an account or using our services, you agree to be bound by these Terms.
          If you do not agree to these Terms, you may not use our services.
        </p>
      </>
    ),
  },
  {
    title: "Eligibility",
    body: (
      <>
        <p>To use our services, you must:</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>Be at least 18 years of age</li>
          <li>Be a legal resident of the United States</li>
          <li>Have a valid Social Security Number or Individual Taxpayer Identification Number</li>
          <li>Have a valid email address and phone number</li>
          <li>Not be prohibited from using financial services under applicable law</li>
        </ul>
      </>
    ),
  },
  {
    title: "Account Opening and Verification",
    body: (
      <>
        <p>
          To open an account, you must provide accurate and complete information. We will
          verify your identity in accordance with applicable laws and regulations, including
          the USA PATRIOT Act.
        </p>
        <p className="mt-4">You agree to:</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>Provide truthful, accurate, and complete information</li>
          <li>Update your information promptly if it changes</li>
          <li>Cooperate with our identity verification processes</li>
          <li>Not open accounts for fraudulent purposes</li>
        </ul>
        <p className="mt-4">
          We reserve the right to refuse to open an account or close an existing account
          at our discretion, subject to applicable law.
        </p>
      </>
    ),
  },
  {
    title: "Account Security",
    body: (
      <>
        <p>You are responsible for:</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>Maintaining the confidentiality of your login credentials</li>
          <li>All activities that occur under your account</li>
          <li>Notifying us immediately of any unauthorized access</li>
          <li>Using strong, unique passwords and enabling two-factor authentication</li>
        </ul>
        <p className="mt-4">
          We will never ask for your password via email, phone, or text message.
          Report any suspicious communications to us immediately.
        </p>
      </>
    ),
  },
  {
    title: "Banking Services",
    body: (
      <>
        <h3
          className="text-[18px] mt-6 mb-3"
          style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
        >
          Deposit Accounts
        </h3>
        <p>
          Your deposits are insured by the Federal Deposit Insurance Corporation (FDIC)
          up to <span style={{ fontFamily: MONO, color: INK }}>$250,000</span> per
          depositor, per insured bank, for each account ownership category.
        </p>

        <h3
          className="text-[18px] mt-6 mb-3"
          style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
        >
          Transactions
        </h3>
        <p>
          You authorize us to process transactions you initiate through our services.
          You agree to maintain sufficient funds for all transactions. We may refuse
          to process transactions that would overdraw your account.
        </p>

        <h3
          className="text-[18px] mt-6 mb-3"
          style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
        >
          Transfers
        </h3>
        <p>
          Transfer limits and processing times may vary. We are not responsible for
          delays caused by third parties, including other financial institutions.
        </p>
      </>
    ),
  },
  {
    title: "Fees and Charges",
    body: (
      <>
        <p>
          Our current fee schedule is available on our website and in the mobile app.
          We may change our fees with 30 days' notice, except where prohibited by law.
        </p>
        <p className="mt-4">
          You authorize us to deduct applicable fees from your account. If your account
          has insufficient funds, we may decline transactions or close your account.
        </p>
      </>
    ),
  },
  {
    title: "Prohibited Activities",
    body: (
      <>
        <p>You may not use our services for:</p>
        <ul className="list-disc pl-6 mt-3 space-y-2">
          <li>Illegal activities, including money laundering or terrorist financing</li>
          <li>Fraudulent transactions or identity theft</li>
          <li>Gambling or adult entertainment (where prohibited)</li>
          <li>Purchasing illegal goods or services</li>
          <li>Circumventing our security measures</li>
          <li>Interfering with our services or other users</li>
          <li>Violating any applicable laws or regulations</li>
        </ul>
      </>
    ),
  },
  {
    title: "Intellectual Property",
    body: (
      <p>
        All content, trademarks, logos, and intellectual property related to our
        services are owned by {LEGAL_NAME} or our licensors. You may not use, copy,
        or distribute our intellectual property without our written permission.
      </p>
    ),
  },
  {
    title: "Disclaimers",
    body: (
      <>
        <p>
          Our services are provided "as is" and "as available" without warranties of
          any kind, express or implied. We do not warrant that our services will be
          uninterrupted, error-free, or secure.
        </p>
        <p className="mt-4">
          We are not responsible for any loss or damage arising from your use of our
          services, except as required by applicable law.
        </p>
      </>
    ),
  },
  {
    title: "Limitation of Liability",
    body: (
      <p>
        To the maximum extent permitted by law, {LEGAL_NAME.toUpperCase()} shall not be
        liable for any indirect, incidental, special, consequential, or punitive damages,
        regardless of the cause of action or whether we have been advised of the
        possibility of such damages.
      </p>
    ),
  },
  {
    title: "Dispute Resolution",
    body: (
      <>
        <p>
          Any disputes arising from these Terms or your use of our services will be
          resolved through binding arbitration in accordance with the rules of the
          American Arbitration Association, except where prohibited by law.
        </p>
        <p className="mt-4">
          You agree to waive your right to participate in class action lawsuits or
          class-wide arbitration, to the extent permitted by law.
        </p>
      </>
    ),
  },
  {
    title: "Termination",
    body: (
      <>
        <p>
          You may close your account at any time by contacting us. We may suspend or
          terminate your account if you violate these Terms, engage in suspicious
          activity, or as required by law.
        </p>
        <p className="mt-4">
          Upon termination, you remain responsible for any outstanding obligations,
          and certain provisions of these Terms will survive.
        </p>
      </>
    ),
  },
  {
    title: "Changes to Terms",
    body: (
      <p>
        We may modify these Terms at any time. We will provide notice of material
        changes through our website, app, or email. Your continued use of our
        services after changes take effect constitutes acceptance of the new Terms.
      </p>
    ),
  },
  {
    title: "Governing Law",
    body: (
      <p>
        These Terms are governed by the laws of the State of New York, without
        regard to conflict of law principles. Federal law, including the Electronic
        Fund Transfer Act and related regulations, also applies.
      </p>
    ),
  },
]

export default async function TermsOfServicePage() {
  const contact = await getContactInfo()
  return (
    <>
      {/* Hero */}
      <section style={{ backgroundColor: 'var(--sh-linen)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-6">
            <span aria-hidden style={{ width: 28, height: '1.5px', backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>Legal</span>
          </div>
          <h1
            className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
            style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
          >
            Terms of Service
          </h1>
          <p className={LABEL} style={{ color: 'var(--sh-ink-50)' }}>
            Last updated: March 1, 2024
          </p>
        </div>
      </section>

      {/* Content */}
      <section style={{ backgroundColor: 'var(--sh-surface)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="space-y-14">
            {sections.map((section) => (
              <div
                key={section.title}
                className="pb-14"
                style={{ borderBottom: '0.5px solid var(--sh-ink-10)' }}
              >
                <h2
                  className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                  style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
                >
                  {section.title}
                </h2>
                <div
                  className="text-[16px] leading-relaxed"
                  style={{ color: 'var(--sh-ink-80)' }}
                >
                  {section.body}
                </div>
              </div>
            ))}

            {/* Contact */}
            <div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                Contact Us
              </h2>
              <p className="text-[16px] leading-relaxed mb-6" style={{ color: 'var(--sh-ink-80)' }}>
                If you have questions about these Terms, please contact us:
              </p>
              <div
                style={{ backgroundColor: 'var(--sh-linen)', border: '0.5px solid var(--sh-ink-10)', borderRadius: '8px' }}
                className="p-7"
              >
                <p className="text-[18px]" style={{ fontFamily: UI, fontWeight: 500, color: INK }}>
                  {LEGAL_NAME}
                </p>
                <p className="mt-3 text-[16px]" style={{ color: 'var(--sh-ink-80)' }}>Legal Department</p>
                <p className="text-[16px]" style={{ color: 'var(--sh-ink-80)' }}>123 Financial District</p>
                <p className="text-[16px]" style={{ color: 'var(--sh-ink-80)' }}>New York, NY 10004</p>
                <p className="mt-3 text-[16px]" style={{ color: 'var(--sh-ink-80)' }}>
                  Email:{" "}
                  <a
                    href={contact.legal.href}
                    style={{ color: 'var(--sh-bronze-dark)' }}
                    className="hover:underline"
                  >
                    {contact.legal.address}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  )
}
