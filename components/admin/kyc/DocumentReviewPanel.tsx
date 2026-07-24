"use client"

import { useState } from "react"
import Image        from "next/image"
import { CheckCircle2, XCircle, RotateCw, ZoomIn, ZoomOut, ExternalLink, Download, FileText, MapPin, Calendar } from "lucide-react"
import { Button }   from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

// ── Types ─────────────────────────────────────────────────────────────────────

interface KycDoc {
  _id?:        string
  id?:         string
  docType:     string
  docUrl?:     string
  status:      string
  reviewNote?: string
  reviewedBy?: string
  reviewedAt?: string
  submittedAt: string
  dateOfBirth?: string
  ssn?: string
  address?: {
    street?:  string
    city?:    string
    state?:   string
    zip?:     string
    country?: string
  }
}

interface Props {
  document:     KycDoc
  idDocUrl?:    string
  onApprove:    () => void
  onReject:     (reason: string) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DOC_TYPE_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  passport:        { label: "Passport",         bg: "bg-indigo-100",   text: "text-indigo-800"   },
  drivers_license: { label: "Driver's License", bg: "bg-teal-100",   text: "text-teal-800"   },
  national_id:     { label: "National ID",      bg: "bg-purple-100", text: "text-purple-800" },
  selfie:          { label: "Selfie",           bg: "bg-pink-100",   text: "text-pink-800"   },
  address_proof:   { label: "Address Proof",    bg: "bg-amber-100",  text: "text-amber-800"  },
  utility_bill:    { label: "Utility Bill",     bg: "bg-slate-100",  text: "text-slate-800"  },
  ssn_proof:       { label: "SSN Proof",        bg: "bg-rose-100",   text: "text-rose-800"   },
}

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  pending:  { label: "Pending review", bg: "bg-amber-100",  text: "text-amber-800"  },
  approved: { label: "Approved",       bg: "bg-green-100",  text: "text-green-800"  },
  rejected: { label: "Rejected",       bg: "bg-red-100",    text: "text-red-700"    },
}

const REJECTION_REASONS = [
  "Image too blurry",
  "Document expired",
  "Name doesn't match",
  "Document cropped",
  "Wrong document type",
  "Suspected forgery",
]

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(url)
}

function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url)
}

function relativeDate(d: string): string {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return "just now"
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DocumentReviewPanel({ document: doc, idDocUrl, onApprove, onReject }: Props) {
  const { toast }                   = useToast()
  const [zoom,       setZoom]       = useState(1)
  const [rotation,   setRotation]   = useState(0)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason,     setReason]     = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [optimistic, setOptimistic] = useState<string | null>(null)

  const docId    = String(doc._id ?? doc.id)
  const typeInfo = DOC_TYPE_STYLES[doc.docType] ?? { label: doc.docType, bg: "bg-gray-100", text: "text-gray-700" }
  const status   = optimistic ?? doc.status
  const statusInfo = STATUS_STYLES[status] ?? STATUS_STYLES.pending

  const isSelfie  = doc.docType === "selfie"
  const docUrl    = doc.docUrl ?? ""
  const isImage   = docUrl ? isImageUrl(docUrl) : false
  const isPdf     = docUrl ? isPdfUrl(docUrl)   : false
  
  // Check if this is an ID document with personal info
  const isIdDocument = ["passport", "drivers_license", "national_id"].includes(doc.docType)
  const hasPersonalInfo = doc.dateOfBirth || doc.ssn || (doc.address && (doc.address.street || doc.address.city || doc.address.country))

  async function handleApprove() {
    const prev = optimistic
    setOptimistic("approved")
    setSubmitting(true)
    try {
      const res  = await fetch(`/api/admin/kyc/documents/${docId}/approve`, { method: "POST" })
      const data = await res.json() as Record<string, unknown>
      if (!res.ok) throw new Error((data.error as string) ?? "Failed")
      toast({ title: "Document approved" })
      onApprove()
    } catch (err) {
      setOptimistic(prev)
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReject() {
    if (!reason.trim() || reason.length < 5) return
    const prev = optimistic
    setOptimistic("rejected")
    setSubmitting(true)
    try {
      const res  = await fetch(`/api/admin/kyc/documents/${docId}/reject`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ reason: reason.trim() }),
      })
      const data = await res.json() as Record<string, unknown>
      if (!res.ok) throw new Error((data.error as string) ?? "Failed")
      toast({ title: "Document rejected" })
      setRejectOpen(false)
      onReject(reason.trim())
    } catch (err) {
      setOptimistic(prev)
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeInfo.bg} ${typeInfo.text}`}>
            {typeInfo.label}
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusInfo.bg} ${statusInfo.text}`}>
            {statusInfo.label}
          </span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {docUrl && (
            <a
              href={docUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg border border-indigo-200 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View
            </a>
          )}
          <div className="text-right text-xs text-gray-500 hidden sm:block">
            <p>Submitted {relativeDate(doc.submittedAt)}</p>
            <p className="text-gray-400">{new Date(doc.submittedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Personal Info Section - for ID documents */}
      {isIdDocument && hasPersonalInfo && (
        <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100">
          <p className="text-xs font-semibold text-indigo-800 mb-2">Submitted Personal Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {doc.dateOfBirth && (
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-indigo-600 font-medium">Date of Birth</p>
                  <p className="text-sm text-gray-900">{new Date(doc.dateOfBirth).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
              </div>
            )}
            {doc.address && (doc.address.street || doc.address.city || doc.address.country) && (
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-indigo-600 font-medium">Address</p>
                  <p className="text-sm text-gray-900">
                    {[
                      doc.address.street,
                      doc.address.city,
                      doc.address.state,
                      doc.address.zip,
                      doc.address.country,
                    ].filter(Boolean).join(", ")}
                  </p>
                </div>
              </div>
            )}
            {doc.ssn && (
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-indigo-600 font-medium">SSN</p>
                  <p className="text-sm text-gray-900 font-mono">{doc.ssn}</p>
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-indigo-600 mt-2 italic">
            This information will be saved to the user&apos;s profile upon approval.
          </p>
        </div>
      )}

      {/* Image area */}
      <div className="p-4 space-y-3">
        {isSelfie && idDocUrl ? (
          // Side-by-side comparison for selfie
          <div className="grid grid-cols-2 gap-3">
            {[{ url: docUrl, label: "Selfie" }, { url: idDocUrl, label: "ID photo" }].map(({ url, label }) => (
              <div key={label} className="space-y-1">
                <p className="text-xs font-medium text-center text-gray-600">{label}</p>
                <div className="relative bg-gray-100 rounded-xl overflow-hidden" style={{ height: 200 }}>
                  {url && isImageUrl(url) ? (
                    <Image src={url} alt={label} fill className="object-contain" unoptimized />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">No image</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : !docUrl ? (
          <div className="flex items-center justify-center h-32 bg-gray-100 rounded-xl text-gray-400 text-sm">
            No document uploaded
          </div>
        ) : isImage ? (
          <div className="space-y-2">
            {/* Image controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                className="p-1.5 rounded border border-gray-200 hover:bg-gray-50"><ZoomIn className="w-3.5 h-3.5" /></button>
              <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="p-1.5 rounded border border-gray-200 hover:bg-gray-50"><ZoomOut className="w-3.5 h-3.5" /></button>
              <span className="text-xs text-gray-500">{Math.round(zoom * 100)}%</span>
              <button onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 rounded border border-gray-200 hover:bg-gray-50 ml-1"><RotateCw className="w-3.5 h-3.5" /></button>
              <div className="ml-auto flex gap-2">
                <a href={docUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                  <ExternalLink className="w-3 h-3" /> Full size
                </a>
                <a href={docUrl} download
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                  <Download className="w-3 h-3" /> Download
                </a>
              </div>
            </div>
            {/* Image container */}
            <div className="bg-gray-100 rounded-xl overflow-auto border" style={{ maxHeight: 400 }}>
              <div className="flex items-center justify-center min-h-[200px] p-2">
                <img
                  src={docUrl}
                  alt="Document"
                  style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, transformOrigin: "center", maxWidth: "100%", maxHeight: 360 }}
                  className="transition-transform duration-200"
                />
              </div>
            </div>
          </div>
        ) : isPdf ? (
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
            <FileText className="w-8 h-8 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900">PDF Document</p>
              <p className="text-xs text-gray-500">Cannot preview PDF inline.</p>
              <a href={docUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:underline mt-1 inline-flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> View PDF
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 h-32 bg-gray-100 rounded-xl text-gray-500 text-sm">
            <span>Preview unavailable</span>
            <a href={docUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50">
              <ExternalLink className="w-3.5 h-3.5" /> Open document
            </a>
          </div>
        )}

        {/* Existing review note */}
        {doc.reviewNote && (
          <div className={`text-sm rounded-lg px-3 py-2 ${status === "approved" ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
            <span className="font-medium">{status === "approved" ? "Approval note" : "Rejection reason"}: </span>
            {doc.reviewNote}
          </div>
        )}

        {/* Decision area — only for pending */}
        {status === "pending" && (
          <div className="space-y-2 pt-1 border-t border-gray-100">
            {!rejectOpen ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleApprove}
                  disabled={submitting}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRejectOpen(true)}
                  disabled={submitting}
                  className="gap-1.5 border-red-300 text-red-600 hover:bg-red-50 flex-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </Button>
              </div>
            ) : (
              <div className="space-y-2 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-medium text-red-700">Rejection reason</p>
                {/* Quick-select chips */}
                <div className="flex flex-wrap gap-1">
                  {REJECTION_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`text-xs px-2 py-0.5 rounded border transition-colors ${reason === r ? "bg-red-600 text-white border-red-600" : "bg-white border-red-200 text-red-700 hover:border-red-400"}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Describe the issue…"
                  className="w-full text-sm border border-red-200 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-red-400 bg-white"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleReject}
                    disabled={!reason.trim() || reason.length < 5 || submitting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Submit rejection
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setRejectOpen(false); setReason("") }}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
