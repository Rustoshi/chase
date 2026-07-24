"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CheckCircle2, Search, ChevronLeft, ChevronRight,
  CreditCard, Wifi,
} from "lucide-react"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { CardReviewDrawer }  from "./CardReviewDrawer"
import { UpdateLimitsModal } from "./UpdateLimitsModal"
import { ReasonModal, type ReasonModalConfig } from "./ReasonModal"
import { CardActionsModal, type CardAction } from "./CardActionsModal"
import type { CardListItem, CardStats, CardDetail } from "@/lib/services/card.service"

interface InitialData {
  cards: CardListItem[]
  total: number
  pages: number
  stats: CardStats
}

const TABS = ["all", "pending", "approved", "active", "frozen", "blocked", "rejected", "cancelled"] as const
type Tab   = typeof TABS[number]

const CARD_TYPE_TABS = [
  { value: "", label: "All types" },
  { value: "virtual_debit",   label: "Virtual debit" },
  { value: "physical_debit",  label: "Physical debit" },
  { value: "virtual_credit",  label: "Virtual credit" },
  { value: "physical_credit", label: "Physical credit" },
]

const STATUS_PILL: Record<string, string> = {
  pending:   "bg-amber-100  text-amber-700",
  active:    "bg-emerald-100 text-emerald-700",
  frozen:    "bg-indigo-100   text-indigo-700",
  blocked:   "bg-rose-100   text-rose-700",
  rejected:  "bg-red-100    text-red-700",
  cancelled: "bg-gray-100   text-gray-500",
  approved:  "bg-sky-100    text-sky-700",
}

const CARD_TYPE_PILL: Record<string, string> = {
  virtual_debit:   "bg-slate-100  text-slate-700",
  physical_debit:  "bg-indigo-100   text-indigo-700",
  virtual_credit:  "bg-amber-100  text-amber-700",
  physical_credit: "bg-orange-100 text-orange-700",
}

const KYC_PILL: Record<string, string> = {
  verified:   "bg-emerald-100 text-emerald-700",
  pending:    "bg-amber-100   text-amber-700",
  rejected:   "bg-red-100     text-red-700",
  unverified: "bg-gray-100    text-gray-500",
}

// Compact currency for stat tiles so large totals never overflow (e.g. $1.2M)
const fmtCompact = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 })

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 30)  return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function CardsClient({ initialData }: { initialData: InitialData }) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { toast }    = useToast()

  const [data,        setData]        = useState(initialData)
  const [loading,     setLoading]     = useState(false)
  const [reviewId,    setReviewId]    = useState<string | null>(null)
  const [limitsCard,  setLimitsCard]  = useState<CardDetail | null>(null)
  const [reasonModal, setReasonModal] = useState<ReasonModalConfig | null>(null)
  const [actionsCard, setActionsCard] = useState<CardListItem | null>(null)
  const [newBanner,   setNewBanner]   = useState(false)
  const prevCountRef                   = useRef(initialData.stats.pendingCount)
  const debounceRef                    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeTab = (searchParams.get("tab")      as Tab) ?? "all"
  const cardType  = searchParams.get("cardType")  ?? ""
  const search    = searchParams.get("search")    ?? ""
  const page      = Number(searchParams.get("page") ?? 1)
  const sortOrder = searchParams.get("sortOrder") ?? "desc"

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    if (key !== "page") params.set("page", "1")
    router.replace(`?${params.toString()}`, { scroll: false })
  }

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page:  String(page),
        limit: "20",
        sortBy: "appliedAt", sortOrder,
        ...(activeTab !== "all" ? { status: activeTab } : {}),
        ...(cardType ? { cardType }  : {}),
        ...(search   ? { search }    : {}),
      })
      const res  = await fetch(`/api/admin/cards?${params}`, { signal })
      if (!res.ok) return
      const json = await res.json()
      setData(json)
      if (activeTab === "pending") {
        const curr = json.stats.pendingCount as number
        if (curr > prevCountRef.current) setNewBanner(true)
        prevCountRef.current = curr
      }
    } catch (err) {
      // Ignore abort errors - these are expected when component unmounts
      if (err instanceof Error && err.name === "AbortError") return
      console.error("Failed to fetch cards:", err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, cardType, search, page, sortOrder])

  useEffect(() => {
    const ctrl = new AbortController()
    fetchData(ctrl.signal)
    return () => ctrl.abort()
  }, [fetchData])

  useEffect(() => {
    if (activeTab !== "pending") return
    const id = setInterval(() => fetchData(), 60_000)
    return () => clearInterval(id)
  }, [activeTab, fetchData])

  async function doAction(
    cardId:   string,
    endpoint: string,
    method:   "POST" | "PATCH",
    body?:    Record<string, unknown>
  ) {
    const res  = await fetch(`/api/admin/cards/${cardId}/${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? "Action failed")
    return data
  }

  async function fetchCardDetail(id: string): Promise<CardDetail> {
    const res  = await fetch(`/api/admin/cards/${id}`)
    return res.json()
  }

  async function updateDelivery(id: string, deliveryStatus: "processing" | "shipped" | "delivered") {
    try {
      await doAction(id, "delivery", "POST", { deliveryStatus })
      toast({ title: deliveryStatus === "delivered" ? "Delivered — card activated" : `Marked as ${deliveryStatus}` })
      fetchData()
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    }
  }

  // Open a styled reason modal for an admin action (replaces native prompt()).
  function openReason(opts: {
    cardId:      string
    endpoint:    string
    title:       string
    description?: string
    confirmLabel: string
    successMsg:  string
    minLength?:  number
    tone?:       "danger" | "default"
  }) {
    setReasonModal({
      title:        opts.title,
      description:  opts.description,
      confirmLabel: opts.confirmLabel,
      minLength:    opts.minLength,
      tone:         opts.tone,
      onConfirm: async (reason) => {
        try {
          await doAction(opts.cardId, opts.endpoint, "POST", { reason })
          toast({ title: opts.successMsg })
          fetchData()
        } catch (err) {
          toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
          throw err // keep the modal open on failure
        }
      },
    })
  }

  // Dispatch an action chosen from the row actions modal.
  async function handleCardAction(action: CardAction, card: CardListItem) {
    setActionsCard(null) // close the actions modal first
    switch (action) {
      case "review":
        setReviewId(card.id)
        break
      case "reject":
        openReason({ cardId: card.id, endpoint: "reject", title: "Reject application",
          description: "The applicant will be notified with the reason you provide.",
          confirmLabel: "Reject card", successMsg: "Application rejected", minLength: 10, tone: "danger" })
        break
      case "freeze":
        openReason({ cardId: card.id, endpoint: "freeze", title: "Freeze card",
          description: "Temporarily freezes the card. It can be unfrozen at any time.",
          confirmLabel: "Freeze card", successMsg: "Card frozen" })
        break
      case "block":
        openReason({ cardId: card.id, endpoint: "block", title: "Block card",
          description: "Blocks the card. The user cannot lift this themselves — only an admin can unblock it.",
          confirmLabel: "Block card", successMsg: "Card blocked", tone: "danger" })
        break
      case "cancel":
        openReason({ cardId: card.id, endpoint: "cancel", title: "Cancel card",
          description: "This permanently cancels the card and cannot be undone.",
          confirmLabel: "Cancel card", successMsg: "Card cancelled", tone: "danger" })
        break
      case "unfreeze":
        try { await doAction(card.id, "unfreeze", "POST"); toast({ title: "Card unfrozen" }); fetchData() }
        catch (err) { toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" }) }
        break
      case "unblock":
        try { await doAction(card.id, "unblock", "POST"); toast({ title: "Card unblocked" }); fetchData() }
        catch (err) { toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" }) }
        break
      case "limits":
        try { setLimitsCard(await fetchCardDetail(card.id)) }
        catch (err) { toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" }) }
        break
      case "ship":
        updateDelivery(card.id, "shipped")
        break
      case "deliver":
        updateDelivery(card.id, "delivered")
        break
    }
  }

  const statsBar = [
    { label: "Pending",      value: data.stats.pendingCount,   highlight: data.stats.pendingCount > 0 ? "amber" : "" },
    { label: "Active",       value: data.stats.activeCount,    highlight: "" },
    { label: "Frozen",       value: data.stats.frozenCount,    highlight: data.stats.frozenCount > 0 ? "amber" : "" },
    { label: "Blocked",      value: data.stats.blockedCount,   highlight: data.stats.blockedCount > 0 ? "rose" : "" },
    { label: "Rejected",     value: data.stats.rejectedCount,  highlight: "" },
    { label: "Cancelled",    value: data.stats.cancelledCount, highlight: "" },
    { label: "Credit issued",value: fmtCompact(data.stats.totalCreditIssued), highlight: "" },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Card Applications</h1>
        <p className="text-sm text-gray-500 mt-1">Review and manage debit and credit card applications</p>
      </div>

      {newBanner && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5">
          <span className="text-sm text-amber-700">New pending card applications arrived.</span>
          <button onClick={() => { setNewBanner(false); fetchData() }} className="text-xs text-amber-600 underline ml-auto">Refresh</button>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
        {statsBar.map((s) => (
          <div key={s.label} className={[
            "rounded-xl border p-3 min-w-0",
            s.highlight === "amber" ? "border-amber-200 bg-amber-50"
              : s.highlight === "rose" ? "border-rose-200 bg-rose-50"
              : "border-gray-200 bg-white",
          ].join(" ")}>
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 truncate">{s.label}</p>
            <p className={`mt-1 text-xl font-semibold leading-none tabular-nums truncate ${
              s.highlight === "amber" ? "text-amber-700"
                : s.highlight === "rose" ? "text-rose-700"
                : "text-gray-900"
            }`} title={String(s.value)}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Status tabs — horizontally scrollable on small screens */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setParam("tab", tab)}
            className={[
              "px-3 py-2 text-sm rounded-t capitalize whitespace-nowrap flex-shrink-0 transition-colors",
              activeTab === tab
                ? "border-b-2 border-[#1A2CCE] text-[#1A2CCE] font-medium"
                : "text-gray-500 hover:text-gray-700",
            ].join(" ")}>
            {tab}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center">
        <div className="relative flex-shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input className="pl-8 h-9 text-sm w-full sm:w-56" placeholder="Search cards…" defaultValue={search}
            onChange={(e) => {
              if (debounceRef.current) clearTimeout(debounceRef.current)
              debounceRef.current = setTimeout(() => setParam("search", e.target.value), 400)
            }} />
        </div>
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {CARD_TYPE_TABS.map((ct) => (
            <button key={ct.value} onClick={() => setParam("cardType", ct.value)}
              className={[
                "text-xs px-2.5 py-1.5 rounded-full border whitespace-nowrap flex-shrink-0 transition-colors",
                cardType === ct.value
                  ? "bg-[#1A2CCE] text-white border-[#1A2CCE]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400",
              ].join(" ")}>
              {ct.label}
            </button>
          ))}
        </div>
        <button onClick={() => setParam("sortOrder", sortOrder === "asc" ? "desc" : "asc")}
          className="h-9 px-3 text-xs border border-gray-200 rounded-md bg-white sm:ml-auto flex-shrink-0 self-start sm:self-auto hover:border-gray-400 transition-colors">
          {sortOrder === "asc" ? "↑ Oldest first" : "↓ Newest first"}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading && <div className="h-1 bg-[#1A2CCE] animate-pulse" />}
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Applicant", "Card type", "Status", "Applied", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.cards.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-gray-400 text-sm">
                      {activeTab === "pending" ? "No pending applications. All caught up." : `No ${activeTab} cards.`}
                    </p>
                  </td>
                </tr>
              )}
              {data.cards.map((card) => (
                <tr key={card.id} className="hover:bg-gray-50 transition-colors">
                  {/* Applicant */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#1A2CCE]/10 text-[#1A2CCE] flex items-center justify-center text-xs font-semibold">
                        {card.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-xs">{card.userName}</p>
                        <p className="text-gray-400 text-xs">{card.userEmail}</p>
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${KYC_PILL[card.userKycStatus] ?? "bg-gray-100 text-gray-500"}`}>
                        {card.userKycStatus}
                      </span>
                    </div>
                  </td>
                  {/* Card type */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {card.cardType.includes("virtual") ? (
                        <Wifi className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CARD_TYPE_PILL[card.cardType] ?? "bg-gray-100 text-gray-500"}`}>
                        {card.cardType.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                  {/* Status */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_PILL[card.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {card.status === "approved" && !card.isVirtual ? "in delivery" : card.status}
                      </span>
                      {!card.isVirtual && card.deliveryStatus && card.status !== "cancelled" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-sky-50 text-sky-700 capitalize">
                          {card.deliveryStatus}
                        </span>
                      )}
                    </div>
                  </td>
                  {/* Applied */}
                  <td className="px-4 py-3 text-xs text-gray-400">{relativeDate(card.appliedAt)}</td>
                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" className="h-8 px-3 text-xs"
                      onClick={() => setActionsCard(card)}>
                      Actions
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total} cards
            </p>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setParam("page", String(page - 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="flex items-center px-3 text-xs">{page} / {data.pages}</span>
              <Button size="sm" variant="outline" disabled={page >= data.pages} onClick={() => setParam("page", String(page + 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Drawers + modals */}
      <CardReviewDrawer
        cardId={reviewId}
        onClose={() => setReviewId(null)}
        onAction={fetchData}
      />
      {limitsCard && (
        <UpdateLimitsModal
          card={limitsCard}
          open={!!limitsCard}
          onOpenChange={(v) => { if (!v) setLimitsCard(null) }}
          onSuccess={() => { setLimitsCard(null); fetchData() }}
        />
      )}
      <ReasonModal
        config={reasonModal}
        open={!!reasonModal}
        onOpenChange={(v) => { if (!v) setReasonModal(null) }}
      />
      <CardActionsModal
        card={actionsCard}
        open={!!actionsCard}
        onClose={() => setActionsCard(null)}
        onAction={handleCardAction}
      />
    </div>
  )
}
