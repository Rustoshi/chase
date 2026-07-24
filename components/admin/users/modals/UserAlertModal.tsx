"use client"

import { useEffect, useState } from "react"
import { ShieldAlert, AlertTriangle, Info, Loader2, LifeBuoy, CheckCircle2 } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import {
  DASH, ModalHeader, Field, TextInput, TextArea, NativeSelect,
  InfoBox, PrimaryButton, GhostButton, ModalFooter,
} from "./_ui"

type Severity = "info" | "warning" | "critical"

export interface UserAlertData {
  id:                 string
  title:              string
  body:               string
  severity:           Severity
  isActive:           boolean
  requireAcknowledge: boolean
  blockTransactions:  boolean
  acknowledgedAt:     string | null
  updatedAt:          string
}

interface Props {
  open:      boolean
  onClose:   () => void
  onSuccess: () => void
  userId:    string
  userName:  string
}

const SEVERITY_META: Record<Severity, { fg: string; bg: string; label: string; Icon: typeof ShieldAlert }> = {
  critical: { fg: DASH.danger,  bg: DASH.dangerBg,  label: "Important",       Icon: ShieldAlert },
  warning:  { fg: DASH.warning, bg: DASH.warningBg, label: "Action required", Icon: AlertTriangle },
  info:     { fg: DASH.info,    bg: DASH.infoBg,    label: "Notice",          Icon: Info },
}

/* ── A small labelled switch row ──────────────────────────────────────────── */
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
        backgroundColor: checked ? DASH.primaryTint : DASH.surface2,
        border: `1px solid ${checked ? `${DASH.primary}33` : DASH.border}`,
        borderRadius: DASH.radiusInner,
      }}
    >
      <span
        style={{
          flexShrink: 0, marginTop: 2, width: 36, height: 20, borderRadius: 999,
          backgroundColor: checked ? DASH.primary : DASH.borderStrong,
          display: "flex", alignItems: "center",
          padding: 2, transition: "background-color 150ms",
        }}
      >
        <span style={{
          width: 16, height: 16, borderRadius: "50%", backgroundColor: "#fff",
          transform: checked ? "translateX(16px)" : "translateX(0)",
          transition: "transform 150ms",
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

export function UserAlertModal({ open, onClose, onSuccess, userId, userName }: Props) {
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [clearing,  setClearing]  = useState(false)
  const [existing,  setExisting]  = useState<UserAlertData | null>(null)

  const [title,      setTitle]      = useState("")
  const [body,       setBody]       = useState("")
  const [severity,   setSeverity]   = useState<Severity>("critical")
  const [requireAck, setRequireAck] = useState(false)
  const [blockTx,    setBlockTx]    = useState(false)
  const [sendEmail,  setSendEmail]  = useState(false)

  // Load any existing alert
  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`/api/admin/users/${userId}/alert`)
      .then((r) => r.json())
      .then((d) => {
        const a = d.alert as UserAlertData | null
        setExisting(a)
        if (a) {
          setTitle(a.title)
          setBody(a.body)
          setSeverity(a.severity)
          setRequireAck(a.requireAcknowledge)
          setBlockTx(a.blockTransactions)
        } else {
          setTitle(""); setBody(""); setSeverity("critical")
          setRequireAck(false); setBlockTx(false)
        }
        setSendEmail(false)
      })
      .catch(() => toast({ title: "Failed to load alert", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [open, userId])

  const valid = title.trim().length > 0 && body.trim().length > 0
  const meta  = SEVERITY_META[severity]
  const { Icon } = meta

  async function save() {
    if (!valid) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/alert`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, body, severity,
          isActive: true,
          requireAcknowledge: requireAck,
          blockTransactions: blockTx,
          sendEmail,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to save alert")
      toast({ title: "Alert is live", description: `${userName} will see it on their next page load.` })
      onSuccess()
      onClose()
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function clear() {
    setClearing(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}/alert`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to turn off alert")
      toast({ title: "Alert turned off", description: `${userName} will no longer see it.` })
      onSuccess()
      onClose()
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setClearing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg" style={{ fontFamily: DASH.font }}>
        <DialogTitle className="sr-only">Account alert for {userName}</DialogTitle>

        <div style={{ padding: "24px 24px 0" }}>
          <ModalHeader
            icon={ShieldAlert}
            tone={severity === "critical" ? "danger" : severity === "warning" ? "warning" : "info"}
            title="Account alert"
            description={`Shown to ${userName} as a modal on entry, then as a banner on every page.`}
          />
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: DASH.textMuted, fontSize: 14 }}>
            <Loader2 className="animate-spin" style={{ width: 20, height: 20, margin: "0 auto 8px" }} />
            Loading…
          </div>
        ) : (
          <>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, maxHeight: "55vh", overflowY: "auto" }}>
              {/* Current status */}
              {existing?.isActive && (
                <InfoBox tone={existing.acknowledgedAt ? "success" : "warning"} icon={existing.acknowledgedAt ? CheckCircle2 : AlertTriangle}>
                  <span style={{ fontSize: 13, color: DASH.text }}>
                    {existing.acknowledgedAt
                      ? `This alert is live and the client confirmed they read it on ${new Date(existing.acknowledgedAt).toLocaleString()}.`
                      : "This alert is live but the client has not confirmed reading it yet."}
                  </span>
                </InfoBox>
              )}

              <Field label="Severity" htmlFor="alert-severity">
                <NativeSelect id="alert-severity" value={severity} onChange={(e) => setSeverity(e.target.value as Severity)}>
                  <option value="critical">Critical — red</option>
                  <option value="warning">Warning — amber</option>
                  <option value="info">Notice — blue</option>
                </NativeSelect>
              </Field>

              <Field label="Title" htmlFor="alert-title" required hint="Shown in the modal heading and the banner.">
                <TextInput
                  id="alert-title"
                  value={title}
                  maxLength={120}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Action required on your account"
                />
              </Field>

              <Field label="Message" htmlFor="alert-body" required hint="Line breaks are preserved. Keep it clear and specific.">
                <TextArea
                  id="alert-body"
                  rows={5}
                  value={body}
                  maxLength={2000}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Explain what has happened and what the client needs to do next."
                />
              </Field>

              <Toggle
                checked={requireAck}
                onChange={setRequireAck}
                title="Require acknowledgement"
                description="The client cannot close the modal with the X or by tapping outside — they must press “I understand”."
              />

              <Toggle
                checked={blockTx}
                onChange={setBlockTx}
                title="Block transfers and deposits"
                description="Money movement is rejected on the server while this alert is active. Use for accounts under review."
              />

              <Toggle
                checked={sendEmail}
                onChange={setSendEmail}
                title="Also email this to the client"
                description="Sends the same title and message by email, with a Contact support button."
              />

              {/* Live preview of exactly what the client sees */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: DASH.textMuted, margin: "0 0 8px" }}>
                  Client preview
                </p>
                <div style={{
                  border: `1px solid ${DASH.border}`, borderRadius: DASH.radiusInner,
                  overflow: "hidden", backgroundColor: DASH.surface,
                }}>
                  {/* banner */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    background: meta.bg, borderBottom: `1px solid ${meta.fg}33`, padding: "8px 12px",
                  }}>
                    <Icon style={{ width: 14, height: 14, color: meta.fg, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: meta.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {title || "Your alert title"}
                    </span>
                  </div>
                  {/* modal body */}
                  <div style={{ padding: 16 }}>
                    <span style={{
                      display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                      textTransform: "uppercase", color: meta.fg, background: meta.bg,
                      padding: "3px 8px", borderRadius: 999, marginBottom: 8,
                    }}>
                      {meta.label}
                    </span>
                    <p style={{ fontSize: 15, fontWeight: 700, color: DASH.text, margin: "0 0 6px" }}>
                      {title || "Your alert title"}
                    </p>
                    <p style={{ fontSize: 13, color: DASH.textMuted, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {body || "Your message to the client appears here."}
                    </p>
                    <div style={{
                      marginTop: 12, height: 36, borderRadius: 10, backgroundColor: DASH.primary,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      color: "#fff", fontSize: 13, fontWeight: 600,
                    }}>
                      <LifeBuoy style={{ width: 14, height: 14 }} />
                      Contact support
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ModalFooter style={{ padding: "20px 24px 24px" }}>
              {existing?.isActive && (
                <GhostButton onClick={clear} disabled={clearing || saving} style={{ marginRight: "auto" }}>
                  {clearing ? "Turning off…" : "Turn off alert"}
                </GhostButton>
              )}
              <GhostButton onClick={onClose} disabled={saving || clearing}>Cancel</GhostButton>
              <PrimaryButton
                tone={severity === "critical" ? "danger" : "primary"}
                onClick={save}
                disabled={!valid || saving || clearing}
              >
                {saving
                  ? <><Loader2 className="animate-spin" style={{ width: 15, height: 15 }} /> Saving…</>
                  : existing?.isActive ? "Update alert" : "Set alert live"}
              </PrimaryButton>
            </ModalFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
