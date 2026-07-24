"use client"

/* ══════════════════════════════════════════════════════════════════════════
   Shared modal primitives — Grey dashboard-design.md system.
   White surfaces on grey, Inter, indigo #1A2CCE accent, soft shadows, 10–16px
   radii. Used by every admin user-details modal so inputs / buttons / headers
   stay perfectly consistent. Pure inline-style tokens (no Tailwind dependency).
   ══════════════════════════════════════════════════════════════════════════ */

import { forwardRef } from "react"
import type { LucideIcon } from "lucide-react"

/* ── Grey design tokens ───────────────────────────────────────────────────── */
export const DASH = {
  surface:    "#FFFFFF",
  surface2:   "#F9FAFB",
  bg:         "#F5F6F8",
  text:       "#101828",
  textMuted:  "#667085",
  textFaint:  "#98A2B3",
  primary:    "#1A2CCE",
  primaryHover: "#3D50E0",
  primaryTint:  "#EEF0FE",
  border:     "#EAECF0",
  borderStrong: "#D0D5DD",
  success:    "#12B76A",
  successBg:  "#ECFDF3",
  danger:     "#F04438",
  dangerBg:   "#FEF3F2",
  warning:    "#F79009",
  warningBg:  "#FFFAEB",
  info:       "#2775CA",
  infoBg:     "#EFF8FF",
  radiusCard: 16,
  radiusInner: 12,
  radiusControl: 10,
  shadow: "0 1px 3px rgba(16,24,40,0.08), 0 1px 2px rgba(16,24,40,0.04)",
  font: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
} as const

type Tone = "primary" | "danger" | "success" | "warning" | "info" | "neutral"

const TONES: Record<Tone, { fg: string; bg: string }> = {
  primary: { fg: DASH.primary,   bg: DASH.primaryTint },
  danger:  { fg: DASH.danger,    bg: DASH.dangerBg },
  success: { fg: DASH.success,   bg: DASH.successBg },
  warning: { fg: DASH.warning,   bg: DASH.warningBg },
  info:    { fg: DASH.info,      bg: DASH.infoBg },
  neutral: { fg: DASH.textMuted, bg: DASH.surface2 },
}

/* ── Header with tinted icon tile ─────────────────────────────────────────── */
export function ModalHeader({
  icon: Icon, tone = "primary", title, description,
}: {
  icon: LucideIcon
  tone?: Tone
  title: string
  description?: string
}) {
  const t = TONES[tone]
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 44, height: 44, borderRadius: DASH.radiusControl,
          backgroundColor: t.bg, color: t.fg, flexShrink: 0,
        }}
      >
        <Icon size={22} strokeWidth={2} />
      </div>
      <div style={{ minWidth: 0, paddingRight: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: DASH.text, lineHeight: 1.3, margin: 0 }}>
          {title}
        </h2>
        {description && (
          <p style={{ fontSize: 13.5, color: DASH.textMuted, marginTop: 3, lineHeight: 1.45 }}>
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Field wrapper: label + control + hint/error ──────────────────────────── */
export function Field({
  label, htmlFor, hint, error, required, optional, children, style,
}: {
  label?: string
  htmlFor?: string
  hint?: string
  error?: string
  required?: boolean
  optional?: boolean
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0, ...style }}>
      {label && (
        <label
          htmlFor={htmlFor}
          style={{ fontSize: 13, fontWeight: 500, color: DASH.text, display: "flex", alignItems: "center", gap: 6 }}
        >
          {label}
          {required && <span style={{ color: DASH.danger }}>*</span>}
          {optional && <span style={{ color: DASH.textFaint, fontWeight: 400 }}>(optional)</span>}
        </label>
      )}
      {children}
      {error
        ? <p style={{ fontSize: 12, color: DASH.danger, margin: 0 }}>{error}</p>
        : hint ? <p style={{ fontSize: 12, color: DASH.textFaint, margin: 0 }}>{hint}</p> : null}
    </div>
  )
}

/* ── Shared control chrome ────────────────────────────────────────────────── */
const controlBase: React.CSSProperties = {
  width: "100%",
  fontFamily: DASH.font,
  fontSize: 14,
  color: DASH.text,
  backgroundColor: DASH.surface,
  border: `1px solid ${DASH.border}`,
  borderRadius: DASH.radiusControl,
  outline: "none",
  transition: "border-color .15s, box-shadow .15s",
}

function focusOn(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = DASH.primary
  e.currentTarget.style.boxShadow = `0 0 0 3px ${DASH.primaryTint}`
}
function focusOff(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = DASH.border
  e.currentTarget.style.boxShadow = "none"
}

export const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ style, onFocus, onBlur, ...props }, ref) {
    return (
      <input
        ref={ref}
        {...props}
        onFocus={(e) => { focusOn(e); onFocus?.(e) }}
        onBlur={(e) => { focusOff(e); onBlur?.(e) }}
        style={{ ...controlBase, height: 44, padding: "0 14px", ...style }}
      />
    )
  }
)

export const TextArea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextArea({ style, onFocus, onBlur, rows = 3, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        {...props}
        onFocus={(e) => { focusOn(e); onFocus?.(e) }}
        onBlur={(e) => { focusOff(e); onBlur?.(e) }}
        style={{ ...controlBase, padding: "10px 14px", resize: "none", lineHeight: 1.5, ...style }}
      />
    )
  }
)

export const NativeSelect = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function NativeSelect({ style, onFocus, onBlur, children, ...props }, ref) {
    return (
      <div style={{ position: "relative" }}>
        <select
          ref={ref}
          {...props}
          onFocus={(e) => { focusOn(e); onFocus?.(e) }}
          onBlur={(e) => { focusOff(e); onBlur?.(e) }}
          style={{
            ...controlBase, height: 44, padding: "0 38px 0 14px",
            appearance: "none", WebkitAppearance: "none", cursor: "pointer", ...style,
          }}
        >
          {children}
        </select>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: DASH.textMuted }}
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }
)

/* ── Info / alert box ─────────────────────────────────────────────────────── */
export function InfoBox({
  tone = "neutral", icon: Icon, title, children, style,
}: {
  tone?: Tone
  icon?: LucideIcon
  title?: string
  children?: React.ReactNode
  style?: React.CSSProperties
}) {
  const t = TONES[tone]
  return (
    <div
      style={{
        display: "flex", gap: 10, padding: "12px 14px",
        borderRadius: DASH.radiusInner, backgroundColor: t.bg,
        border: `1px solid ${t.fg}22`, ...style,
      }}
    >
      {Icon && <Icon size={18} strokeWidth={2} style={{ color: t.fg, flexShrink: 0, marginTop: 1 }} />}
      <div style={{ minWidth: 0 }}>
        {title && <p style={{ fontSize: 13, fontWeight: 600, color: t.fg, margin: 0 }}>{title}</p>}
        {children && (
          <div style={{ fontSize: 12.5, color: title ? `${t.fg}cc` : t.fg, marginTop: title ? 2 : 0, lineHeight: 1.5 }}>
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Buttons ──────────────────────────────────────────────────────────────── */
type BtnTone = "primary" | "danger" | "success"
const BTN_BG: Record<BtnTone, { base: string; hover: string }> = {
  primary: { base: DASH.primary, hover: DASH.primaryHover },
  danger:  { base: DASH.danger,  hover: "#D92D20" },
  success: { base: DASH.success, hover: "#039855" },
}

export function PrimaryButton({
  tone = "primary", style, disabled, onMouseEnter, onMouseLeave, children, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: BtnTone }) {
  const c = BTN_BG[tone]
  return (
    <button
      {...props}
      disabled={disabled}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = c.hover; onMouseEnter?.(e) }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = c.base; onMouseLeave?.(e) }}
      style={{
        height: 44, padding: "0 20px", fontFamily: DASH.font, fontSize: 14, fontWeight: 600,
        color: "#fff", backgroundColor: c.base, border: "none", borderRadius: DASH.radiusControl,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1,
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "background-color .15s", ...style,
      }}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  style, disabled, onMouseEnter, onMouseLeave, children, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={disabled}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = DASH.surface2; onMouseEnter?.(e) }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
      style={{
        height: 44, padding: "0 20px", fontFamily: DASH.font, fontSize: 14, fontWeight: 500,
        color: DASH.text, backgroundColor: "transparent",
        border: `1px solid ${DASH.border}`, borderRadius: DASH.radiusControl,
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1,
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        transition: "background-color .15s", ...style,
      }}
    >
      {children}
    </button>
  )
}

/* ── Section card (grouped fields on surface-2) ───────────────────────────── */
export function SectionCard({
  title, children, style,
}: {
  title?: string
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        borderRadius: DASH.radiusInner, backgroundColor: DASH.surface2,
        border: `1px solid ${DASH.border}`, padding: 16,
        display: "flex", flexDirection: "column", gap: 14, ...style,
      }}
    >
      {title && (
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: DASH.textMuted, margin: 0 }}>
          {title}
        </p>
      )}
      {children}
    </div>
  )
}

/* ── Footer row ───────────────────────────────────────────────────────────── */
export function ModalFooter({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: "flex", flexDirection: "row", justifyContent: "flex-end", gap: 10,
        paddingTop: 20, marginTop: 22, borderTop: `1px solid ${DASH.border}`, ...style,
      }}
    >
      {children}
    </div>
  )
}
