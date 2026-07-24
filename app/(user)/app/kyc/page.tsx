"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Shield, CheckCircle2, Clock, XCircle, AlertTriangle,
  FileText, Upload, Camera, Image as ImageIcon, Loader2,
  X, RefreshCw, ChevronDown, ChevronUp, Scale, Lock, Eye, UserCheck,
} from "lucide-react"
import { UserHeader } from "@/components/user/UserHeader"
import { useThemeColors } from "@/components/shared/ThemeProvider"
import { COUNTRIES } from "@/lib/countries"
import {
  BANK_NAME, LEGAL_NAME, SUPPORT_EMAIL, COMPLIANCE_EMAIL,
  DOMAIN, SITE_URL, REGULATOR,
} from "@/lib/brand"

// ── Types ────────────────────────────────────────────────────────────────────

interface KycDoc {
  _id:         string
  docType:     string
  status:      string
  docUrl:      string | null
  docPublicId: string | null
  reviewNote:  string | null
  submittedAt: string
  reviewedAt:  string | null
}

// ── Constants ────────────────────────────────────────────────────────────────

const DOC_STATUS: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  pending:  { icon: Clock,         color: "#F59E0B", bg: "rgba(245,158,11,0.12)", label: "Under Review" },
  approved: { icon: CheckCircle2,  color: "#00C896", bg: "rgba(0,200,150,0.12)",  label: "Approved" },
  rejected: { icon: XCircle,       color: "#EF4444", bg: "rgba(239,68,68,0.12)",  label: "Rejected" },
}

const KYC_STATUS_MAP: Record<string, { icon: React.ElementType; color: string; title: string; desc: string }> = {
  verified:   { icon: CheckCircle2,  color: "#00C896", title: "Identity Verified",     desc: "Your identity has been verified. You have full access to all platform features." },
  unverified: { icon: AlertTriangle, color: "#F59E0B", title: "Unverified",            desc: "Upload your documents to verify your identity and unlock transfers." },
  pending:    { icon: Clock,         color: "#3B9EFF", title: "Verification Pending",   desc: "Your documents are being reviewed. This usually takes 1-2 business days." },
  rejected:   { icon: XCircle,       color: "#EF4444", title: "Verification Failed",    desc: "Some documents were rejected. Please review the reasons and resubmit." },
}

const REQUIRED_DOCS = [
  { key: "id",      label: "Government-issued Photo ID", desc: "Passport, driver's license, or national ID", types: ["passport", "drivers_license", "national_id"] },
  { key: "selfie",  label: "Selfie with ID",             desc: "Clear photo of you holding your ID",          types: ["selfie"] },
  { key: "address", label: "Proof of Address",           desc: "Utility bill or bank statement (last 3 months)", types: ["address_proof", "utility_bill"] },
]

const DOC_TYPE_OPTIONS = [
  { value: "passport",        label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "national_id",     label: "National ID" },
  { value: "selfie",          label: "Selfie with ID" },
  { value: "address_proof",   label: "Proof of Address" },
  { value: "utility_bill",    label: "Utility Bill" },
  { value: "ssn_proof",       label: "SSN Proof" },
]

function formatDocType(type: string): string {
  return DOC_TYPE_OPTIONS.find((o) => o.value === type)?.label || type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Terms of Service Sections ─────────────────────────────────────────────────

const KYC_TERMS_SECTIONS = [
  {
    id: "purpose",
    title: "Purpose of Identity Verification",
    icon: UserCheck,
    content: `${BANK_NAME} is committed to maintaining the highest standards of regulatory compliance and security. Identity verification (Know Your Customer or "KYC") is a mandatory process required by financial regulations to:

• Prevent money laundering, terrorist financing, and other financial crimes
• Protect your account from unauthorized access and identity theft
• Ensure compliance with applicable laws and regulations including the Bank Secrecy Act (BSA), Anti-Money Laundering (AML) directives, and ${REGULATOR} requirements
• Verify that you are the legitimate owner of your account
• Enable access to the full range of banking services including transfers, withdrawals, and higher transaction limits`,
  },
  {
    id: "data",
    title: "Information We Collect",
    icon: Eye,
    content: `During the verification process, we collect and process the following personal information:

**Identity Documents:**
• Government-issued photo identification (passport, driver's license, or national ID card)
• Selfie photograph for facial verification
• Proof of residential address (utility bill, bank statement, or government correspondence dated within the last 3 months)

**Personal Information:**
• Full legal name as it appears on your identification documents
• Date of birth
• Residential address
• Nationality and country of residence

All documents must be valid, unexpired, and clearly legible. We may request additional documentation if initial submissions are unclear or incomplete.`,
  },
  {
    id: "privacy",
    title: "Data Protection & Privacy",
    icon: Lock,
    content: `Your personal data is protected in accordance with applicable data protection laws including GDPR and relevant local regulations.

**How We Protect Your Data:**
• All documents are encrypted using AES-256 encryption during transmission and storage
• Access to verification documents is strictly limited to authorized compliance personnel
• Documents are stored on secure, certified cloud infrastructure
• We implement multi-factor authentication and audit logging for all data access

**Data Retention:**
• Verification documents are retained for the duration of your account relationship plus 5 years as required by regulatory obligations
• You may request deletion of your data subject to our legal retention requirements
• For data access, correction, or deletion requests, contact ${COMPLIANCE_EMAIL}

**Third-Party Processing:**
We may share your information with authorized third-party verification services and regulatory authorities as required by law. We do not sell your personal information to third parties.`,
  },
  {
    id: "obligations",
    title: "Your Obligations",
    icon: Scale,
    content: `By submitting documents for verification, you confirm and agree that:

• All information and documents provided are genuine, accurate, and belong to you
• You are not impersonating another person or using fraudulent documents
• You will notify ${BANK_NAME} immediately of any changes to your personal information
• You understand that providing false or misleading information is a criminal offense
• You consent to ${BANK_NAME} verifying your identity through third-party services
• You acknowledge that failure to complete verification may result in restricted account access
• You agree to provide additional documentation if requested by our compliance team

**Consequences of Non-Compliance:**
Failure to complete verification or providing fraudulent documents may result in:
• Suspension or termination of your account
• Reporting to relevant law enforcement and regulatory authorities
• Legal action to recover any losses incurred`,
  },
]

// ── Staged Document Type ─────────────────────────────────────────────────────

interface StagedDoc {
  file: File
  preview: string
  docType: string
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function KycPage() {
  const colors = useThemeColors()
  const [documents, setDocuments] = useState<KycDoc[]>([])
  const [kycStatus, setKycStatus] = useState("unverified")
  const [loading, setLoading] = useState(true)

  // Terms state
  const [termsExpanded, setTermsExpanded] = useState<string | null>(null)
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [hasReadTerms, setHasReadTerms] = useState(false)

  // Staged documents (all 3 must be filled before submission)
  const [stagedDocs, setStagedDocs] = useState<Record<string, StagedDoc>>({})
  const [activeDocKey, setActiveDocKey] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [supportEmail, setSupportEmail] = useState(SUPPORT_EMAIL)

  // Pull the admin-configured support email so it matches the rest of the app
  useEffect(() => {
    let active = true
    fetch("/api/public/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (active && d?.contact?.email) setSupportEmail(d.contact.email) })
      .catch(() => { /* keep default */ })
    return () => { active = false }
  }, [])
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Personal info for KYC (required for ID documents)
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [ssn, setSsn] = useState("")
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  })

  // SSN proof image — required for US-based customers
  const [ssnProof, setSsnProof] = useState<StagedDoc | null>(null)
  const ssnProofRef = useRef<HTMLInputElement | null>(null)

  // Show the SSN field for US-based customers
  const isUSCustomer = /^(us|usa|u\.s\.a?\.?|united states(?: of america)?|america)$/i.test(address.country.trim())
  const ssnDigits = ssn.replace(/\D/g, "")
  // US accounts must supply a valid 9-digit SSN and an uploaded proof image
  const usRequirementsMet = !isUSCustomer || (ssnDigits.length === 9 && !!ssnProof)

  // Track if user has expanded at least one terms section
  useEffect(() => {
    if (termsExpanded && !hasReadTerms) {
      setHasReadTerms(true)
    }
  }, [termsExpanded, hasReadTerms])

  const fetchKyc = useCallback(async () => {
    try {
      const res = await fetch("/api/user/kyc")
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents)
        setKycStatus(data.kycStatus)
      }
    } catch { /* */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchKyc() }, [fetchKyc])

  // Determine doc checklist status
  function getDocGroupStatus(types: string[]): "none" | "pending" | "approved" | "rejected" {
    const matching = documents.filter((d) => types.includes(d.docType))
    if (matching.some((d) => d.status === "approved")) return "approved"
    if (matching.some((d) => d.status === "pending"))  return "pending"
    if (matching.some((d) => d.status === "rejected")) return "rejected"
    return "none"
  }

  const approvedCount = REQUIRED_DOCS.filter((r) => getDocGroupStatus(r.types) === "approved").length

  // Check which docs still need to be uploaded (not already submitted/pending/approved)
  const pendingRequiredDocs = REQUIRED_DOCS.filter((r) => {
    const status = getDocGroupStatus(r.types)
    return status === "none" || status === "rejected"
  })

  // Count staged docs
  const stagedCount = Object.keys(stagedDocs).length
  const allDocsStaged = pendingRequiredDocs.length > 0 && stagedCount === pendingRequiredDocs.length

  // Handle file selection for a specific doc key
  function handleFileChange(docKey: string, docType: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File must be under 10MB")
      return
    }

    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!allowed.includes(file.type)) {
      setUploadError("Only JPG, PNG, WebP, or PDF files are accepted")
      return
    }

    setUploadError("")

    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setStagedDocs((prev) => ({
          ...prev,
          [docKey]: { file, preview: ev.target?.result as string, docType },
        }))
      }
      reader.readAsDataURL(file)
    } else {
      setStagedDocs((prev) => ({
        ...prev,
        [docKey]: { file, preview: "", docType },
      }))
    }
  }

  // Remove a staged doc
  function removeStagedDoc(docKey: string) {
    setStagedDocs((prev) => {
      const updated = { ...prev }
      delete updated[docKey]
      return updated
    })
    const ref = fileInputRefs.current[docKey]
    if (ref) ref.value = ""
  }

  // Handle SSN proof image selection (US customers)
  function handleSsnProofChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File must be under 10MB")
      return
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!allowed.includes(file.type)) {
      setUploadError("Only JPG, PNG, WebP, or PDF files are accepted")
      return
    }
    setUploadError("")

    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (ev) => setSsnProof({ file, preview: ev.target?.result as string, docType: "ssn_proof" })
      reader.readAsDataURL(file)
    } else {
      setSsnProof({ file, preview: "", docType: "ssn_proof" })
    }
  }

  function removeSsnProof() {
    setSsnProof(null)
    if (ssnProofRef.current) ssnProofRef.current.value = ""
  }

  // Check if personal info is complete (required for ID documents)
  const isPersonalInfoComplete = dateOfBirth && address.street && address.city && address.country

  // Upload all staged documents to Cloudinary then submit to API
  async function handleSubmitAll() {
    if (!allDocsStaged) return

    // Validate personal info is provided
    if (!isPersonalInfoComplete) {
      setUploadError("Please complete all personal information fields (date of birth and address)")
      return
    }

    // US-based customers must supply a valid SSN and an SSN proof image
    if (isUSCustomer && ssnDigits.length !== 9) {
      setUploadError("Please enter a valid 9-digit Social Security Number (SSN)")
      return
    }
    if (isUSCustomer && !ssnProof) {
      setUploadError("Please upload an image of your SSN proof")
      return
    }

    setUploading(true)
    setUploadError("")

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      if (!cloudName || !uploadPreset) {
        throw new Error("Upload service not configured. Please contact support.")
      }

      const submittedDocTypes = Object.values(stagedDocs).map((s) => s.docType)

      // Upload each staged document directly to Cloudinary (client-side)
      for (const docKey of Object.keys(stagedDocs)) {
        const staged = stagedDocs[docKey]

        // 1. Upload directly to Cloudinary (unsigned preset)
        const formData = new FormData()
        formData.append("file", staged.file)
        formData.append("upload_preset", uploadPreset)
        formData.append("folder", "kyc-documents")

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: "POST",
          body: formData,
        })
        
        const uploadData = await uploadRes.json()
        
        if (!uploadRes.ok) {
          console.error("Cloudinary upload error:", uploadData)
          throw new Error(uploadData.error?.message || `Failed to upload ${docKey}. Please try again.`)
        }

        // 2. Save document record to API (include personal info for ID documents)
        const isIdDocument = ["passport", "drivers_license", "national_id"].includes(staged.docType)
        const apiRes = await fetch("/api/user/kyc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            docType:     staged.docType,
            docUrl:      uploadData.secure_url,
            docPublicId: uploadData.public_id,
            // Include personal info only for ID documents
            ...(isIdDocument && {
              dateOfBirth,
              ssn: isUSCustomer && ssn ? ssn : undefined,
              address: {
                street:  address.street,
                city:    address.city,
                state:   address.state || undefined,
                zip:     address.zip || undefined,
                country: address.country,
              },
            }),
          }),
        })

        const apiData = await apiRes.json()
        if (!apiRes.ok) throw new Error(apiData.error || `Failed to submit ${docKey}`)
      }

      // Upload the SSN proof image for US-based customers
      if (isUSCustomer && ssnProof) {
        const ssnForm = new FormData()
        ssnForm.append("file", ssnProof.file)
        ssnForm.append("upload_preset", uploadPreset)
        ssnForm.append("folder", "kyc-documents")

        const ssnUploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: "POST",
          body: ssnForm,
        })
        const ssnUploadData = await ssnUploadRes.json()
        if (!ssnUploadRes.ok) {
          console.error("Cloudinary upload error:", ssnUploadData)
          throw new Error(ssnUploadData.error?.message || "Failed to upload SSN proof. Please try again.")
        }

        const ssnApiRes = await fetch("/api/user/kyc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            docType:     "ssn_proof",
            docUrl:      ssnUploadData.secure_url,
            docPublicId: ssnUploadData.public_id,
            ssn,
          }),
        })
        const ssnApiData = await ssnApiRes.json()
        if (!ssnApiRes.ok) throw new Error(ssnApiData.error || "Failed to submit SSN proof")
        submittedDocTypes.push("ssn_proof")
      }

      // One admin summary email per submission (fire-and-forget)
      fetch("/api/user/kyc/notify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docTypes: submittedDocTypes }),
      }).catch(() => {})

      // Reset and refresh
      setStagedDocs({})
      setActiveDocKey(null)
      setDateOfBirth("")
      setSsn("")
      setSsnProof(null)
      if (ssnProofRef.current) ssnProofRef.current.value = ""
      setAddress({ street: "", city: "", state: "", zip: "", country: "" })
      await fetchKyc()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  // Start upload for a specific doc (for resubmit of rejected docs)
  function triggerFileInput(docKey: string) {
    setActiveDocKey(docKey)
    fileInputRefs.current[docKey]?.click()
  }

  const statusCfg = KYC_STATUS_MAP[kycStatus] || KYC_STATUS_MAP.unverified
  const StatusIcon = statusCfg.icon

  return (
    <>
      <UserHeader title="Identity Verification" showBack />

      <div className="px-4 py-5 lg:px-6 space-y-5 max-w-[600px] mx-auto">
        {loading ? (
          <div className="space-y-3">
            <div className="h-28 rounded-2xl" style={{ background: colors.bgElevated }} />
            <div className="h-20 rounded-2xl" style={{ background: colors.bgElevated }} />
            <div className="h-40 rounded-2xl" style={{ background: colors.bgElevated }} />
          </div>
        ) : (
          <>
            {/* ── Status Hero ────────────────────────────────────────── */}
            <div className="rounded-2xl p-5 text-center" style={{ background: colors.bgElevated, border: `1px solid ${statusCfg.color}20` }}>
              <div
                className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: `${statusCfg.color}18` }}
              >
                <StatusIcon className="h-7 w-7" style={{ color: statusCfg.color }} />
              </div>
              <p className="text-[17px] font-semibold" style={{ color: colors.textPrimary }}>{statusCfg.title}</p>
              <p className="mt-1 text-[14px]" style={{ color: colors.textTertiary }}>{statusCfg.desc}</p>
            </div>

            {/* ── Terms of Service ────────────────────────────────────── */}
            {kycStatus === "unverified" && documents.length === 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
                <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: colors.blueBg }}>
                    <Scale className="h-[18px] w-[18px]" style={{ color: colors.blue }} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>
                      KYC Terms & Conditions
                    </p>
                    <p className="text-[11px]" style={{ color: colors.textMuted }}>
                      Please review before submitting documents
                    </p>
                  </div>
                </div>

                {/* Terms sections */}
                <div className="divide-y" style={{ borderColor: colors.border }}>
                  {KYC_TERMS_SECTIONS.map((section) => {
                    const isExpanded = termsExpanded === section.id
                    const SectionIcon = section.icon
                    return (
                      <div key={section.id}>
                        <button
                          onClick={() => setTermsExpanded(isExpanded ? null : section.id)}
                          className="w-full px-4 py-3.5 flex items-center gap-3 text-left transition-all"
                          style={{ background: isExpanded ? colors.bgHover : "transparent" }}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0" style={{ background: colors.bgHover }}>
                            <SectionIcon className="h-4 w-4" style={{ color: colors.textSecondary }} />
                          </div>
                          <span className="flex-1 text-[13px] font-medium" style={{ color: colors.textPrimary }}>
                            {section.title}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" style={{ color: colors.textMuted }} />
                          ) : (
                            <ChevronDown className="h-4 w-4" style={{ color: colors.textMuted }} />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="px-4 pb-4">
                            <div
                              className="rounded-xl p-4 text-[12px] leading-relaxed whitespace-pre-line"
                              style={{ background: colors.bgHover, color: colors.textSecondary }}
                            >
                              {section.content.split("**").map((part, i) =>
                                i % 2 === 1 ? (
                                  <strong key={i} style={{ color: colors.textPrimary }}>{part}</strong>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Agreement checkbox */}
                <div className="px-4 py-4" style={{ borderTop: `1px solid ${colors.border}` }}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={termsAgreed}
                        onChange={(e) => setTermsAgreed(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className="h-5 w-5 rounded flex items-center justify-center transition-all"
                        style={{
                          background: termsAgreed ? colors.green : "transparent",
                          border: termsAgreed ? "none" : `2px solid ${colors.border}`,
                        }}
                      >
                        {termsAgreed && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                      </div>
                    </div>
                    <span className="text-[12px] leading-relaxed" style={{ color: colors.textSecondary }}>
                      I have read and agree to the KYC Terms & Conditions. I understand that {BANK_NAME} will process my personal data in accordance with the{" "}
                      <a href={`${SITE_URL}/privacy`} target="_blank" rel="noopener noreferrer" style={{ color: colors.blue, textDecoration: "underline" }}>
                        Privacy Policy
                      </a>{" "}
                      and I consent to identity verification as described above.
                    </span>
                  </label>
                </div>

                {/* Contact info */}
                <div className="px-4 pb-4">
                  <div className="rounded-xl p-3 text-[11px]" style={{ background: colors.bgHover, color: colors.textMuted }}>
                    <p>
                      Questions about verification? Contact our compliance team at{" "}
                      <a href={`mailto:${COMPLIANCE_EMAIL}`} style={{ color: colors.blue }}>{COMPLIANCE_EMAIL}</a>
                    </p>
                    <p className="mt-1">
                      {LEGAL_NAME} is regulated by the {REGULATOR}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Required Documents Upload Section ────────────────────────── */}
            {kycStatus !== "verified" && pendingRequiredDocs.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                    Upload All Documents
                  </p>
                  <span className="text-[12px] font-semibold tabular-nums" style={{ color: allDocsStaged ? colors.green : colors.blue }}>
                    {stagedCount}/{pendingRequiredDocs.length} ready
                  </span>
                </div>

                {/* Progress bar */}
                <div className="px-4 pt-3 pb-1">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: colors.border }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(stagedCount / pendingRequiredDocs.length) * 100}%`,
                        background: allDocsStaged ? colors.green : colors.blue,
                      }}
                    />
                  </div>
                </div>

                {/* Show warning if terms not agreed (only for first-time users) */}
                {documents.length === 0 && !termsAgreed && (
                  <div className="mx-4 mt-3 rounded-xl p-3 flex items-start gap-2" style={{ background: colors.yellowBg, border: `1px solid ${colors.yellow}26` }}>
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.yellow }} />
                    <p className="text-[12px]" style={{ color: colors.yellow }}>
                      Please review and accept the KYC Terms & Conditions above before uploading documents.
                    </p>
                  </div>
                )}

                <div className="divide-y" style={{ borderColor: colors.border }}>
                  {pendingRequiredDocs.map((req) => {
                    const staged = stagedDocs[req.key]
                    const isStaged = !!staged
                    const groupStatus = getDocGroupStatus(req.types)
                    const isRejected = groupStatus === "rejected"

                    return (
                      <div key={req.key} className="px-4 py-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                            style={{
                              background: isStaged ? colors.greenBg : isRejected ? colors.redBg : colors.blueBg,
                            }}
                          >
                            {isStaged ? (
                              <CheckCircle2 className="h-[18px] w-[18px]" style={{ color: colors.green }} />
                            ) : isRejected ? (
                              <RefreshCw className="h-[18px] w-[18px]" style={{ color: colors.red }} />
                            ) : (
                              <Upload className="h-[18px] w-[18px]" style={{ color: colors.blue }} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium" style={{ color: colors.textPrimary }}>{req.label}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>{req.desc}</p>
                          </div>
                          {isStaged && (
                            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: colors.greenBg, color: colors.green }}>
                              Ready
                            </span>
                          )}
                        </div>

                        {/* Hidden file input */}
                        <input
                          ref={(el) => { fileInputRefs.current[req.key] = el }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={(e) => handleFileChange(req.key, req.types[0], e)}
                          className="hidden"
                          disabled={documents.length === 0 && !termsAgreed}
                        />

                        {!isStaged ? (
                          <button
                            onClick={() => triggerFileInput(req.key)}
                            disabled={documents.length === 0 && !termsAgreed}
                            className="w-full rounded-xl p-5 text-center transition-all active:scale-[0.99]"
                            style={{
                              background: colors.bgHover,
                              border: `2px dashed ${colors.border}`,
                              opacity: (documents.length === 0 && !termsAgreed) ? 0.5 : 1,
                            }}
                          >
                            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full" style={{ background: colors.blueBg }}>
                              <Camera className="h-4 w-4" style={{ color: colors.blue }} />
                            </div>
                            <p className="text-[13px] font-semibold" style={{ color: colors.textSecondary }}>
                              Tap to select file
                            </p>
                            <p className="text-[11px] mt-1" style={{ color: colors.textMuted }}>
                              JPG, PNG, WebP, or PDF — Max 10MB
                            </p>
                          </button>
                        ) : (
                          <div className="rounded-xl overflow-hidden" style={{ background: colors.bgHover, border: `1px solid ${colors.green}33` }}>
                            {staged.preview ? (
                              <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={staged.preview} alt="Preview" className="w-full max-h-[150px] object-contain" />
                                <button
                                  onClick={() => removeStagedDoc(req.key)}
                                  className="absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center"
                                  style={{ background: "rgba(0,0,0,0.6)" }}
                                >
                                  <X className="h-3.5 w-3.5 text-white" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 p-3">
                                <FileText className="h-5 w-5" style={{ color: colors.green }} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-medium truncate" style={{ color: colors.textPrimary }}>{staged.file.name}</p>
                                  <p className="text-[11px]" style={{ color: colors.textMuted }}>
                                    {(staged.file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                                <button onClick={() => removeStagedDoc(req.key)} className="p-1">
                                  <X className="h-4 w-4" style={{ color: colors.textMuted }} />
                                </button>
                              </div>
                            )}
                            <div className="px-3 py-2 flex items-center justify-between" style={{ borderTop: `1px solid ${colors.border}` }}>
                              <button
                                onClick={() => triggerFileInput(req.key)}
                                className="text-[12px] font-medium"
                                style={{ color: colors.blue }}
                              >
                                Change file
                              </button>
                              <span className="text-[11px]" style={{ color: colors.green }}>✓ Selected</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Personal Information Section */}
                <div className="px-4 py-4" style={{ borderTop: `1px solid ${colors.border}` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: colors.blueBg }}>
                      <FileText className="h-4 w-4" style={{ color: colors.blue }} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: colors.textPrimary }}>Personal Information</p>
                      <p className="text-[11px]" style={{ color: colors.textMuted }}>Required for identity verification</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Date of Birth */}
                    <div>
                      <label className="block text-[12px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                        className="w-full h-11 px-3 rounded-xl text-[14px] outline-none transition-all"
                        style={{
                          background: colors.bgHover,
                          border: `1px solid ${colors.border}`,
                          color: colors.textPrimary,
                        }}
                        disabled={documents.length === 0 && !termsAgreed}
                      />
                    </div>

                    {/* Street Address */}
                    <div>
                      <label className="block text-[12px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                        Street Address *
                      </label>
                      <input
                        type="text"
                        value={address.street}
                        onChange={(e) => setAddress((prev) => ({ ...prev, street: e.target.value }))}
                        placeholder="123 Main Street, Apt 4B"
                        className="w-full h-11 px-3 rounded-xl text-[14px] outline-none transition-all"
                        style={{
                          background: colors.bgHover,
                          border: `1px solid ${colors.border}`,
                          color: colors.textPrimary,
                        }}
                        disabled={documents.length === 0 && !termsAgreed}
                      />
                    </div>

                    {/* City and State */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                          City *
                        </label>
                        <input
                          type="text"
                          value={address.city}
                          onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
                          placeholder="New York"
                          className="w-full h-11 px-3 rounded-xl text-[14px] outline-none transition-all"
                          style={{
                            background: colors.bgHover,
                            border: `1px solid ${colors.border}`,
                            color: colors.textPrimary,
                          }}
                          disabled={documents.length === 0 && !termsAgreed}
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                          State / Province
                        </label>
                        <input
                          type="text"
                          value={address.state}
                          onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))}
                          placeholder="NY"
                          className="w-full h-11 px-3 rounded-xl text-[14px] outline-none transition-all"
                          style={{
                            background: colors.bgHover,
                            border: `1px solid ${colors.border}`,
                            color: colors.textPrimary,
                          }}
                          disabled={documents.length === 0 && !termsAgreed}
                        />
                      </div>
                    </div>

                    {/* ZIP and Country */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                          ZIP / Postal Code
                        </label>
                        <input
                          type="text"
                          value={address.zip}
                          onChange={(e) => setAddress((prev) => ({ ...prev, zip: e.target.value }))}
                          placeholder="10001"
                          className="w-full h-11 px-3 rounded-xl text-[14px] outline-none transition-all"
                          style={{
                            background: colors.bgHover,
                            border: `1px solid ${colors.border}`,
                            color: colors.textPrimary,
                          }}
                          disabled={documents.length === 0 && !termsAgreed}
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                          Country *
                        </label>
                        <div className="relative">
                          <select
                            value={address.country}
                            onChange={(e) => setAddress((prev) => ({ ...prev, country: e.target.value }))}
                            className="w-full h-11 pl-3 pr-9 rounded-xl text-[14px] outline-none transition-all appearance-none"
                            style={{
                              background: colors.bgHover,
                              border: `1px solid ${colors.border}`,
                              color: address.country ? colors.textPrimary : colors.textMuted,
                            }}
                            disabled={documents.length === 0 && !termsAgreed}
                          >
                            <option value="" disabled>Select country</option>
                            {COUNTRIES.map((c) => (
                              <option key={c} value={c} style={{ color: "#000" }}>{c}</option>
                            ))}
                          </select>
                          <ChevronDown
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4"
                            style={{ color: colors.textMuted }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* SSN — US customers only */}
                    {isUSCustomer && (
                      <>
                        <div>
                          <label className="block text-[12px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                            Social Security Number (SSN) *
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={ssn}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, "").slice(0, 9)
                              const formatted = digits.length > 5
                                ? `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
                                : digits.length > 3
                                  ? `${digits.slice(0, 3)}-${digits.slice(3)}`
                                  : digits
                              setSsn(formatted)
                            }}
                            placeholder="123-45-6789"
                            className="w-full h-11 px-3 rounded-xl text-[14px] outline-none transition-all"
                            style={{
                              background: colors.bgHover,
                              border: `1px solid ${colors.border}`,
                              color: colors.textPrimary,
                            }}
                            disabled={documents.length === 0 && !termsAgreed}
                          />
                          <p className="text-[11px] mt-1" style={{ color: colors.textMuted }}>
                            Required for US-based accounts. Your SSN is encrypted and used only for identity verification.
                          </p>
                        </div>

                        {/* SSN proof image upload — US customers only */}
                        <div>
                          <label className="block text-[12px] font-medium mb-1.5" style={{ color: colors.textSecondary }}>
                            SSN Proof (image) *
                          </label>
                          <input
                            ref={ssnProofRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={handleSsnProofChange}
                            className="hidden"
                            disabled={documents.length === 0 && !termsAgreed}
                          />
                          {!ssnProof ? (
                            <button
                              onClick={() => ssnProofRef.current?.click()}
                              disabled={documents.length === 0 && !termsAgreed}
                              className="w-full rounded-xl p-4 text-center transition-all active:scale-[0.99]"
                              style={{
                                background: colors.bgHover,
                                border: `2px dashed ${colors.border}`,
                                opacity: (documents.length === 0 && !termsAgreed) ? 0.5 : 1,
                              }}
                            >
                              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full" style={{ background: colors.blueBg }}>
                                <Camera className="h-4 w-4" style={{ color: colors.blue }} />
                              </div>
                              <p className="text-[13px] font-semibold" style={{ color: colors.textSecondary }}>
                                Upload SSN card or document
                              </p>
                              <p className="text-[11px] mt-1" style={{ color: colors.textMuted }}>
                                JPG, PNG, WebP, or PDF — Max 10MB
                              </p>
                            </button>
                          ) : (
                            <div className="rounded-xl overflow-hidden" style={{ background: colors.bgHover, border: `1px solid ${colors.green}33` }}>
                              {ssnProof.preview ? (
                                <div className="relative">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={ssnProof.preview} alt="SSN proof preview" className="w-full max-h-[150px] object-contain" />
                                  <button
                                    onClick={removeSsnProof}
                                    className="absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center"
                                    style={{ background: "rgba(0,0,0,0.6)" }}
                                  >
                                    <X className="h-3.5 w-3.5 text-white" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 p-3">
                                  <FileText className="h-5 w-5" style={{ color: colors.green }} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[13px] font-medium truncate" style={{ color: colors.textPrimary }}>{ssnProof.file.name}</p>
                                    <p className="text-[11px]" style={{ color: colors.textMuted }}>
                                      {(ssnProof.file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                  <button onClick={removeSsnProof} className="p-1">
                                    <X className="h-4 w-4" style={{ color: colors.textMuted }} />
                                  </button>
                                </div>
                              )}
                              <div className="px-3 py-2 flex items-center justify-between" style={{ borderTop: `1px solid ${colors.border}` }}>
                                <button onClick={() => ssnProofRef.current?.click()} className="text-[12px] font-medium" style={{ color: colors.blue }}>
                                  Change file
                                </button>
                                <span className="text-[11px]" style={{ color: colors.green }}>✓ Selected</span>
                              </div>
                            </div>
                          )}
                          <p className="text-[11px] mt-1" style={{ color: colors.textMuted }}>
                            Upload a clear photo of your Social Security card or an official SSN document.
                          </p>
                        </div>
                      </>
                    )}

                    {/* Info note */}
                    <p className="text-[11px] mt-2" style={{ color: colors.textMuted }}>
                      This information must match your ID document and will be saved to your profile upon verification.
                    </p>
                  </div>
                </div>

                {/* Error */}
                {uploadError && (
                  <div className="mx-4 mb-4 rounded-xl p-3 flex items-start gap-2" style={{ background: colors.redBg, border: `1px solid ${colors.red}26` }}>
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: colors.red }} />
                    <p className="text-[13px]" style={{ color: colors.red }}>{uploadError}</p>
                  </div>
                )}

                {/* Submit All Button */}
                <div className="p-4" style={{ borderTop: `1px solid ${colors.border}` }}>
                  <button
                    onClick={handleSubmitAll}
                    disabled={!allDocsStaged || !isPersonalInfoComplete || !usRequirementsMet || uploading}
                    className="w-full h-12 rounded-xl text-[15px] font-semibold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{
                      background: (!allDocsStaged || !isPersonalInfoComplete || !usRequirementsMet || uploading) ? colors.bgHover : colors.green,
                      opacity: (!allDocsStaged || !isPersonalInfoComplete || !usRequirementsMet || uploading) ? 0.5 : 1,
                      color: (!allDocsStaged || !isPersonalInfoComplete || !usRequirementsMet || uploading) ? colors.textMuted : "white",
                    }}
                  >
                    {uploading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Uploading documents...</>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" /> Submit All Documents
                      </>
                    )}
                  </button>
                  {!allDocsStaged && (
                    <p className="text-[11px] text-center mt-2" style={{ color: colors.textMuted }}>
                      Please upload all {pendingRequiredDocs.length} documents before submitting
                    </p>
                  )}
                  {allDocsStaged && !isPersonalInfoComplete && (
                    <p className="text-[11px] text-center mt-2" style={{ color: colors.textMuted }}>
                      Please complete all required personal information fields
                    </p>
                  )}
                  {allDocsStaged && isPersonalInfoComplete && !usRequirementsMet && (
                    <p className="text-[11px] text-center mt-2" style={{ color: colors.textMuted }}>
                      US-based accounts must enter a valid SSN and upload SSN proof
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Approved/Pending Documents Status ────────────────────────── */}
            {approvedCount > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
                <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                    Verification Progress
                  </p>
                  <span className="text-[12px] font-semibold tabular-nums" style={{ color: approvedCount === REQUIRED_DOCS.length ? colors.green : colors.blue }}>
                    {approvedCount}/{REQUIRED_DOCS.length} verified
                  </span>
                </div>

                <div className="divide-y" style={{ borderColor: colors.border }}>
                  {REQUIRED_DOCS.map((req) => {
                    const groupStatus = getDocGroupStatus(req.types)
                    if (groupStatus === "none" || groupStatus === "rejected") return null
                    const cfg = DOC_STATUS[groupStatus]
                    const CfgIcon = cfg.icon

                    return (
                      <div key={req.key} className="flex items-center gap-3 px-4 py-3.5">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                          style={{ background: cfg.bg }}
                        >
                          <CfgIcon className="h-[18px] w-[18px]" style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium" style={{ color: colors.textPrimary }}>{req.label}</p>
                          <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>{req.desc}</p>
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Submitted Documents ──────────────────────────────────── */}
            {documents.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: colors.bgElevated, border: `1px solid ${colors.border}` }}>
                <div className="px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <p className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: colors.textTertiary }}>
                    Submitted Documents
                  </p>
                </div>
                <div className="divide-y" style={{ borderColor: colors.border }}>
                  {documents.map((doc) => {
                    const cfg = DOC_STATUS[doc.status] || DOC_STATUS.pending
                    const Icon = cfg.icon
                    return (
                      <div key={doc._id} className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: cfg.bg }}>
                            <FileText className="h-[18px] w-[18px]" style={{ color: cfg.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-medium" style={{ color: colors.textPrimary }}>{formatDocType(doc.docType)}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
                              {new Date(doc.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </p>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1" style={{ background: cfg.bg }}>
                            <Icon className="h-3 w-3" style={{ color: cfg.color }} />
                            <span className="text-[11px] font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                          </span>
                        </div>

                        {/* Rejection reason */}
                        {doc.reviewNote && doc.status === "rejected" && (
                          <div className="mt-3 rounded-xl p-3" style={{ background: colors.redBg }}>
                            <p className="text-[12px]" style={{ color: colors.red }}>
                              <span className="font-semibold">Reason: </span>{doc.reviewNote}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Info note ───────────────────────────────────────────── */}
            <div className="rounded-xl p-4" style={{ background: colors.blueBg, border: `1px solid ${colors.blue}14` }}>
              <p className="text-[12px] leading-relaxed" style={{ color: colors.textSecondary }}>
                <span className="font-semibold" style={{ color: colors.blue }}>Note:</span>{" "}
                Documents are reviewed within 1-2 business days. You&apos;ll receive a notification once each document is reviewed. All documents must be clear, unedited, and show your full legal name.
              </p>
              <p className="text-[11px] mt-2" style={{ color: colors.textMuted }}>
                Need help? Contact us at{" "}
                <a href={`mailto:${supportEmail}`} style={{ color: colors.blue }}>{supportEmail}</a>
              </p>
            </div>
          </>
        )}
      </div>
    </>
  )
}
