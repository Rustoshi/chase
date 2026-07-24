"use client"

import { useState, useRef, useCallback } from "react"
import { Plus, GripVertical, MoreHorizontal, Trash2 } from "lucide-react"
import { Button }   from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { MethodIcon }               from "./MethodIcon"
import { CreateMethodModal }        from "./modals/CreateMethodModal"
import { EditMethodModal }          from "./modals/EditMethodModal"
import { InstructionsPreviewModal } from "./modals/InstructionsPreviewModal"
import type { PaymentMethodType }   from "@/lib/models/PaymentMethod"
import Image from "next/image"

type Method = Record<string, unknown>

interface Props {
  initialMethods: Method[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function feeLabel(m: Method): React.ReactNode {
  const fp = Number(m.feePercent ?? 0)
  const ff = Number(m.feeFixed   ?? 0)
  if (fp > 0 && ff > 0) return <span className="text-orange-600">{fp}% + ${ff}</span>
  if (fp > 0)            return <span className="text-orange-600">{fp}%</span>
  if (ff > 0)            return <span className="text-orange-600">${ff}</span>
  return <span className="text-emerald-600">No fee</span>
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked, onChange,
}: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
        checked ? "bg-[#12B76A]" : "bg-gray-200",
      ].join(" ")}
    >
      <span className={[
        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
        checked ? "translate-x-4" : "translate-x-0",
      ].join(" ")} />
    </button>
  )
}

// ── Method row ────────────────────────────────────────────────────────────────

function MethodRow({
  method,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onToggle,
  onEdit,
  onPreview,
  onDelete,
}: {
  method:      Method
  isDragging:  boolean
  onDragStart: (id: string) => void
  onDragOver:  (e: React.DragEvent) => void
  onDrop:      (targetId: string) => void
  onToggle:    (id: string, v: boolean) => void
  onEdit:      (m: Method) => void
  onPreview:   (m: Method) => void
  onDelete:    (id: string) => void
}) {
  const id      = String(method._id ?? method.id)
  const enabled = Boolean(method.isEnabled)
  const maxAmt  = Number(method.maxAmount ?? 0)

  return (
    <div
      draggable
      onDragStart={() => onDragStart(id)}
      onDragOver={onDragOver}
      onDrop={() => onDrop(id)}
      className={[
        "flex items-center gap-4 bg-white border rounded-xl px-4 py-3 transition-all",
        isDragging ? "opacity-40 border-dashed border-[#1A2CCE]" : "border-gray-200 hover:border-gray-300 hover:shadow-sm",
      ].join(" ")}
    >
      {/* Drag handle */}
      <div className="cursor-grab text-gray-300 hover:text-gray-500 flex-shrink-0">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Icon or Logo */}
      {method.logoUrl ? (
        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-50 border border-gray-100">
          <Image src={String(method.logoUrl)} alt={String(method.name)} fill className="object-contain p-1" sizes="40px" />
        </div>
      ) : (
        <MethodIcon type={method.type as PaymentMethodType} name={String(method.name)} size="md" />
      )}

      {/* Name + slug + type */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900">{String(method.name)}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <code className="text-xs text-gray-400">{String(method.slug)}</code>
          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded capitalize">
            {String(method.type).replace("_", " ")}
          </span>
        </div>
      </div>

      {/* Middle info */}
      <div className="hidden lg:flex flex-col gap-0.5 text-xs min-w-[120px]">
        <span className={`font-medium ${method.depositTarget === "bitcoin" ? "text-amber-600" : "text-indigo-600"}`}>
          → {method.depositTarget === "bitcoin" ? "Bitcoin" : "Fiat account"}
        </span>
        <span className="text-gray-500">{feeLabel(method)}</span>
        <span className="text-gray-400">
          Min: ${Number(method.minAmount ?? 0)} / Max: {maxAmt === 0 ? "Unlimited" : `$${maxAmt.toLocaleString()}`}
        </span>
      </div>

      {/* Toggle */}
      <ToggleSwitch
        checked={enabled}
        onChange={(v) => onToggle(id, v)}
      />

      {/* Three-dot menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 flex-shrink-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(method)}>Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPreview(method)}>View instructions</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={enabled ? "text-gray-300 cursor-not-allowed" : "text-red-600"}
            disabled={enabled}
            onClick={() => !enabled && onDelete(id)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Delete {enabled && <span className="text-xs ml-1 text-gray-400">(disable first)</span>}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PaymentMethodsClient({ initialMethods }: Props) {
  const { toast } = useToast()

  const [methods,       setMethods]       = useState<Method[]>(initialMethods)
  const [activeTab,     setActiveTab]     = useState<"active" | "inactive">("active")
  const [createOpen,    setCreateOpen]    = useState(false)
  const [editMethod,    setEditMethod]    = useState<Method | null>(null)
  const [previewMethod, setPreviewMethod] = useState<Method | null>(null)
  const [draggingId,    setDraggingId]    = useState<string | null>(null)
  const [reordering,    setReordering]    = useState(false)
  const prevOrder                          = useRef<Method[]>(methods)

  const active   = methods.filter((m) =>  m.isEnabled)
  const inactive = methods.filter((m) => !m.isEnabled)
  const tabList  = activeTab === "active" ? active : inactive

  // Toggle enable/disable
  async function handleToggle(id: string, value: boolean) {
    const prev = methods
    setMethods((ms) => ms.map((m) => String(m._id ?? m.id) === id ? { ...m, isEnabled: value } : m))
    try {
      const res  = await fetch(`/api/admin/payment-methods/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: value }),
      })
      if (!res.ok) throw new Error("Toggle failed")
    } catch (err) {
      setMethods(prev)
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    }
  }

  // Delete
  async function handleDelete(id: string) {
    if (!confirm("Delete this payment method?")) return
    try {
      const res  = await fetch(`/api/admin/payment-methods/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Delete failed")
      setMethods((ms) => ms.filter((m) => String(m._id ?? m.id) !== id))
      toast({ title: "Deleted" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    }
  }

  // Drag and drop
  function handleDragStart(id: string) {
    prevOrder.current = [...methods]
    setDraggingId(id)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) { setDraggingId(null); return }

    setMethods((ms) => {
      const arr   = [...ms]
      const fromI = arr.findIndex((m) => String(m._id ?? m.id) === draggingId)
      const toI   = arr.findIndex((m) => String(m._id ?? m.id) === targetId)
      if (fromI === -1 || toI === -1) return ms
      const [item] = arr.splice(fromI, 1)
      arr.splice(toI, 0, item)
      return arr
    })
    setDraggingId(null)
    saveOrder()
  }

  const saveOrder = useCallback(async () => {
    setReordering(true)
    try {
      const orderedIds = methods.map((m) => String(m._id ?? m.id))
      const res  = await fetch("/api/admin/payment-methods/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      })
      if (!res.ok) throw new Error("Reorder failed")
      const updated = await res.json() as Method[]
      setMethods(updated)
    } catch (err) {
      setMethods(prevOrder.current)
      toast({ title: "Reorder failed", description: "Order reverted", variant: "destructive" })
    } finally {
      setReordering(false)
    }
  }, [methods, toast])

  function onMethodSaved(method: Method) {
    setMethods((ms) => {
      const id = String(method._id ?? method.id)
      const exists = ms.find((m) => String(m._id ?? m.id) === id)
      return exists ? ms.map((m) => String(m._id ?? m.id) === id ? method : m) : [...ms, method]
    })
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payment methods</h1>
          <p className="text-sm text-gray-500 mt-1">Configure deposit options shown to users</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-[#1A2CCE] hover:bg-[#1A2CCE]/90">
          <Plus className="w-4 h-4" /> Add payment method
        </Button>
      </div>

      {reordering && (
        <p className="text-xs text-gray-400 animate-pulse">Saving order…</p>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        <button onClick={() => setActiveTab("active")}
          className={`px-4 py-2 text-sm transition-colors ${activeTab === "active" ? "border-b-2 border-[#1A2CCE] text-[#1A2CCE] font-medium" : "text-gray-500 hover:text-gray-700"}`}>
          Active ({active.length})
        </button>
        <button onClick={() => setActiveTab("inactive")}
          className={`px-4 py-2 text-sm transition-colors ${activeTab === "inactive" ? "border-b-2 border-[#1A2CCE] text-[#1A2CCE] font-medium" : "text-gray-500 hover:text-gray-700"}`}>
          Inactive ({inactive.length})
        </button>
      </div>

      {/* Method list */}
      <div className="space-y-2">
        {tabList.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">
              No {activeTab} payment methods.{" "}
              {activeTab === "active" ? "Enable some to get started." : "Add one to get started."}
            </p>
          </div>
        )}
        {tabList.map((m) => (
          <MethodRow
            key={String(m._id ?? m.id)}
            method={m}
            isDragging={draggingId === String(m._id ?? m.id)}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onToggle={handleToggle}
            onEdit={(m) => setEditMethod(m)}
            onPreview={(m) => setPreviewMethod(m)}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Modals */}
      <CreateMethodModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={(m) => { onMethodSaved(m); setCreateOpen(false) }}
      />
      <EditMethodModal
        open={!!editMethod}
        onOpenChange={(v) => { if (!v) setEditMethod(null) }}
        method={editMethod}
        onSuccess={(m) => { onMethodSaved(m); setEditMethod(null) }}
      />
      <InstructionsPreviewModal
        method={previewMethod as Parameters<typeof InstructionsPreviewModal>[0]["method"]}
        open={!!previewMethod}
        onOpenChange={(v) => { if (!v) setPreviewMethod(null) }}
      />
    </div>
  )
}
