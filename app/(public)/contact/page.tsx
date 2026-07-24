import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"
import { getContactInfo } from "@/lib/contact"
import { ChatLink } from "@/components/shared/ChatLink"
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Building2,
  HelpCircle,
  ArrowRight,
} from "lucide-react"

const INK = "#17140F"
const BRONZE = "#A67C3D"
const DISPLAY = "var(--sh-font-display)" // Newsreader — headings only
const UI = "var(--sh-font-ui)" // General Sans — body/UI/buttons
const MONO = "var(--sh-font-mono)" // Spline Sans Mono — figures/amounts/rates
const LABEL = "text-[11px] uppercase tracking-[0.09em] font-medium"

export const metadata: Metadata = {
  title: `Contact Us | ${BANK_NAME}`,
  description: `Get in touch with ${BANK_NAME}. We're here to help with any questions about your account, products, or services.`,
}

// Icons cycled across the admin-configured department contacts
const DEPT_ICONS = [HelpCircle, Building2, MessageCircle]

const HOURS = [
  { label: "Live Chat", value: "24/7" },
  { label: "Phone Support", value: "Mon–Fri, 8am–8pm ET" },
  { label: "Email Response", value: "Within 24 hours" },
]

export default async function ContactPage() {
  const contact = await getContactInfo()

  const CONTACT_METHODS = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team for instant help",
      detail: "Available 24/7",
      detailIsMono: false,
      action: "Start Chat",
      href: "#chat",
      isChat: true,
      action2: undefined as string | undefined,
      href2:   undefined as string | undefined,
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly or text with a support specialist",
      detail: contact.phone,
      detailIsMono: true,
      action: "Call Now",
      href: contact.phoneHref,
      isChat: false,
      action2: "Text Us" as string | undefined,
      href2:   contact.textHref as string | undefined,
    },
    {
      icon: Mail,
      title: "Email Us",
      description: "Send us a detailed message",
      detail: contact.email,
      detailIsMono: false,
      action: "Send Email",
      href: contact.emailHref,
      isChat: false,
      action2: undefined as string | undefined,
      href2:   undefined as string | undefined,
    },
  ]

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
                  Contact
                </span>
              </div>
              <h1
                className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] leading-[1.08] mb-6"
                style={{ fontFamily: DISPLAY, fontWeight: 300, color: INK }}
              >
                Get in touch
              </h1>
              <p className="text-[16px] leading-relaxed mb-8 max-w-md" style={{ color: "var(--sh-ink-80)" }}>
                Have a question or need assistance? We&apos;re here to help. Choose the
                best way to reach us below, or send our team a message directly.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Link
                  href="#contact-form"
                  className={LABEL + " inline-flex items-center px-7 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px" }}
                >
                  Send a message
                </Link>
                <a href={contact.phoneHref} className="text-[14px] inline-flex items-center gap-1" style={{ color: INK }}>
                  Call {contact.phone} <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.25} />
                </a>
              </div>
            </div>
            <div
              className="relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/reception.jpg"
                alt="Support specialist holding a headset, ready to assist clients"
                fill
                sizes="(max-width:1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-4">
            <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
              How to reach us
            </span>
          </div>
          <h2
            className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-12 max-w-xl"
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
          >
            Choose the channel that works for you
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {CONTACT_METHODS.map((method) => {
              const Icon = method.icon
              return (
                <div
                  key={method.title}
                  className="group p-7 block transition-colors"
                  style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                >
                  <Icon className="h-6 w-6 mb-6" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <h3 className="text-[18px] font-medium mb-2" style={{ color: INK }}>
                    {method.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed mb-4" style={{ color: "var(--sh-ink-80)" }}>
                    {method.description}
                  </p>
                  <p
                    className="mb-6 text-[15px]"
                    style={
                      method.detailIsMono
                        ? { fontFamily: MONO, fontWeight: 400, color: INK }
                        : { color: INK, fontWeight: 500 }
                    }
                  >
                    {method.detail}
                  </p>
                  <div className="flex items-center gap-6">
                    {method.isChat ? (
                      <ChatLink className={LABEL + " inline-flex items-center gap-1"} style={{ color: "var(--sh-bronze-dark)" }}>
                        {method.action}
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.25} />
                      </ChatLink>
                    ) : (
                      <a href={method.href} className={LABEL + " inline-flex items-center gap-1"} style={{ color: "var(--sh-bronze-dark)" }}>
                        {method.action}
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.25} />
                      </a>
                    )}
                    {method.href2 && (
                      <a href={method.href2} className={LABEL + " inline-flex items-center gap-1"} style={{ color: "var(--sh-bronze-dark)" }}>
                        {method.action2}
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.25} />
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
                <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                  Message us
                </span>
              </div>
              <h2
                className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                Send us a message
              </h2>
              <p className="text-[16px] leading-relaxed mb-8" style={{ color: "var(--sh-ink-80)" }}>
                Fill out the form and our team will get back to you within 24 hours.
              </p>

              <div
                className="relative overflow-hidden aspect-[3/2] mb-8"
                style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
              >
                <Image
                  src="/images/stock/advisor-desk.jpg"
                  alt="A Safe Haven Private advisor assisting a client at the service desk"
                  fill
                  sizes="(max-width:1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              {/* Department Contacts */}
              <div className="space-y-4">
                {contact.departments.map((dept, i) => {
                  const Icon = DEPT_ICONS[i % DEPT_ICONS.length]
                  return (
                    <div
                      key={dept.name || i}
                      className="p-4"
                      style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
                    >
                      <div className="flex items-start gap-4">
                        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" strokeWidth={1.25} style={{ color: BRONZE }} />
                        <div>
                          <h4 className="text-[15px] font-medium" style={{ color: INK }}>
                            {dept.name}
                          </h4>
                          <p className="text-[14px] mb-1" style={{ color: "var(--sh-ink-50)" }}>
                            {dept.description}
                          </p>
                          <a href={dept.emailHref} className="text-[14px] hover:underline" style={{ color: "var(--sh-bronze-dark)" }}>
                            {dept.email}
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Form */}
            <div className="p-8" style={{ backgroundColor: "var(--sh-surface)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}>
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className={LABEL + " block mb-2"} style={{ color: "var(--sh-ink-50)" }}>
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "2px", color: INK }}
                      className="w-full px-4 py-3 text-[15px] focus:outline-none focus:border-[#A67C3D]"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className={LABEL + " block mb-2"} style={{ color: "var(--sh-ink-50)" }}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "2px", color: INK }}
                      className="w-full px-4 py-3 text-[15px] focus:outline-none focus:border-[#A67C3D]"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className={LABEL + " block mb-2"} style={{ color: "var(--sh-ink-50)" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "2px", color: INK }}
                    className="w-full px-4 py-3 text-[15px] focus:outline-none focus:border-[#A67C3D]"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className={LABEL + " block mb-2"} style={{ color: "var(--sh-ink-50)" }}>
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "2px", color: INK }}
                    className="w-full px-4 py-3 text-[15px] focus:outline-none focus:border-[#A67C3D]"
                  >
                    <option value="">Select a topic</option>
                    <option value="account">Account Question</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing Inquiry</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className={LABEL + " block mb-2"} style={{ color: "var(--sh-ink-50)" }}>
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "2px", color: INK }}
                    className="w-full px-4 py-3 text-[15px] focus:outline-none focus:border-[#A67C3D] resize-none"
                    placeholder="How can we help you?"
                  />
                </div>
                <button
                  type="submit"
                  className={LABEL + " w-full inline-flex items-center justify-center px-7 py-3.5"}
                  style={{ color: "var(--sh-bronze-dark)", border: "0.5px solid " + BRONZE, borderRadius: "2px", backgroundColor: "transparent" }}
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      {contact.offices.length > 0 && (
      <section style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3 mb-4">
            <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
              Our locations
            </span>
          </div>
          <h2
            className="text-[1.75rem] sm:text-[2rem] leading-[1.15] mb-4 max-w-xl"
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
          >
            Visit us at one of our offices
          </h2>
          <p className="text-[16px] leading-relaxed mb-12 max-w-2xl" style={{ color: "var(--sh-ink-80)" }}>
            Visit us at one of our locations around the world.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {contact.offices.map((office, i) => (
              <div
                key={office.city || i}
                className="p-7"
                style={{ backgroundColor: "var(--sh-linen)", border: "0.5px solid var(--sh-ink-10)", borderRadius: "8px" }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <MapPin className="h-6 w-6" strokeWidth={1.25} style={{ color: BRONZE }} />
                  <div>
                    <h3 className="text-[18px] font-medium" style={{ color: INK }}>
                      {office.city}
                    </h3>
                    <p className={LABEL} style={{ color: "var(--sh-ink-50)" }}>
                      {office.type}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-[14px]" style={{ color: "var(--sh-ink-80)" }}>
                  {office.addressLine1 && <p>{office.addressLine1}</p>}
                  {office.addressLine2 && <p>{office.addressLine2}</p>}
                  {office.phone && (
                    <a
                      href={`tel:${office.phone.replace(/[^\d+]/g, "")}`}
                      className="flex items-center gap-2 pt-2"
                      style={{ fontFamily: MONO, color: INK }}
                    >
                      <Phone className="h-4 w-4" strokeWidth={1.25} style={{ color: BRONZE }} />
                      {office.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Support Hours — dark anchor */}
      <section style={{ backgroundColor: "var(--sh-ink)", fontFamily: UI }} className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 flex-shrink-0" strokeWidth={1.25} style={{ color: BRONZE }} />
              <div>
                <h3 className="text-[18px] font-medium" style={{ color: "var(--sh-linen)" }}>
                  Support Hours
                </h3>
                <p className="text-[14px]" style={{ color: "var(--sh-linen-70)" }}>
                  We&apos;re here when you need us
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-10 text-center md:text-left">
              {HOURS.map((h) => (
                <div key={h.label}>
                  <p className={LABEL} style={{ color: "var(--sh-linen-70)" }}>
                    {h.label}
                  </p>
                  <p className="text-[15px] mt-1" style={{ fontFamily: MONO, fontWeight: 400, color: "var(--sh-linen)" }}>
                    {h.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
