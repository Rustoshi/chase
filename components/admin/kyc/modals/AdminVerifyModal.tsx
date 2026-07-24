"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button }    from "@/components/ui/button"
import { Input }     from "@/components/ui/input"
import { Label }     from "@/components/ui/label"
import { useToast }  from "@/components/ui/use-toast"
import { UploadCloud, CheckCircle2, Loader2, ShieldCheck, X } from "lucide-react"

interface Props {
  userId:       string
  userName:     string
  open:         boolean
  onOpenChange: (v: boolean) => void
  onSuccess:    () => void
}

interface Uploaded { url: string; publicId: string }

const ID_TYPES = [
  { value: "passport",        label: "Passport" },
  { value: "drivers_license", label: "Driver's license" },
  { value: "national_id",     label: "National ID" },
] as const

async function uploadToCloudinary(file: File, folder: string): Promise<Uploaded> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  if (!cloudName || !uploadPreset) throw new Error("Upload service not configured")

  const fd = new FormData()
  fd.append("file", file)
  fd.append("upload_preset", uploadPreset)
  fd.append("folder", folder)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: "POST", body: fd })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || "Upload failed")
  return { url: data.secure_url as string, publicId: data.public_id as string }
}

/** A single upload slot that pushes the file to Cloudinary on select. */
function FileField({
  label, required, value, onChange, onError,
}: {
  label: string
  required?: boolean
  value: Uploaded | null
  onChange: (v: Uploaded | null) => void
  onError: (msg: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      onError("Only image or PDF files are allowed")
      return
    }
    if (file.size > 10 * 1024 * 1024) { onError("File must be under 10MB"); return }
    setBusy(true)
    try {
      const up = await uploadToCloudinary(file, "kyc-documents")
      onChange(up)
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-gray-700">
        {label} {required ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal">(optional)</span>}
      </Label>
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span className="text-sm text-emerald-800 flex-1 truncate">Uploaded</span>
          <a href={value.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">View</a>
          <button type="button" onClick={() => onChange(null)} className="text-gray-400 hover:text-red-500" aria-label="Remove">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex w-full items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2.5 text-left hover:border-indigo-400 hover:bg-indigo-50/40 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> : <UploadCloud className="h-4 w-4 text-gray-400" />}
          <span className="text-sm text-gray-600">{busy ? "Uploading…" : "Click to upload"}</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handle} />
    </div>
  )
}

export function AdminVerifyModal({ userId, userName, open, onOpenChange, onSuccess }: Props) {
  const { toast } = useToast()

  const [idType, setIdType]         = useState<(typeof ID_TYPES)[number]["value"]>("passport")
  const [idDoc, setIdDoc]           = useState<Uploaded | null>(null)
  const [selfie, setSelfie]         = useState<Uploaded | null>(null)
  const [addressProof, setAddressProof] = useState<Uploaded | null>(null)

  const [dateOfBirth, setDateOfBirth] = useState("")
  const [ssn, setSsn]         = useState("")
  const [street, setStreet]   = useState("")
  const [city, setCity]       = useState("")
  const [state, setState]     = useState("")
  const [zip, setZip]         = useState("")
  const [country, setCountry] = useState("")

  const [submitting, setSubmitting] = useState(false)

  const derivedTier = addressProof ? 3 : 2
  const isUSCustomer = /^(us|usa|u\.s\.a?\.?|united states(?: of america)?|america)$/i.test(country.trim())

  function reset() {
    setIdType("passport"); setIdDoc(null); setSelfie(null); setAddressProof(null)
    setDateOfBirth(""); setSsn(""); setStreet(""); setCity(""); setState(""); setZip(""); setCountry("")
  }

  function onError(msg: string) {
    toast({ title: "Upload error", description: msg, variant: "destructive" })
  }

  async function submit() {
    if (!idDoc) { toast({ title: "A photo ID is required", variant: "destructive" }); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/kyc/${userId}/admin-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idDocType: idType,
          idDocUrl: idDoc.url,
          idDocPublicId: idDoc.publicId,
          selfieUrl: selfie?.url,
          selfiePublicId: selfie?.publicId,
          addressProofUrl: addressProof?.url,
          addressProofPublicId: addressProof?.publicId,
          dateOfBirth: dateOfBirth || undefined,
          ssn: isUSCustomer && ssn ? ssn : undefined,
          address: (street || city || state || zip || country)
            ? { street, city, state, zip, country }
            : undefined,
          tier: derivedTier,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to verify")
      toast({ title: `${userName} verified`, description: `KYC set to verified (Tier ${data.kycTier}).` })
      reset()
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !submitting) { reset(); onOpenChange(false) } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Verify {userName}
          </DialogTitle>
          <DialogDescription>
            Upload the client&apos;s documents on their behalf and verify their account in one step. Documents are stored as approved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ID type + upload */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Photo ID type <span className="text-red-500">*</span></Label>
            <div className="flex gap-2">
              {ID_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setIdType(t.value)}
                  className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                    idType === t.value ? "border-[#1A2CCE] bg-indigo-50 text-[#1A2CCE]" : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <FileField label="Photo ID document" required value={idDoc} onChange={setIdDoc} onError={onError} />
          <FileField label="Selfie" value={selfie} onChange={setSelfie} onError={onError} />
          <FileField label="Address proof" value={addressProof} onChange={setAddressProof} onError={onError} />

          {/* Personal info */}
          <div className="pt-2 border-t border-gray-100 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="av-dob" className="text-xs font-medium text-gray-700">Date of birth <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Input id="av-dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700">Address <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Input placeholder="Street" value={street} onChange={(e) => setStreet(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                <Input placeholder="State / Province" value={state} onChange={(e) => setState(e.target.value)} />
                <Input placeholder="ZIP / Postal code" value={zip} onChange={(e) => setZip(e.target.value)} />
                <Input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>

            {isUSCustomer && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-700">Social Security Number (SSN)</Label>
                <Input
                  inputMode="numeric"
                  placeholder="123-45-6789"
                  value={ssn}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 9)
                    const f = digits.length > 5 ? `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`
                      : digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits
                    setSsn(f)
                  }}
                />
                <p className="text-xs text-gray-400">Collected for US-based accounts.</p>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5 text-xs text-gray-600">
            This account will be set to <strong className="text-emerald-700">Verified</strong> at{" "}
            <strong>Tier {derivedTier}</strong> {derivedTier === 3 ? "(with address proof)" : "(add an address proof for Tier 3)"}.
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => { reset(); onOpenChange(false) }} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={submitting || !idDoc}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {submitting ? "Verifying…" : "Verify user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
