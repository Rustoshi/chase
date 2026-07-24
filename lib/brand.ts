/** Bank / brand name — reads from NEXT_PUBLIC_BANK_NAME env var at build time */
export const BANK_NAME = process.env.NEXT_PUBLIC_BANK_NAME || "NovaPay"

/** Support email — reads from NEXT_PUBLIC_SUPPORT_EMAIL env var */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@novapay.com"

/** Compliance email — reads from NEXT_PUBLIC_COMPLIANCE_EMAIL env var */
export const COMPLIANCE_EMAIL = process.env.NEXT_PUBLIC_COMPLIANCE_EMAIL || "compliance@novapay.com"

/** Website domain — reads from NEXT_PUBLIC_DOMAIN env var */
export const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || "novapay.com"

/** Website URL — reads from NEXT_PUBLIC_SITE_URL env var */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://novapay.com"

/** Company legal name — reads from NEXT_PUBLIC_LEGAL_NAME env var */
export const LEGAL_NAME = process.env.NEXT_PUBLIC_LEGAL_NAME || "NovaPay Financial Services Ltd."

/** Company registration number — reads from NEXT_PUBLIC_REGISTRATION_NUMBER env var */
export const REGISTRATION_NUMBER = process.env.NEXT_PUBLIC_REGISTRATION_NUMBER || ""

/** Regulatory authority — reads from NEXT_PUBLIC_REGULATOR env var */
export const REGULATOR = process.env.NEXT_PUBLIC_REGULATOR || "Financial Conduct Authority"

/**
 * Physical postal address shown in email footers. A real mailing address is
 * required by CAN-SPAM and its absence is a well-known deliverability penalty —
 * mail without one is far more likely to be filtered as spam.
 */
export const POSTAL_ADDRESS = process.env.NEXT_PUBLIC_POSTAL_ADDRESS || "Friedrichstraße 123, 10117 Berlin, Germany"
