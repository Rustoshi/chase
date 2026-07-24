"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MethodIcon } from "../MethodIcon"
import { renderMarkdownLite } from "@/lib/utils/markdownLite"

interface MethodLike {
  _id?: string
  id?: string
  name: string
  type: string
  depositTarget: string
  instructions?: string
  minAmount: number
  maxAmount?: number
  feePercent: number
  feeFixed: number
}

interface Props {
  method:      MethodLike | null
  open:        boolean
  onOpenChange:(v: boolean) => void
}

function feeLabel(method: MethodLike): string {
  if (method.feePercent > 0 && method.feeFixed > 0)
    return `${method.feePercent}% + $${method.feeFixed} fee`
  if (method.feePercent > 0) return `${method.feePercent}% fee`
  if (method.feeFixed   > 0) return `$${method.feeFixed} flat fee`
  return "No fee"
}

export function InstructionsPreviewModal({ method, open, onOpenChange }: Props) {
  if (!method) return null

  const maxLabel = method.maxAmount ? `$${method.maxAmount.toLocaleString()}` : "Unlimited"
  const html     = method.instructions ? renderMarkdownLite(method.instructions) : "<em>No instructions provided.</em>"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MethodIcon type={method.type as Parameters<typeof MethodIcon>[0]["type"]} name={method.name} size="sm" />
            {method.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Meta pills */}
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              method.depositTarget === "bitcoin" ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"
            }`}>
              → {method.depositTarget === "bitcoin" ? "Bitcoin wallet" : "Fiat account"}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
              Min: ${method.minAmount} / Max: {maxLabel}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              method.feePercent === 0 && method.feeFixed === 0
                ? "bg-emerald-100 text-emerald-700"
                : "bg-orange-100 text-orange-700"
            }`}>
              {feeLabel(method)}
            </span>
          </div>

          {/* Instructions */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 min-h-[80px] max-h-[360px] overflow-y-auto">
            <div
              className="prose prose-sm max-w-none text-gray-700 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>

          <p className="text-xs text-gray-400 italic text-center">
            This is how users will see this payment method
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
