import { Metadata } from "next"
import { BANK_NAME, LEGAL_NAME } from "@/lib/brand"
import { getContactInfo } from "@/lib/contact"

export const metadata: Metadata = {
  title: `Cookie Policy | ${BANK_NAME}`,
  description: `Learn how ${BANK_NAME} uses cookies and similar technologies on our website and app.`,
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

function ExampleBox({ items }: { items: string[] }) {
  return (
    <div
      style={{ backgroundColor: 'var(--sh-surface)', border: '0.5px solid var(--sh-ink-10)', borderRadius: '8px' }}
      className="mt-3 p-6"
    >
      <p className={LABEL} style={{ color: 'var(--sh-bronze-dark)' }}>Examples</p>
      <ul style={{ color: 'var(--sh-ink-80)' }} className="list-disc pl-6 mt-3 space-y-1.5 text-[15px] leading-relaxed marker:text-[#A67C3D]">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export default async function CookiePolicyPage() {
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
              Cookie Policy
            </h1>
            <p style={{ fontFamily: MONO, fontWeight: 400, color: 'var(--sh-ink-50)' }} className="text-[13px] mb-6">
              Last updated: March 1, 2024
            </p>
            <P>
              Cookies are small text files stored on your device when you visit a website.
              They help websites remember your preferences, understand how you use the site,
              and improve your experience. This Cookie Policy explains how {LEGAL_NAME}
              ("{BANK_NAME}," "we," "our," or "us") uses cookies and similar technologies on
              our website and mobile application.
            </P>
          </div>
        </div>
      </section>

      {/* Content */}
      <section style={{ backgroundColor: 'var(--sh-surface)', fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-3xl mx-auto">

            {/* What Are Cookies */}
            <Block>
              <H2>What Are Cookies?</H2>
              <P>
                Cookies are small text files that are stored on your device when you visit
                a website. They help websites remember your preferences, understand how you
                use the site, and improve your experience.
              </P>
              <P className="mt-4">
                This Cookie Policy explains how {LEGAL_NAME} ("{BANK_NAME}," "we," "our," or
                "us") uses cookies and similar technologies on our website and mobile
                application.
              </P>
            </Block>

            {/* Types of Cookies */}
            <Block>
              <H2>Types of Cookies We Use</H2>

              <H3>Essential Cookies</H3>
              <P>
                These cookies are necessary for our website to function properly. They enable
                core functionality such as security, account access, and session management.
                You cannot opt out of these cookies.
              </P>
              <ExampleBox
                items={[
                  "Authentication and session cookies",
                  "Security cookies (fraud prevention)",
                  "Load balancing cookies",
                ]}
              />

              <H3>Functional Cookies</H3>
              <P>
                These cookies remember your preferences and choices to provide a more
                personalized experience. They may be set by us or third-party providers.
              </P>
              <ExampleBox
                items={[
                  "Language and region preferences",
                  "Display settings (dark/light mode)",
                  "Recently viewed items",
                ]}
              />

              <H3>Analytics Cookies</H3>
              <P>
                These cookies help us understand how visitors interact with our website by
                collecting anonymous information. This helps us improve our services.
              </P>
              <ExampleBox
                items={[
                  "Google Analytics",
                  "Page view and click tracking",
                  "Error and performance monitoring",
                ]}
              />

              <H3>Marketing Cookies</H3>
              <P>
                These cookies track your activity across websites to deliver relevant
                advertisements. They may be set by our advertising partners.
              </P>
              <ExampleBox
                items={[
                  "Social media pixels (Facebook, LinkedIn)",
                  "Retargeting cookies",
                  "Conversion tracking",
                ]}
              />
            </Block>

            {/* Cookie Duration */}
            <Block>
              <H2>Cookie Duration</H2>
              <P>Cookies can be classified by how long they remain on your device:</P>

              <H3>Session Cookies</H3>
              <P>
                These cookies are temporary and are deleted when you close your browser.
                They are used to maintain your session while you navigate our website.
              </P>

              <H3>Persistent Cookies</H3>
              <P>
                These cookies remain on your device for a set period or until you delete them.
                They are used to remember your preferences across visits.
              </P>
            </Block>

            {/* Third-Party Cookies */}
            <Block>
              <H2>Third-Party Cookies</H2>
              <P>
                Some cookies are placed by third-party services that appear on our pages.
                We do not control these cookies and recommend reviewing the privacy policies
                of these third parties:
              </P>
              <UL
                items={[
                  <>Google Analytics – <TextLink href="https://policies.google.com/privacy">Privacy Policy</TextLink></>,
                  <>Intercom – <TextLink href="https://www.intercom.com/legal/privacy">Privacy Policy</TextLink></>,
                  <>Stripe – <TextLink href="https://stripe.com/privacy">Privacy Policy</TextLink></>,
                ]}
              />
            </Block>

            {/* Managing Cookies */}
            <Block>
              <H2>Managing Your Cookie Preferences</H2>
              <P>You have several options for managing cookies:</P>

              <H3>Browser Settings</H3>
              <P>Most browsers allow you to control cookies through their settings. You can:</P>
              <UL
                items={[
                  "View and delete existing cookies",
                  "Block all cookies or only third-party cookies",
                  "Set preferences for specific websites",
                  'Enable "Do Not Track" signals',
                ]}
              />
              <P className="mt-4">
                Note: Blocking essential cookies may prevent you from using our services.
              </P>

              <H3>Browser-Specific Instructions</H3>
              <UL
                items={[
                  <TextLink href="https://support.google.com/chrome/answer/95647">Google Chrome</TextLink>,
                  <TextLink href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer">Mozilla Firefox</TextLink>,
                  <TextLink href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac">Safari</TextLink>,
                  <TextLink href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09">Microsoft Edge</TextLink>,
                ]}
              />

              <H3>Opt-Out Tools</H3>
              <P>You can opt out of certain third-party cookies using these tools:</P>
              <UL
                items={[
                  <TextLink href="https://tools.google.com/dlpage/gaoptout">Google Analytics Opt-Out</TextLink>,
                  <TextLink href="https://optout.networkadvertising.org/">Network Advertising Initiative</TextLink>,
                  <TextLink href="https://optout.aboutads.info/">Digital Advertising Alliance</TextLink>,
                ]}
              />
            </Block>

            {/* Similar Technologies */}
            <Block>
              <H2>Similar Technologies</H2>
              <P>In addition to cookies, we may use other tracking technologies:</P>
              <UL
                items={[
                  <><strong style={{ color: INK, fontWeight: 500 }}>Web Beacons:</strong> Small images that track page views and email opens</>,
                  <><strong style={{ color: INK, fontWeight: 500 }}>Local Storage:</strong> Data stored in your browser for faster performance</>,
                  <><strong style={{ color: INK, fontWeight: 500 }}>Device Fingerprinting:</strong> Collecting device characteristics for security</>,
                ]}
              />
            </Block>

            {/* Updates */}
            <Block>
              <H2>Updates to This Policy</H2>
              <P>
                We may update this Cookie Policy from time to time. We will notify you of
                any material changes by posting the new policy on this page and updating
                the "Last updated" date.
              </P>
            </Block>

            {/* Contact */}
            <Block>
              <H2>Contact Us</H2>
              <P>If you have questions about our use of cookies, please contact us:</P>
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
