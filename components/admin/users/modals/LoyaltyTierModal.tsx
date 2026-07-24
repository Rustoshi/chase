"use client"

import { useEffect, useState } from "react"
import { Award, ShieldAlert, AlertTriangle, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import {
  DASH, ModalHeader, Field, TextInput, TextArea, NativeSelect,
  InfoBox, PrimaryButton, GhostButton, ModalFooter, SectionCard,
} from "./_ui"
import type { UserDetail } from "@/lib/services/user.service"

interface Props {
  open:      boolean
  onClose:   () => void
  onSuccess: () => void
  user:      UserDetail
}

/* ── Reused toggle row (matches UserAlertModal) ───────────────────────────── */
function Toggle({
  checked, onChange, title, description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12, width: "100%",
        padding: "12px 14px", textAlign: "left", cursor: "pointer",
        backgroundColor: checked ? DASH.dangerBg : DASH.surface2,
        border: `1px solid ${checked ? `${DASH.danger}33` : DASH.border}`,
        borderRadius: DASH.radiusInner,
      }}
    >
      <span
        style={{
          flexShrink: 0, marginTop: 2, width: 36, height: 20, borderRadius: 999,
          backgroundColor: checked ? DASH.danger : DASH.borderStrong,
          display: "flex", alignItems: "center", padding: 2, transition: "background-color 150ms",
        }}
      >
        <span style={{
          width: 16, height: 16, borderRadius: "50%", backgroundColor: "#fff",
          transform: checked ? "translateX(16px)" : "translateX(0)", transition: "transform 150ms",
        }} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: DASH.text }}>{title}</span>
        <span style={{ display: "block", fontSize: 12, color: DASH.textMuted, lineHeight: 1.5, marginTop: 2 }}>
          {description}
        </span>
      </span>
    </button>
  )
}

export function LoyaltyTierModal({ open, onClose, onSuccess, user }: Props) {
  const userName = `${user.firstName} ${user.lastName}`

  const [tier,      setTier]      = useState<number>(user.loyaltyTier ?? 1)
  const [progress,  setProgress]  = useState<number>(user.loyaltyProgress ?? 0)
  const [flagged,   setFlagged]   = useState<boolean>(Boolean(user.amlFlagged))
  const [reason,    setReason]    = useState<string>(user.amlFlagReason ?? "")
  const [saving,    setSaving]    = useState(false)

  // Reset to the user's current values whenever the modal (re)opens.
  useEffect(() => {
    if (!open) return
    setTier(user.loyaltyTier ?? 1)
    setProgress(user.loyaltyProgress ?? 0)
    setFlagged(Boolean(user.amlFlagged))
    setReason(user.amlFlagReason ?? "")
  }, [open, user])

  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress || 0)))
  const barColor = flagged ? DASH.danger : DASH.success
  const barBg    = flagged ? DASH.dangerBg : DASH.successBg

  async function save() {
    if (flagged && !reason.trim()) {
      toast({ title: "A reason is required to flag this account", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loyaltyTier:     tier,
          loyaltyProgress: clampedProgress,
          amlFlagged:      flagged,
          amlFlagReason:   flagged ? reason.trim() : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to save")
      toast({ title: "Loyalty & compliance updated", description: `Saved for ${userName}.` })
      onSuccess()
      onClose()
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg" style={{ fontFamily: DASH.font }}>
        <DialogTitle className="sr-only">Loyalty & compliance for {userName}</DialogTitle>

        <div style={{ padding: "24px 24px 0" }}>
          <ModalHeader
            icon={Award}
            tone="primary"
            title="Loyalty & compliance"
            description={`Set ${userName}'s loyalty tier and progress, or flag the account for review.`}
          />
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, maxHeight: "60vh", overflowY: "auto" }}>
          {/* ── Loyalty tier ── */}
          <SectionCard title="Loyalty tier">
            <Field label="Tier level" htmlFor="loyalty-tier" hint="Tier 1 is the entry level; tier 3 is the highest.">
              <NativeSelect id="loyalty-tier" value={tier} onChange={(e) => setTier(Number(e.target.value))}>
                <option value={1}>Tier 1</option>
                <option value={2}>Tier 2</option>
                <option value={3}>Tier 3</option>
              </NativeSelect>
            </Field>

            <Field label={`Progress — ${clampedProgress}%`} htmlFor="loyalty-progress" hint="How full the tier bar appears to the client (0–100%).">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  id="loyalty-progress"
                  type="range"
                  min={0}
                  max={100}
                  value={clampedProgress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  style={{ flex: 1, accentColor: DASH.primary, cursor: "pointer" }}
                />
                <TextInput
                  type="number"
                  min={0}
                  max={100}
                  value={clampedProgress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  style={{ width: 80, textAlign: "center" }}
                />
              </div>
            </Field>

            {/* Live preview of the client's bar */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: DASH.textMuted, margin: "0 0 8px" }}>
                Client preview
              </p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: DASH.text }}>Tier {tier} of 3</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: barColor }}>{clampedProgress}%</span>
              </div>
              <div style={{ height: 10, borderRadius: 999, backgroundColor: barBg, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${clampedProgress}%`, backgroundColor: barColor, borderRadius: 999, transition: "width 150ms" }} />
              </div>
              {flagged && (
                <p style={{ fontSize: 12, color: DASH.danger, margin: "8px 0 0", lineHeight: 1.5 }}>
                  {reason.trim() || "Account flagged for review."}
                </p>
              )}
            </div>
          </SectionCard>

          {/* ── AML flag ── */}
          <SectionCard title="Compliance">
            <Toggle
              checked={flagged}
              onChange={setFlagged}
              title="Flag for money laundering"
              description="Blocks all transfers and swaps, and turns the client's loyalty bar red with the message below."
            />

            {flagged && (
              <Field label="Flag message" htmlFor="aml-reason" required hint="Shown to the client under their loyalty bar and returned when a transfer is blocked.">
                <TextArea
                  id="aml-reason"
                  rows={3}
                  value={reason}
                  maxLength={500}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Your account is under compliance review. Please contact support."
                />
              </Field>
            )}

            {flagged && (
              <InfoBox tone="danger" icon={AlertTriangle}>
                While flagged, {userName} cannot send transfers or swap currencies. This is enforced on the server.
              </InfoBox>
            )}
          </SectionCard>
        </div>

        <ModalFooter style={{ padding: "20px 24px 24px" }}>
          <GhostButton onClick={onClose} disabled={saving}>Cancel</GhostButton>
          <PrimaryButton
            tone={flagged ? "danger" : "primary"}
            onClick={save}
            disabled={saving}
          >
            {saving
              ? <><Loader2 className="animate-spin" style={{ width: 15, height: 15 }} /> Saving…</>
              : <><ShieldAlert style={{ width: 15, height: 15 }} /> Save changes</>}
          </PrimaryButton>
        </ModalFooter>
      </DialogContent>
    </Dialog>
  )
}
