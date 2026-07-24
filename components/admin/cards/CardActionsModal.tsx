"use client"

import Link from "next/link"
import {
  Eye, XCircle, Snowflake, Sun, Ban as BlockIcon, ShieldCheck,
  Truck, PackageCheck, SlidersHorizontal, Settings2,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CardBrandMark } from "@/components/CardBrandLogo"
import type { CardListItem } from "@/lib/services/card.service"

export type CardAction =
  | "review" | "reject" | "freeze" | "unfreeze"
  | "block" | "unblock" | "cancel" | "limits" | "ship" | "deliver"

const STATUS_PILL: Record<string, string> = {
  pending:   "bg-amber-100  text-amber-700",
  active:    "bg-emerald-100 text-emerald-700",
  frozen:    "bg-indigo-100 text-indigo-700",
  blocked:   "bg-rose-100   text-rose-700",
  rejected:  "bg-red-100    text-red-700",
  cancelled: "bg-gray-100   text-gray-500",
  approved:  "bg-sky-100    text-sky-700",
}

interface Row {
  action: CardAction
  label:  string
  icon:   React.ElementType
  tone?:  "danger" | "default"
}

function actionsForStatus(card: CardListItem): Row[] {
  switch (card.status) {
    case "pending":
      return [
        { action: "review", label: "Review application", icon: Eye },
        { action: "reject", label: "Reject application", icon: XCircle, tone: "danger" },
      ]
    case "approved":
      return [
        ...(card.deliveryStatus !== "shipped"
          ? [{ action: "ship" as CardAction, label: "Mark as shipped", icon: Truck }]
          : []),
        { action: "deliver", label: "Mark as delivered (activate)", icon: PackageCheck },
        { action: "cancel",  label: "Cancel card", icon: XCircle, tone: "danger" },
      ]
    case "active":
      return [
        { action: "limits",   label: "Update limits", icon: SlidersHorizontal },
        { action: "freeze",   label: "Freeze card",   icon: Snowflake },
        { action: "block",    label: "Block card",    icon: BlockIcon, tone: "danger" },
        { action: "cancel",   label: "Cancel card",   icon: XCircle,   tone: "danger" },
      ]
    case "frozen":
      return [
        { action: "unfreeze", label: "Unfreeze card", icon: Sun },
        { action: "block",    label: "Block card",    icon: BlockIcon, tone: "danger" },
        { action: "cancel",   label: "Cancel card",   icon: XCircle,   tone: "danger" },
      ]
    case "blocked":
      return [
        { action: "unblock",  label: "Unblock card",  icon: ShieldCheck },
        { action: "cancel",   label: "Cancel card",   icon: XCircle, tone: "danger" },
      ]
    default:
      return []
  }
}

export function CardActionsModal({
  card,
  open,
  onClose,
  onAction,
}: {
  card:     CardListItem | null
  open:     boolean
  onClose:  () => void
  onAction: (action: CardAction, card: CardListItem) => void
}) {
  if (!card) return null

  const rows  = actionsForStatus(card)
  const last4 = card.cardNumber ? card.cardNumber.slice(-4) : "••••"

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Card actions</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 pt-4 space-y-4">
          {/* Card summary */}
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <CardBrandMark network={card.cardNetwork} className="h-6 w-auto flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{card.userName}</p>
              <p className="text-xs text-gray-500 font-mono truncate">•••• {last4} · {card.cardType.replace("_", " ")}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${STATUS_PILL[card.status] ?? "bg-gray-100 text-gray-500"}`}>
              {card.status === "approved" && !card.isVirtual ? "in delivery" : card.status}
            </span>
          </div>

          {/* Status-specific actions */}
          {rows.length > 0 && (
            <div className="space-y-2">
              {rows.map((r) => {
                const Icon = r.icon
                const danger = r.tone === "danger"
                return (
                  <button
                    key={r.action}
                    onClick={() => onAction(r.action, card)}
                    className={`w-full flex items-center gap-3 rounded-lg border px-3.5 py-3 text-sm font-medium transition-colors ${
                      danger
                        ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {r.label}
                  </button>
                )
              })}
            </div>
          )}

          {/* Manage — full card editor */}
          <div className="pt-1 space-y-1.5">
            <Link
              href={`/admin/cards/${card.id}`}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#1A2CCE] px-3 py-3 text-sm font-semibold text-white hover:bg-[#1A2CCE]/90 transition-colors"
            >
              <Settings2 className="w-4 h-4" /> Manage card
            </Link>
            <p className="text-center text-[11px] text-gray-400">
              Edit card number, limits, status and more
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
