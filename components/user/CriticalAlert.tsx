"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Info, ShieldAlert, X, LifeBuoy, Loader2, ChevronRight } from "lucide-react"
import { useThemeColors } from "@/components/shared/ThemeProvider"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"
import type { UserAlertView } from "@/lib/services/alert.service"

/**
 * Admin-authored critical alert, shown in two tiers:
 *
 *  1. An entry modal — opens automatically until the client acknowledges it.
 *     When `requireAcknowledge` is set it cannot be closed by the X or the
 *     backdrop; the only way out is the explicit confirm button.
 *  2. A persistent banner — pinned under the header on every page for as long
 *     as the alert is active, so the message can never be lost to a stray tap.
 *     Tapping it re-opens the modal.
 *
 * Mounted once in UserAppShell.
 */
export function CriticalAlert({ alert }: { alert: UserAlertView | null }) {
  const router = useRouter()
  const colors = useThemeColors()

  // Auto-open on entry unless the client already confirmed this alert.
  const [open, setOpen]             = useState(!!alert && !alert.acknowledgedAt)
  const [acknowledged, setAckd]     = useState(!!alert?.acknowledgedAt)
  const [submitting, setSubmitting] = useState(false)

  useBodyScrollLock(open)

  if (!alert || !alert.isActive) return null

  const S = {
    critical: { fg: colors.red,               bg: colors.redBg,               Icon: ShieldAlert,    label: "Important" },
    warning:  { fg: colors.yellow || "#F79009", bg: colors.yellowBg || "rgba(247,144,9,0.1)", Icon: AlertTriangle, label: "Action required" },
    info:     { fg: colors.blue,              bg: colors.blueBg,              Icon: Info,           label: "Notice" },
  }[alert.severity] ?? {
    fg: colors.red, bg: colors.redBg, Icon: ShieldAlert, label: "Important",
  }

  const { Icon } = S
  const hardBlock = alert.requireAcknowledge && !acknowledged

  async function confirm() {
    setSubmitting(true)
    try {
      await fetch("/api/user/alert/acknowledge", { method: "POST" })
      setAckd(true)
      setOpen(false)
    } catch {
      // Even if the call fails, don't trap the user behind the modal.
      setOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  function contactSupport() {
    setOpen(false)
    router.push("/app/support")
  }

  /** Soft close — only allowed when the alert isn't a hard block. */
  function softClose() {
    if (hardBlock) return
    setOpen(false)
  }

  return (
    <>
      {/* ── Tier 2: persistent banner (under the header, every page) ── */}
      <button
        onClick={() => setOpen(true)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          background: S.bg, borderBottom: `1px solid ${S.fg}33`,
          padding: "10px 16px", cursor: "pointer", textAlign: "left",
        }}
      >
        <Icon style={{ width: 16, height: 16, color: S.fg, flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: S.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {alert.title}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 12, fontWeight: 600, color: S.fg, flexShrink: 0 }}>
          View
          <ChevronRight style={{ width: 14, height: 14 }} />
        </span>
      </button>

      {/* ── Tier 1: entry modal ── */}
      {open && (
        <div
          onClick={softClose}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="critical-alert-title"
            style={{
              width: "100%", maxWidth: 440, background: colors.bgElevated,
              border: `1px solid ${colors.border}`, borderRadius: 20,
              boxShadow: "0 24px 48px rgba(0,0,0,0.28)",
              maxHeight: "85vh", display: "flex", flexDirection: "column",
            }}
          >
            {/* Header */}
            <div style={{ padding: "24px 24px 0", position: "relative" }}>
              {!hardBlock && (
                <button
                  onClick={softClose}
                  aria-label="Close"
                  style={{
                    position: "absolute", top: 16, right: 16, width: 32, height: 32,
                    borderRadius: 10, border: "none", cursor: "pointer",
                    background: colors.bgHover, color: colors.textMuted,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>
              )}

              <div style={{
                width: 52, height: 52, borderRadius: 16, background: S.bg,
                display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
              }}>
                <Icon style={{ width: 24, height: 24, color: S.fg }} />
              </div>

              <span style={{
                display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
                textTransform: "uppercase", color: S.fg, background: S.bg,
                padding: "4px 10px", borderRadius: 999, marginBottom: 12,
              }}>
                {S.label}
              </span>

              <h2
                id="critical-alert-title"
                style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, margin: "0 0 10px", lineHeight: 1.3 }}
              >
                {alert.title}
              </h2>
            </div>

            {/* Body (scrolls if long; admin's line breaks preserved) */}
            <div style={{ padding: "0 24px", overflowY: "auto", flex: 1 }}>
              <p style={{
                fontSize: 15, lineHeight: 1.65, color: colors.textSecondary,
                margin: 0, whiteSpace: "pre-wrap",
              }}>
                {alert.body}
              </p>

              {alert.blockTransactions && (
                <div style={{
                  marginTop: 16, padding: "10px 12px", borderRadius: 12,
                  background: colors.bgHover, border: `1px solid ${colors.border}`,
                  display: "flex", gap: 8, alignItems: "flex-start",
                }}>
                  <AlertTriangle style={{ width: 14, height: 14, color: colors.textMuted, marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.5 }}>
                    Transfers and deposits are temporarily unavailable on your account until this is resolved.
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={contactSupport}
                style={{
                  width: "100%", height: 48, borderRadius: 14, border: "none", cursor: "pointer",
                  background: colors.blue, color: "#fff", fontSize: 15, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <LifeBuoy style={{ width: 17, height: 17 }} />
                Contact support
              </button>

              <button
                onClick={confirm}
                disabled={submitting}
                style={{
                  width: "100%", height: 46, borderRadius: 14, cursor: "pointer",
                  background: "transparent", border: `1px solid ${colors.border}`,
                  color: colors.textSecondary, fontSize: 14, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting
                  ? <><Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> Saving…</>
                  : "I understand"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
