"use client"

import { useState }    from "react"
import { X, Download, ExternalLink, ZoomIn, ZoomOut } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface Props {
  proofUrl: string
  onClose:  () => void
}

export function ProofModal({ proofUrl, onClose }: Props) {
  const [zoomed, setZoomed] = useState(false)
  const isPDF = proofUrl.toLowerCase().includes(".pdf")

  const download = () => {
    const a    = document.createElement("a")
    a.href     = proofUrl
    a.download = `proof-${Date.now()}`
    a.target   = "_blank"
    a.click()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl p-0" showClose={false}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <p className="text-sm font-semibold text-slate-800">Proof of Payment</p>
          <div className="flex items-center gap-2">
            {!isPDF && (
              <button
                onClick={() => setZoomed((z) => !z)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
              >
                {zoomed ? <ZoomOut className="h-3.5 w-3.5" /> : <ZoomIn className="h-3.5 w-3.5" />}
                {zoomed ? "Fit" : "Zoom"}
              </button>
            )}
            <button
              onClick={download}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>
            <a
              href={proofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
            >
              <ExternalLink className="h-3.5 w-3.5" /> New tab
            </a>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex items-center justify-center bg-slate-900 p-4" style={{ minHeight: 360 }}>
          {isPDF ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-700 text-white text-2xl font-bold">
                PDF
              </div>
              <p className="text-sm text-slate-300">PDF documents cannot be previewed here.</p>
              <a
                href={proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-[#1A2CCE] px-4 py-2 text-sm font-medium text-white hover:bg-[#1A2CCE]/90"
              >
                Open PDF
              </a>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={proofUrl}
              alt="Proof of payment"
              onClick={() => setZoomed((z) => !z)}
              className="cursor-zoom-in rounded transition-all duration-200"
              style={
                zoomed
                  ? { maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }
                  : { maxWidth: "100%", maxHeight: 480, objectFit: "contain", cursor: "zoom-in" }
              }
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
