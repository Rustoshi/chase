import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME, LEGAL_NAME } from "@/lib/brand"
import { getContactInfo } from "@/lib/contact"
import {
  FileText,
  Building2,
  MapPin,
  ArrowRight,
  Check,
  Minus,
} from "lucide-react"

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI = "var(--sh-font-ui)"
const MONO = "var(--sh-font-mono)"
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

export const metadata: Metadata = {
  title: `Licenses | ${BANK_NAME}`,
  description: `View ${BANK_NAME}'s banking licenses and regulatory authorizations.`,
}

const LICENSES = [
  {
    type: "State Banking Charter",
    issuer: "New York State Department of Financial Services",
    number: "License #12345",
    status: "Active",
    issued: "January 15, 2019",
  },
  {
    type: "FDIC Certificate",
    issuer: "Federal Deposit Insurance Corporation",
    number: "Certificate #67890",
    status: "Active",
    issued: "January 15, 2019",
  },
  {
    type: "Money Transmitter License",
    issuer: "California Department of Financial Protection and Innovation",
    number: "License #MT-CA-2019-001",
    status: "Active",
    issued: "March 1, 2019",
  },
  {
    type: "Money Transmitter License",
    issuer: "Texas Department of Banking",
    number: "License #TX-MT-2019-002",
    status: "Active",
    issued: "April 15, 2019",
  },
  {
    type: "Money Transmitter License",
    issuer: "Florida Office of Financial Regulation",
    number: "License #FT-FL-2019-003",
    status: "Active",
    issued: "May 1, 2019",
  },
]

const STATE_LICENSES = [
  { state: "Alabama", status: "Licensed" },
  { state: "Alaska", status: "Licensed" },
  { state: "Arizona", status: "Licensed" },
  { state: "Arkansas", status: "Licensed" },
  { state: "California", status: "Licensed" },
  { state: "Colorado", status: "Licensed" },
  { state: "Connecticut", status: "Licensed" },
  { state: "Delaware", status: "Licensed" },
  { state: "Florida", status: "Licensed" },
  { state: "Georgia", status: "Licensed" },
  { state: "Hawaii", status: "Licensed" },
  { state: "Idaho", status: "Licensed" },
  { state: "Illinois", status: "Licensed" },
  { state: "Indiana", status: "Licensed" },
  { state: "Iowa", status: "Licensed" },
  { state: "Kansas", status: "Licensed" },
  { state: "Kentucky", status: "Licensed" },
  { state: "Louisiana", status: "Licensed" },
  { state: "Maine", status: "Licensed" },
  { state: "Maryland", status: "Licensed" },
  { state: "Massachusetts", status: "Licensed" },
  { state: "Michigan", status: "Licensed" },
  { state: "Minnesota", status: "Licensed" },
  { state: "Mississippi", status: "Licensed" },
  { state: "Missouri", status: "Licensed" },
  { state: "Montana", status: "Exempt" },
  { state: "Nebraska", status: "Licensed" },
  { state: "Nevada", status: "Licensed" },
  { state: "New Hampshire", status: "Licensed" },
  { state: "New Jersey", status: "Licensed" },
  { state: "New Mexico", status: "Licensed" },
  { state: "New York", status: "Licensed" },
  { state: "North Carolina", status: "Licensed" },
  { state: "North Dakota", status: "Licensed" },
  { state: "Ohio", status: "Licensed" },
  { state: "Oklahoma", status: "Licensed" },
  { state: "Oregon", status: "Licensed" },
  { state: "Pennsylvania", status: "Licensed" },
  { state: "Rhode Island", status: "Licensed" },
  { state: "South Carolina", status: "Exempt" },
  { state: "South Dakota", status: "Licensed" },
  { state: "Tennessee", status: "Licensed" },
  { state: "Texas", status: "Licensed" },
  { state: "Utah", status: "Licensed" },
  { state: "Vermont", status: "Licensed" },
  { state: "Virginia", status: "Licensed" },
  { state: "Washington", status: "Licensed" },
  { state: "West Virginia", status: "Licensed" },
  { state: "Wisconsin", status: "Licensed" },
  { state: "Wyoming", status: "Licensed" },
  { state: "District of Columbia", status: "Licensed" },
]

export default async function LicensesPage() {
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
                  Regulatory Licenses
                </span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                Licenses &amp; Authorizations
              </h1>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                {LEGAL_NAME} is a licensed financial institution authorized to provide
                banking services across the United States. View our regulatory licenses
                and authorizations below.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="/compliance"
                  className={LABEL + " inline-flex items-center px-7 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                >
                  View Compliance Info
                </Link>
                <a href={contact.compliance.href} className="text-[14px]" style={{ color: INK }}>
                  Contact compliance →
                </a>
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/city.jpg"
                alt="New York City skyline, headquarters of our regulatory oversight"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Primary Licenses */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-4">
            <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
              Core Authorizations
            </span>
          </div>
          <h2
            className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
          >
            Primary Licenses
          </h2>
          <p className="text-[16px] leading-relaxed max-w-2xl mb-12" style={{ color: "var(--sh-ink-80)" }}>
            Our core banking and money transmission licenses.
          </p>

          <div className="space-y-4">
            {LICENSES.map((license) => (
              <div
                key={license.number}
                style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                className="p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <Building2 className="h-6 w-6 flex-shrink-0 mt-1" strokeWidth={1.25} style={{ color: BRONZE }} />
                    <div>
                      <h3 className="text-[18px] font-medium mb-1" style={{ color: INK }}>
                        {license.type}
                      </h3>
                      <p className="text-[14px] mb-2" style={{ color: "var(--sh-ink-50)" }}>
                        {license.issuer}
                      </p>
                      <p className="text-[13px]" style={{ fontFamily: MONO, color: "var(--sh-ink-50)" }}>
                        {license.number} &bull; Issued {license.issued}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 lg:flex-shrink-0">
                    <span
                      className={LABEL + " inline-flex items-center px-3 py-1"}
                      style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "2px" }}
                    >
                      {license.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* State Licenses */}
      <section style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-4">
            <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
              Nationwide Coverage
            </span>
          </div>
          <h2
            className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
          >
            State Licenses
          </h2>
          <p className="text-[16px] leading-relaxed max-w-2xl mb-12" style={{ color: "var(--sh-ink-80)" }}>
            {BANK_NAME} is licensed or exempt to operate in all 50 states and the District of Columbia.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {STATE_LICENSES.map((item) => (
              <div
                key={item.state}
                style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                className="p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" strokeWidth={1.25} style={{ color: "var(--sh-ink-50)" }} />
                  <span className="text-[14px]" style={{ color: "var(--sh-ink-80)" }}>
                    {item.state}
                  </span>
                </div>
                {item.status === "Licensed" ? (
                  <Check className="h-4 w-4" strokeWidth={1.5} style={{ color: BRONZE }} />
                ) : (
                  <Minus className="h-4 w-4" strokeWidth={1.5} style={{ color: "var(--sh-ink-50)" }} />
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-[13px]" style={{ color: "var(--sh-ink-50)" }}>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" strokeWidth={1.5} style={{ color: BRONZE }} />
              <span>Licensed</span>
            </div>
            <div className="flex items-center gap-2">
              <Minus className="h-4 w-4" strokeWidth={1.5} style={{ color: "var(--sh-ink-50)" }} />
              <span>Exempt</span>
            </div>
          </div>
        </div>
      </section>

      {/* Regulatory Contact */}
      <section style={{ backgroundColor: "var(--sh-ink)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 text-center md:text-left">
            <div>
              <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-linen-50)" }}>
                  <FileText className="inline h-3 w-3 mr-1 -mt-0.5" strokeWidth={1.25} />
                  Compliance
                </span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-3"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: "var(--sh-linen)" }}
              >
                Questions about our licenses?
              </h2>
              <p className="text-[16px] leading-relaxed" style={{ color: "var(--sh-linen-70)" }}>
                Contact our compliance team for more information about our regulatory status.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-end">
              <a
                href={contact.compliance.href}
                className={LABEL + " inline-flex items-center justify-center px-7 py-3.5"}
                style={{ color: BRONZE, border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
              >
                Contact Compliance
              </a>
              <Link
                href="/compliance"
                className="inline-flex items-center justify-center text-[14px]"
                style={{ color: "var(--sh-linen)" }}
              >
                View Compliance Info
                <ArrowRight className="w-4 h-4 ml-2" strokeWidth={1.25} />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </>
  )
}
