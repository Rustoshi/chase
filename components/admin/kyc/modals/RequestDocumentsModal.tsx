"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button }    from "@/components/ui/button"
import { Label }     from "@/components/ui/label"
import { useToast }  from "@/components/ui/use-toast"

const DOC_TYPE_OPTIONS = [
  { value: "passport",        label: "Passport",          hint: "Government-issued passport" },
  { value: "drivers_license", label: "Driver's license",  hint: "Valid state/country driver's license" },
  { value: "national_id",     label: "National ID",       hint: "Government-issued national identity card" },
  { value: "selfie",          label: "Selfie",            hint: "Clear photo of face, no filters" },
  { value: "address_proof",   label: "Address proof",     hint: "Bank statement or utility bill" },
  { value: "utility_bill",    label: "Utility bill",      hint: "Recent gas, electric, or water bill" },
]

const MESSAGE_PRESETS = [
  {
    label: "Blurry image",
    message: "The document image submitted was too blurry to verify. Please resubmit a clear, well-lit photograph.",
  },
  {
    label: "Expired document",
    message: "The document you submitted appears to be expired. Please submit a valid, current document.",
  },
  {
    label: "Missing document",
    message: "We require additional documents to complete your verification. Please submit the documents listed below.",
  },
]

interface Props {
  userId:    string
  userName:  string
  open:      boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
}

export function RequestDocumentsModal({ userId, userName, open, onOpenChange, onSuccess }: Props) {
  const { toast }                  = useToast()
  const [docTypes, setDocTypes]    = useState<string[]>([])
  const [message,  setMessage]     = useState("")
  const [submitting, setSubmitting] = useState(false)

  function toggleDocType(v: string) {
    setDocTypes((prev) => prev.includes(v) ? prev.filter((t) => t !== v) : [...prev, v])
  }

  async function submit() {
    if (!message.trim() || docTypes.length === 0) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/kyc/${userId}/request-documents`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ docTypes, message: message.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error((data.error as string) ?? "Failed")
      toast({ title: "Request sent", description: `${userName} has been notified to resubmit documents.` })
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Request additional documents</DialogTitle>
          <p className="text-sm text-gray-500">From: {userName}</p>
        </DialogHeader>

        <div className="space-y-5">
          {/* Doc types */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Documents needed</Label>
            <div className="space-y-2">
              {DOC_TYPE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={docTypes.includes(opt.value)}
                    onChange={() => toggleDocType(opt.value)}
                    className="mt-0.5 accent-[#1A2CCE]"
                  />
                  <div>
                    <p className="text-sm font-medium group-hover:text-[#1A2CCE] transition-colors">{opt.label}</p>
                    <p className="text-xs text-gray-500">{opt.hint}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Message to user</Label>
              <div className="flex gap-1">
                {MESSAGE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setMessage(p.message)}
                    className="text-xs px-2 py-0.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Please resubmit your identity documents. The following were not accepted: ..."
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#1A2CCE] focus:border-[#1A2CCE]"
            />
            <p className="text-xs text-gray-400 mt-1">{message.length} chars</p>
          </div>

          {/* Preview */}
          {message.trim() && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview notification</p>
              <p className="text-sm font-semibold text-gray-900">Additional documents required</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{message.trim()}</p>
              {docTypes.length > 0 && (
                <p className="text-sm text-gray-600">
                  Required documents: {docTypes.map((t) => DOC_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t).join(", ")}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={!message.trim() || docTypes.length === 0 || submitting}
            className="bg-[#1A2CCE] hover:bg-[#1A2CCE]/90"
          >
            {submitting ? "Sending…" : "Send request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
