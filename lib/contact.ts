import { SUPPORT_EMAIL } from "@/lib/brand"

/* ══════════════════════════════════════════════════════════════════════════
   Contact / support details. Admin-configurable via AppSettings; every public
   and user-facing page resolves through here so the phone, text number, email,
   and address stay in one place.
   ══════════════════════════════════════════════════════════════════════════ */

export const DEFAULT_SUPPORT_PHONE   = "1-800-123-4567"
export const DEFAULT_SUPPORT_ADDRESS = "Friedrichstraße 123, 10117 Berlin, Germany"

export interface OfficeInfo {
  city:         string
  type:         string
  addressLine1: string
  addressLine2: string
  phone:        string
}

export interface DepartmentInfo {
  name:        string
  description: string
  email:       string
}

export const DEFAULT_OFFICES: OfficeInfo[] = [
  { city: "Berlin",    type: "Headquarters",     addressLine1: "Friedrichstraße 123",  addressLine2: "10117 Berlin, Germany",            phone: "+49 30 1234 5678" },
  { city: "Frankfurt", type: "Financial Center", addressLine1: "Mainzer Landstraße 45", addressLine2: "60329 Frankfurt am Main, Germany", phone: "+49 69 9876 5432" },
  { city: "Munich",    type: "Regional Office",  addressLine1: "Maximilianstraße 78",   addressLine2: "80539 München, Germany",           phone: "+49 89 5555 1234" },
]

export const DEFAULT_DEPARTMENTS: DepartmentInfo[] = [
  { name: "General Support",  description: "Account questions, technical issues, general inquiries", email: "" },
  { name: "Business Banking", description: "Business accounts, commercial services, partnerships",   email: "" },
  { name: "Media & Press",    description: "Press inquiries, media requests, public relations",       email: "" },
]

export interface ContactSettings {
  supportPhone?:     string | null
  supportTextPhone?: string | null
  supportEmail?:     string | null
  supportAddress?:   string | null
  supportOffices?:     OfficeInfo[] | null
  supportDepartments?: DepartmentInfo[] | null
  careersEmail?:    string | null
  complianceEmail?: string | null
  privacyEmail?:    string | null
  legalEmail?:      string | null
}

export interface EmailLink { address: string; href: string }

export interface ContactInfo {
  phone:      string   // display number for calling
  textPhone:  string   // display number for SMS/text (falls back to phone)
  email:      string
  address:    string
  phoneHref:  string   // tel:
  textHref:   string   // sms:
  emailHref:  string   // mailto:
  /** true when a distinct text/SMS number is configured (or a number exists to text) */
  canText:    boolean
  offices:     OfficeInfo[]
  /** departments with a resolved email (falls back to the main support email) + mailto href */
  departments: (DepartmentInfo & { emailHref: string })[]
  /** specialised inbox addresses (blank ones fall back to the main support email) */
  careers:    EmailLink
  compliance: EmailLink
  privacy:    EmailLink
  legal:      EmailLink
}

/** Strip a display number down to a dialable value for tel:/sms: hrefs. */
function dialable(n: string): string {
  const cleaned = n.replace(/[^\d+]/g, "")
  return cleaned
}

/** Pure resolver — safe on both server and client. */
export function resolveContactInfo(s?: ContactSettings | null): ContactInfo {
  const phone     = (s?.supportPhone     || "").trim() || DEFAULT_SUPPORT_PHONE
  const textPhone = (s?.supportTextPhone || "").trim() || phone
  const email     = (s?.supportEmail     || "").trim() || SUPPORT_EMAIL
  const address   = (s?.supportAddress   || "").trim() || DEFAULT_SUPPORT_ADDRESS

  const offices = (s?.supportOffices && s.supportOffices.length > 0)
    ? s.supportOffices
    : DEFAULT_OFFICES

  const rawDepartments = (s?.supportDepartments && s.supportDepartments.length > 0)
    ? s.supportDepartments
    : DEFAULT_DEPARTMENTS
  const departments = rawDepartments.map((d) => {
    const deptEmail = (d.email || "").trim() || email  // fall back to the main support email
    return { ...d, email: deptEmail, emailHref: `mailto:${deptEmail}` }
  })

  // Specialised inboxes — each falls back to the main support email when blank.
  const emailLink = (v?: string | null): EmailLink => {
    const address = (v || "").trim() || email
    return { address, href: `mailto:${address}` }
  }

  return {
    phone,
    textPhone,
    email,
    address,
    phoneHref: `tel:${dialable(phone)}`,
    textHref:  `sms:${dialable(textPhone)}`,
    emailHref: `mailto:${email}`,
    canText:   dialable(textPhone).length > 0,
    offices,
    departments,
    careers:    emailLink(s?.careersEmail),
    compliance: emailLink(s?.complianceEmail),
    privacy:    emailLink(s?.privacyEmail),
    legal:      emailLink(s?.legalEmail),
  }
}

/**
 * Server-side fetch of the resolved contact info from AppSettings.
 * Import ONLY from server components / route handlers. Consumers should render
 * dynamically (the public layout is force-dynamic) so admin edits show at once.
 */
export async function getContactInfo(): Promise<ContactInfo> {
  try {
    const { connectDB }      = await import("@/lib/db/connection")
    const { default: AppSettings, APP_SETTINGS_ID } = await import("@/lib/models/AppSettings")
    await connectDB()
    const s = await AppSettings.findById(APP_SETTINGS_ID)
      .select("supportPhone supportTextPhone supportEmail supportAddress supportOffices supportDepartments careersEmail complianceEmail privacyEmail legalEmail")
      .lean()
    return resolveContactInfo(s as ContactSettings | null)
  } catch {
    return resolveContactInfo(null)
  }
}
