"use client"

import { useState, useEffect } from "react"
import { Loader2, AlertTriangle } from "lucide-react"
import { Button }   from "@/components/ui/button"
import { Label }    from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export interface ReasonModalConfig {
  title:        string
  description?: string
  label?:       string
  placeholder?: string
  confirmLabel: string
  minLength?:   number
  tone?:        "danger" | "default"
  onConfirm:    (reason: string) => Promise<void>
}

export function ReasonModal({
  config,
  open,
  onOpenChange,
}: {
  config:       ReasonModalConfig | null
  open:         boolean
  onOpenChange: (v: boolean) => void
}) {
  const [reason,     setReason]     = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) { setReason(""); setSubmitting(false) }
  }, [open, config])

  if (!config) return null

  const minLen = config.minLength ?? 1
  const valid  = reason.trim().length >= minLen
  const danger = config.tone === "danger"

  async function submit() {
    if (!valid || !config) return
    setSubmitting(true)
    try {
      await config.onConfirm(reason.trim())
      onOpenChange(false)
    } catch {
      // Keep the modal open; the caller surfaces the error via toast.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 pr-6">
            {danger && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              </span>
            )}
            <DialogTitle>{config.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6 pt-4 space-y-4">
          {config.description && (
            <p className="text-sm text-gray-500 leading-relaxed">{config.description}</p>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-600">{config.label ?? "Reason"}</Label>
            <Textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={config.placeholder ?? "Enter a reason…"}
              autoFocus
              className="resize-none text-sm"
            />
            {config.minLength ? (
              <p className="text-xs text-gray-400">
                {reason.trim().length}/{config.minLength} characters minimum
              </p>
            ) : (
              <p className="text-xs text-gray-400">This reason is shared with the client.</p>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button
              variant={danger ? "destructive" : "default"}
              onClick={submit}
              disabled={!valid || submitting}
              className={`w-full sm:w-auto ${danger ? "" : "bg-[#1A2CCE] hover:bg-[#1A2CCE]/90"}`}
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Working…</> : config.confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
