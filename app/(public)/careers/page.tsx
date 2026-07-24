import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import { getContactInfo } from "@/lib/contact"
import {
  ArrowRight,
  MapPin,
  Briefcase,
  Heart,
  Zap,
  Users,
  TrendingUp,
  Coffee,
  Plane,
  GraduationCap,
  DollarSign,
  Clock,
} from "lucide-react"

export const metadata: Metadata = {
  title: `Careers | ${BANK_NAME}`,
  description: `Join the team at ${BANK_NAME}. We're building the future of banking and looking for talented people to help us get there.`,
}

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)" // Newsreader — headings only
const UI = "var(--sh-font-ui)" // General Sans — body/UI/buttons
const MONO = "var(--sh-font-mono)" // Spline Sans Mono — figures/amounts/rates
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

const BENEFITS = [
  {
    icon: DollarSign,
    title: "Competitive Salary",
    description: "Top-of-market compensation with equity options",
  },
  {
    icon: Heart,
    title: "Health & Wellness",
    description: "Comprehensive medical, dental, and vision coverage",
  },
  {
    icon: Plane,
    title: "Unlimited PTO",
    description: "Take the time you need to recharge",
  },
  {
    icon: GraduationCap,
    title: "Learning Budget",
    description: "$2,000 annual budget for courses and conferences",
  },
  {
    icon: Coffee,
    title: "Remote-First",
    description: "Work from anywhere with flexible hours",
  },
  {
    icon: TrendingUp,
    title: "401(k) Match",
    description: "4% company match on retirement contributions",
  },
]

const VALUES = [
  {
    icon: Users,
    title: "Customer Obsession",
    description:
      "Every decision starts with our customers. We build products that solve real problems.",
  },
  {
    icon: Zap,
    title: "Move Fast",
    description:
      "We ship quickly, learn from feedback, and iterate. Speed is a feature.",
  },
  {
    icon: Heart,
    title: "Radical Transparency",
    description:
      "We share information openly and communicate honestly, even when it's hard.",
  },
]

const OPEN_POSITIONS = [
  {
    title: "Senior Software Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    href: "/careers/senior-software-engineer",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "New York, NY",
    type: "Full-time",
    href: "/careers/product-designer",
  },
  {
    title: "Data Scientist",
    department: "Data",
    location: "Remote",
    type: "Full-time",
    href: "/careers/data-scientist",
  },
  {
    title: "Customer Success Manager",
    department: "Operations",
    location: "San Francisco, CA",
    type: "Full-time",
    href: "/careers/customer-success-manager",
  },
  {
    title: "Compliance Analyst",
    department: "Legal & Compliance",
    location: "New York, NY",
    type: "Full-time",
    href: "/careers/compliance-analyst",
  },
  {
    title: "Marketing Manager",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
    href: "/careers/marketing-manager",
  },
]

const DEPARTMENTS = [
  { name: "Engineering", count: 12 },
  { name: "Product", count: 5 },
  { name: "Design", count: 4 },
  { name: "Marketing", count: 6 },
  { name: "Operations", count: 8 },
  { name: "Legal & Compliance", count: 3 },
]

const STATS = [
  { value: "500+", label: "Team Members" },
  { value: "30+", label: "Countries" },
  { value: "4.8", label: "Glassdoor Rating" },
  { value: "38", label: "Open Positions" },
]

export default async function CareersPage() {
  const contact = await getContactInfo()
  return (
    <>
      {/* Hero */}
      <section
        style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }}
        className="py-20 lg:py-24"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span
                  aria-hidden
                  style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }}
                />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                  We're Hiring
                </span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                Build the future of banking
              </h1>
              <p
                className="text-[16px] leading-relaxed mb-8 max-w-md"
                style={{ color: "var(--sh-ink-80)" }}
              >
                Join a team of passionate people working to make banking
                simple, secure, and accessible for everyone.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="#positions"
                  className={
                    LABEL + " inline-flex items-center px-7 py-3.5"
                  }
                  style={{
                    color: "var(--sh-bronze-dark)",
                    border: "0.5px solid " + BRONZE,
                    borderRadius: "2px",
                  }}
                >
                  View Open Positions
                </Link>
                <Link
                  href={contact.careers.href}
                  className="inline-flex items-center gap-1 text-[14px]"
                  style={{ color: INK }}
                >
                  Send us your resume
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.25} />
                </Link>
              </div>
            </div>

            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/corporate-meeting.jpg"
                alt="Safe Haven Private executives collaborating in a bright glass conference room"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        style={{ backgroundColor: "var(--sh-ink)", fontFamily: UI }}
        className="py-16"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="text-center p-6"
                style={{ border: "0.5px solid rgba(242,238,228,0.15)", borderRadius: "8px" }}
              >
                <p
                  className="text-3xl mb-1"
                  style={{ fontFamily: MONO, fontWeight: 400, color: "var(--sh-linen)" }}
                >
                  {stat.value}
                </p>
                <p className="text-[13px]" style={{ color: "var(--sh-linen-50)" }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section
        style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }}
        className="py-20 lg:py-24"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
            <div
              className="relative overflow-hidden aspect-[5/4] order-2 lg:order-1"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/business-team.jpg"
                alt="A small-business owner holding an OPEN sign, representing the clients our team serves"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <span
                  aria-hidden
                  style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }}
                />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                  Culture
                </span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                Our values
              </h2>
              <p
                className="text-[16px] leading-relaxed mb-8"
                style={{ color: "var(--sh-ink-80)" }}
              >
                The principles that guide how we work together.
              </p>

              <div className="space-y-6">
                {VALUES.map((value, i) => {
                  const Icon = value.icon
                  return (
                    <div
                      key={value.title}
                      className="flex items-start gap-4 pt-6"
                      style={i > 0 ? { borderTop: "0.5px solid var(--sh-ink-10)" } : undefined}
                    >
                      <Icon className="h-6 w-6 flex-shrink-0 mt-0.5" strokeWidth={1.25} style={{ color: BRONZE }} />
                      <div>
                        <h3 className="text-[18px] font-medium mb-1" style={{ color: INK }}>
                          {value.title}
                        </h3>
                        <p className="text-[15px] leading-relaxed" style={{ color: "var(--sh-ink-80)" }}>
                          {value.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section
        style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }}
        className="py-20 lg:py-24"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-6">
            <span
              aria-hidden
              style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }}
            />
            <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
              Benefits & Perks
            </span>
          </div>
          <h2
            className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4 max-w-xl"
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
          >
            We take care of our team
          </h2>
          <p
            className="text-[16px] leading-relaxed mb-12 max-w-xl"
            style={{ color: "var(--sh-ink-80)" }}
          >
            So they can take care of our customers.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon
              return (
                <div
                  key={benefit.title}
                  style={{
                    backgroundColor: "var(--sh-linen)",
                    border: "0.5px solid var(--sh-ink-10)",
                    borderRadius: "8px",
                  }}
                  className="p-7 flex items-start gap-4"
                >
                  <Icon className="h-6 w-6 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <div>
                    <h3 className="text-[18px] font-medium mb-1" style={{ color: INK }}>
                      {benefit.title}
                    </h3>
                    <p className="text-[14px] leading-relaxed" style={{ color: "var(--sh-ink-50)" }}>
                      {benefit.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section
        id="positions"
        style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }}
        className="py-20 lg:py-24"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-4 gap-12">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div
                className="relative overflow-hidden aspect-[3/4] mb-8 hidden lg:block"
                style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
              >
                <Image
                  src="/images/stock/entrepreneur.jpg"
                  alt="A Safe Haven Private team member at her desk"
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
              </div>

              <h3 className="text-[18px] font-medium mb-4" style={{ color: INK }}>
                Departments
              </h3>
              <div className="space-y-2">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-[15px] font-medium"
                  style={{
                    backgroundColor: "var(--sh-bronze-10)",
                    color: "var(--sh-bronze-dark)",
                    border: "0.5px solid " + BRONZE,
                    borderRadius: "2px",
                  }}
                >
                  All Positions
                  <span style={{ fontFamily: MONO }}>38</span>
                </button>
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept.name}
                    className="w-full flex items-center justify-between px-4 py-3 text-[15px] transition-colors"
                    style={{
                      color: "var(--sh-ink-80)",
                      border: "0.5px solid transparent",
                      borderRadius: "2px",
                    }}
                  >
                    {dept.name}
                    <span style={{ fontFamily: MONO }}>{dept.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Job Listings */}
            <div className="lg:col-span-3">
              <div className="flex items-center justify-between mb-8">
                <h2
                  className="text-[1.75rem] sm:text-[2rem] leading-[1.15]"
                  style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
                >
                  Open positions
                </h2>
                <p className="text-[14px]" style={{ color: "var(--sh-ink-50)" }}>
                  38 roles available
                </p>
              </div>

              <div className="space-y-4">
                {OPEN_POSITIONS.map((job) => (
                  <Link
                    key={job.title}
                    href={job.href}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-6 transition-colors hover:border-[#A67C3D]"
                    style={{
                      backgroundColor: "var(--sh-surface)",
                      border: "0.5px solid var(--sh-ink-10)",
                      borderRadius: "8px",
                    }}
                  >
                    <div className="mb-4 sm:mb-0">
                      <h3
                        className="text-[18px] font-medium mb-1 transition-colors"
                        style={{ color: INK }}
                      >
                        {job.title}
                      </h3>
                      <div
                        className="flex flex-wrap items-center gap-3 text-[14px]"
                        style={{ color: "var(--sh-ink-50)" }}
                      >
                        <span>{job.department}</span>
                        <span
                          aria-hidden
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: "var(--sh-ink-20)" }}
                        />
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" strokeWidth={1.25} />
                          {job.location}
                        </span>
                        <span
                          aria-hidden
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: "var(--sh-ink-20)" }}
                        />
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" strokeWidth={1.25} />
                          {job.type}
                        </span>
                      </div>
                    </div>
                    <ArrowRight
                      className="w-5 h-5 transition-transform group-hover:translate-x-1"
                      strokeWidth={1.25}
                      style={{ color: BRONZE }}
                    />
                  </Link>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/careers/all"
                  className="inline-flex items-center gap-1 text-[14px]"
                  style={{ color: INK }}
                >
                  View all 38 positions
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.25} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section
        style={{ backgroundColor: "var(--sh-ink)", fontFamily: UI }}
        className="py-20 lg:py-24"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-xl mx-auto">
            <h2
              className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: "var(--sh-linen)" }}
            >
              Don't see the right role?
            </h2>
            <p
              className="text-[16px] leading-relaxed mb-8"
              style={{ color: "var(--sh-linen-70)" }}
            >
              We're always looking for talented people. Send us your resume
              and we'll reach out when we have a role that fits.
            </p>
            <Link
              href={contact.careers.href}
              className={LABEL + " inline-flex items-center px-7 py-3.5"}
              style={{ color: BRONZE, border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
            >
              Send Your Resume
            </Link>
          </div>
        </div>
      </section>

    </>
  )
}
