"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  MessageCircle, Plus, Clock, CheckCircle2, AlertCircle, Headphones,
  Send, ChevronRight, ChevronDown, Ticket, X, Shield, CreditCard,
  ArrowLeftRight, HelpCircle, Smartphone, Globe, Loader2, Phone,
} from "lucide-react"
import { UserHeader } from "@/components/user/UserHeader"
import { useThemeColors } from "@/components/shared/ThemeProvider"

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@novapay.com"

// ── Types ────────────────────────────────────────────────────────────────────

interface Message { sender: string; content: string; createdAt: string }
interface TicketData {
  _id: string; subject: string; status: string; priority: string
  messages: Message[]; createdAt: string; updatedAt: string
}

type View = "hub" | "new-ticket" | "tickets"

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { color: string; bg: string; label: string; Icon: typeof Clock }> = {
  open:        { color: "#F79009", bg: "rgba(247,144,9,0.12)", label: "Open", Icon: Clock },
  in_progress: { color: "#1A2CCE", bg: "rgba(26,44,206,0.10)", label: "In Progress", Icon: Loader2 },
  resolved:    { color: "#12B76A", bg: "rgba(18,183,106,0.12)",  label: "Resolved", Icon: CheckCircle2 },
  closed:      { color: "#667085", bg: "#F2F4F7", label: "Closed", Icon: CheckCircle2 },
}

const CATEGORIES = [
  { id: "account",     label: "Account",      icon: Shield,          color: "#1A2CCE", bg: "rgba(26,44,206,0.10)" },
  { id: "transaction", label: "Transactions",  icon: ArrowLeftRight,  color: "#12B76A", bg: "rgba(18,183,106,0.12)" },
  { id: "card",        label: "Cards",         icon: CreditCard,      color: "#F79009", bg: "rgba(247,144,9,0.12)" },
  { id: "security",    label: "Security",      icon: Shield,          color: "#F04438", bg: "rgba(240,68,56,0.12)" },
  { id: "app",         label: "App & Tech",    icon: Smartphone,      color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  { id: "other",       label: "Other",         icon: HelpCircle,      color: "#667085", bg: "#F2F4F7" },
]

const FAQS = [
  { q: "How do I reset my transfer PIN?", a: "Go to Profile > Security to reset your 4-digit transfer PIN. You'll need to verify your identity." },
  { q: "How long do transfers take?", a: "Internal transfers are instant. External transfers may take 1-3 business days depending on the destination." },
  { q: "What are the swap fees?", a: "BTC swaps incur a small percentage fee (typically 1.5%). You can see the exact fee before confirming any swap." },
  { q: "How do I verify my identity?", a: "Navigate to Profile > KYC Verification and follow the steps to upload your documents for review." },
]

// ── Component ────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const colors = useThemeColors()
  const [view, setView]               = useState<View>("hub")
  const [tickets, setTickets]         = useState<TicketData[]>([])
  const [loading, setLoading]         = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState("")
  const [success, setSuccess]         = useState(false)
  const [expandedId, setExpandedId]   = useState<string | null>(null)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  // Form
  const [category, setCategory] = useState("")
  const [subject, setSubject]   = useState("")
  const [message, setMessage]   = useState("")
  const [priority, setPriority] = useState("normal")

  // Admin-configurable contact details
  const [contact, setContact] = useState<{
    phone: string; textPhone: string; email: string
    phoneHref: string; textHref: string; emailHref: string; canText: boolean
  } | null>(null)

  useEffect(() => {
    let active = true
    fetch("/api/public/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (active && d?.contact) setContact(d.contact) })
      .catch(() => { /* fall back to defaults below */ })
    return () => { active = false }
  }, [])

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/user/support")
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets || [])
      }
    } catch { /* */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  const handleSubmit = async () => {
    if (!subject || !message) return
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/user/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, priority, category: category || undefined }),
      })
      if (res.ok) {
        setSuccess(true)
        setCategory(""); setSubject(""); setMessage(""); setPriority("normal")
        fetchTickets()
      } else {
        const data = await res.json()
        setError(data.error || "Failed to submit")
      }
    } catch {
      setError("Network error. Please try again.")
    }
    setSubmitting(false)
  }

  const openLiveChat = () => {
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).smartsupp) {
      const smartsupp = (window as unknown as Record<string, (cmd: string) => void>).smartsupp
      smartsupp("chat:open")
    } else {
      const el = document.getElementById("smartsupp-widget-container")
        || document.querySelector("[data-smartsupp-widget]")
        || document.querySelector('iframe[title*="Smartsupp"]')
      if (el) {
        (el as HTMLElement).click()
      } else {
        alert("Live chat is loading. Please try again in a moment.")
      }
    }
  }

  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress")

  // ── Ticket Success ─────────────────────────────────────────────────────────

  if (success) {
    return (
      <>
        <UserHeader title="Support" showBack />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 120px" }}>
          <div style={{ paddingTop: 48, textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%", margin: "0 auto 20px",
              background: colors.isDark
                ? "linear-gradient(135deg, rgba(0,200,150,0.2) 0%, rgba(0,200,150,0.05) 100%)"
                : "linear-gradient(135deg, rgba(18,183,106,0.15) 0%, rgba(18,183,106,0.05) 100%)",
              border: `2px solid ${colors.green}4D`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <CheckCircle2 style={{ width: 32, height: 32, color: colors.green }} />
            </div>

            <p style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary, margin: "0 0 6px" }}>Ticket Submitted</p>
            <p style={{ fontSize: 14, color: colors.textSecondary, margin: "0 0 8px", lineHeight: 1.5 }}>
              Our support team will review your request and respond as soon as possible.
            </p>
            <p style={{ fontSize: 12, color: colors.textMuted, margin: "0 0 32px" }}>
              Average response time: under 2 hours
            </p>

            <button
              onClick={() => { setSuccess(false); setView("tickets") }}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                background: colors.isDark
                  ? "linear-gradient(135deg, #3B9EFF 0%, #2563EB 100%)"
                  : "linear-gradient(135deg, #1A2CCE 0%, #1622A8 100%)",
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 10,
              }}
            >
              View My Tickets
            </button>
            <button
              onClick={() => { setSuccess(false); setView("hub") }}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 14,
                background: colors.bgElevated, border: `1px solid ${colors.border}`,
                color: colors.textSecondary, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Back to Support
            </button>
          </div>
        </div>
      </>
    )
  }

  // ── New Ticket Form ────────────────────────────────────────────────────────

  if (view === "new-ticket") {
    const canSubmit = subject && message.length >= 10
    return (
      <>
        <UserHeader title="New Ticket" showBack onBack={() => setView("hub")} />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 120px" }}>

          {/* Category selection */}
          <div style={{ padding: "20px 0 0" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
              Category
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {CATEGORIES.map((cat) => {
                const CatIcon = cat.icon
                const active = category === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(active ? "" : cat.id)}
                    style={{
                      background: active ? cat.bg : colors.bgElevated,
                      border: `1px solid ${active ? cat.color + "33" : colors.border}`,
                      borderRadius: 12, padding: "12px 8px", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      transition: "all 150ms ease",
                    }}
                  >
                    <CatIcon style={{ width: 18, height: 18, color: active ? cat.color : colors.textMuted }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: active ? cat.color : colors.textSecondary }}>
                      {cat.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Subject */}
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              Subject
            </p>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your issue"
              maxLength={100}
              style={{
                width: "100%", background: colors.bgElevated, border: `1px solid ${colors.border}`,
                borderRadius: 12, padding: "12px 14px", color: colors.textPrimary, fontSize: 14, outline: "none",
              }}
            />
          </div>

          {/* Message */}
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              Describe your issue
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please provide as much detail as possible so we can help you quickly..."
              rows={5}
              style={{
                width: "100%", background: colors.bgElevated, border: `1px solid ${colors.border}`,
                borderRadius: 12, padding: "12px 14px", color: colors.textPrimary, fontSize: 14, outline: "none",
                resize: "none", lineHeight: 1.5,
              }}
            />
          </div>

          {/* Priority */}
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
              Priority
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {(["low", "normal", "high"] as const).map((p) => {
                const active = priority === p
                const pColor = p === "high" ? colors.red : p === "normal" ? colors.blue : colors.green
                return (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    style={{
                      flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer",
                      background: active ? pColor + "18" : colors.bgElevated,
                      border: `1px solid ${active ? pColor + "44" : colors.border}`,
                      color: active ? pColor : colors.textSecondary,
                      fontSize: 13, fontWeight: 600, textTransform: "capitalize",
                      transition: "all 150ms ease",
                    }}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: colors.redBg, border: `1px solid ${colors.red}33`,
              borderRadius: 12, padding: "10px 14px", marginTop: 16,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <AlertCircle style={{ width: 16, height: 16, color: colors.red, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: colors.red }}>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            style={{
              width: "100%", padding: "15px 0", borderRadius: 14, border: "none", marginTop: 24,
              background: canSubmit
                ? (colors.isDark ? "linear-gradient(135deg, #3B9EFF 0%, #2563EB 100%)" : "linear-gradient(135deg, #1A2CCE 0%, #1622A8 100%)")
                : colors.bgHover,
              color: canSubmit ? "#fff" : colors.textMuted,
              fontSize: 15, fontWeight: 700, cursor: canSubmit ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: canSubmit ? (colors.isDark ? "0 8px 32px rgba(59,158,255,0.2)" : "0 8px 32px rgba(26,44,206,0.15)") : "none",
              transition: "all 200ms ease",
            }}
          >
            {submitting ? (
              <><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Submitting...</>
            ) : (
              <><Send style={{ width: 15, height: 15 }} /> Submit Ticket</>
            )}
          </button>
        </div>
      </>
    )
  }

  // ── Ticket History ─────────────────────────────────────────────────────────

  if (view === "tickets") {
    return (
      <>
        <UserHeader title="My Tickets" showBack onBack={() => setView("hub")} />
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 120px" }}>

          {loading ? (
            <div style={{ paddingTop: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: 72, borderRadius: 16, background: colors.bgElevated }} />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ paddingTop: 60, textAlign: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%", margin: "0 auto 16px",
                background: colors.blueBg, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Ticket style={{ width: 28, height: 28, color: colors.blue }} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>No tickets yet</p>
              <p style={{ fontSize: 13, color: colors.textTertiary, margin: "0 0 20px" }}>
                Submit a ticket when you need help
              </p>
              <button
                onClick={() => setView("new-ticket")}
                style={{
                  padding: "10px 24px", borderRadius: 12, border: "none",
                  background: colors.blue, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                Create Ticket
              </button>
            </div>
          ) : (
            <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {tickets.map((ticket) => {
                const cfg = STATUS_CFG[ticket.status] || STATUS_CFG.open
                const StatusIcon = cfg.Icon
                const isExpanded = expandedId === ticket._id
                return (
                  <div
                    key={ticket._id}
                    style={{
                      background: colors.bgElevated, border: `1px solid ${colors.border}`,
                      borderRadius: 16, overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : ticket._id)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 12,
                        padding: "14px 16px", cursor: "pointer", background: "none", border: "none",
                        textAlign: "left",
                      }}
                    >
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <StatusIcon style={{ width: 16, height: 16, color: cfg.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 14, fontWeight: 600, color: colors.textPrimary, margin: 0,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {ticket.subject}
                        </p>
                        <p style={{ fontSize: 11, color: colors.textMuted, margin: "3px 0 0" }}>
                          {new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          {" · "}{ticket.messages.length} message{ticket.messages.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20, flexShrink: 0,
                        background: cfg.bg, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.05em",
                      }}>
                        {cfg.label}
                      </span>
                      <ChevronDown style={{
                        width: 14, height: 14, color: colors.textMuted, flexShrink: 0,
                        transition: "transform 200ms ease",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      }} />
                    </button>

                    {isExpanded && (
                      <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${colors.border}` }}>
                        {ticket.messages.map((msg, i) => {
                          const isUser = msg.sender === "user"
                          return (
                            <div
                              key={i}
                              style={{
                                marginTop: 10, padding: "10px 14px", borderRadius: 14,
                                background: isUser ? colors.blueBg : colors.greenBg,
                                borderLeft: `3px solid ${isUser ? colors.blue : colors.green}`,
                                maxWidth: "90%",
                                marginLeft: isUser ? "auto" : 0,
                                marginRight: isUser ? 0 : "auto",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: isUser ? colors.blue : colors.green }}>
                                  {isUser ? "You" : "Support Agent"}
                                </span>
                                <span style={{ fontSize: 10, color: colors.textMuted }}>
                                  {new Date(msg.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                </span>
                              </div>
                              <p style={{ fontSize: 13, color: colors.textSecondary, margin: 0, lineHeight: 1.5 }}>
                                {msg.content}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </>
    )
  }

  // ── Hub (Default) ──────────────────────────────────────────────────────────

  return (
    <>
      <UserHeader title="Support Center" showBack />

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 16px 120px" }}>

        {/* Hero */}
        <div style={{ padding: "24px 0 20px", textAlign: "center" }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, margin: "0 auto 14px",
            background: colors.isDark
              ? "linear-gradient(135deg, rgba(59,158,255,0.15) 0%, rgba(139,92,246,0.1) 100%)"
              : "linear-gradient(135deg, rgba(26,44,206,0.10) 0%, rgba(139,92,246,0.08) 100%)",
            border: `1px solid ${colors.blue}26`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Headphones style={{ width: 28, height: 28, color: colors.blue }} />
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary, margin: "0 0 4px" }}>How can we help?</p>
          <p style={{ fontSize: 13, color: colors.textTertiary, margin: 0, lineHeight: 1.5 }}>
            Choose your preferred support channel below
          </p>
        </div>

        {/* Two main options */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {/* Submit Ticket */}
          <button
            onClick={() => setView("new-ticket")}
            style={{
              background: colors.isDark
                ? "linear-gradient(180deg, rgba(59,158,255,0.08) 0%, rgba(59,158,255,0.02) 100%)"
                : "linear-gradient(180deg, rgba(26,44,206,0.08) 0%, rgba(26,44,206,0.03) 100%)",
              border: `1px solid ${colors.blue}26`,
              borderRadius: 20, padding: "24px 16px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              transition: "all 150ms ease", textAlign: "center",
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: colors.blueBg, border: `1px solid ${colors.blue}26`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Ticket style={{ width: 22, height: 22, color: colors.blue }} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, margin: "0 0 3px" }}>Submit Ticket</p>
              <p style={{ fontSize: 11, color: colors.textMuted, margin: 0, lineHeight: 1.4 }}>
                Get a detailed response within hours
              </p>
            </div>
          </button>

          {/* Live Chat */}
          <button
            type="button"
            onClick={openLiveChat}
            style={{
              background: colors.isDark
                ? "linear-gradient(180deg, rgba(0,200,150,0.08) 0%, rgba(0,200,150,0.02) 100%)"
                : "linear-gradient(180deg, rgba(18,183,106,0.08) 0%, rgba(18,183,106,0.03) 100%)",
              border: `1px solid ${colors.green}26`,
              borderRadius: 20, padding: "24px 16px", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              textAlign: "center",
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: colors.greenBg, border: `1px solid ${colors.green}26`,
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
            }}>
              <MessageCircle style={{ width: 22, height: 22, color: colors.green }} />
              <div style={{
                position: "absolute", top: -2, right: -2, width: 10, height: 10, borderRadius: "50%",
                background: colors.green, border: `2px solid ${colors.bgBase}`,
              }} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: colors.textPrimary, margin: "0 0 3px" }}>Live Chat</p>
              <p style={{ fontSize: 11, color: colors.textMuted, margin: 0, lineHeight: 1.4 }}>
                Chat with an agent in real time
              </p>
            </div>
          </button>
        </div>

        {/* Active tickets banner */}
        {openTickets.length > 0 && (
          <button
            onClick={() => setView("tickets")}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              background: colors.yellowBg || "rgba(247,144,9,0.06)", border: `1px solid ${colors.yellow || "#F79009"}1F`,
              borderRadius: 14, padding: "12px 16px", cursor: "pointer", marginBottom: 24,
              textAlign: "left",
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: colors.yellowBg || "rgba(247,144,9,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Clock style={{ width: 15, height: 15, color: colors.yellow || "#F79009" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
                {openTickets.length} active ticket{openTickets.length !== 1 ? "s" : ""}
              </p>
              <p style={{ fontSize: 11, color: colors.textMuted, margin: "2px 0 0" }}>
                Tap to view updates
              </p>
            </div>
            <ChevronRight style={{ width: 16, height: 16, color: colors.textMuted }} />
          </button>
        )}

        {/* View all tickets link */}
        {tickets.length > 0 && (
          <button
            onClick={() => setView("tickets")}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              background: colors.bgElevated, border: `1px solid ${colors.border}`,
              borderRadius: 14, padding: "14px 16px", cursor: "pointer", marginBottom: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Ticket style={{ width: 16, height: 16, color: colors.textTertiary }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>My Tickets</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                background: colors.blueBg, color: colors.blue,
              }}>
                {tickets.length}
              </span>
            </div>
            <ChevronRight style={{ width: 16, height: 16, color: colors.textMuted }} />
          </button>
        )}

        {/* FAQ Section */}
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary, margin: "0 0 12px" }}>
            Frequently Asked Questions
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQS.map((faq, i) => {
              const isOpen = expandedFaq === i
              return (
                <div
                  key={i}
                  style={{
                    background: colors.bgElevated, border: `1px solid ${colors.border}`,
                    borderRadius: 14, overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : i)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "13px 16px", cursor: "pointer", background: "none", border: "none",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, flex: 1, paddingRight: 12 }}>{faq.q}</span>
                    <ChevronDown style={{
                      width: 14, height: 14, color: colors.textMuted, flexShrink: 0,
                      transition: "transform 200ms ease",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }} />
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 16px 14px" }}>
                      <p style={{ fontSize: 13, color: colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
                        {faq.a}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Contact info — call, text, or email a specialist */}
        <div style={{
          marginTop: 28, padding: "20px 0",
          borderTop: `1px solid ${colors.border}`,
        }}>
          <p style={{ fontSize: 12, color: colors.textMuted, margin: "0 0 12px", textAlign: "center" }}>
            Speak directly or text with a support specialist — available 24/7 for urgent issues
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <a
              href={contact?.phoneHref ?? "#"}
              style={{
                display: "flex", alignItems: "center", gap: 12, textDecoration: "none",
                background: colors.bgElevated, border: `1px solid ${colors.border}`,
                borderRadius: 12, padding: "12px 14px",
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: colors.blueBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Phone style={{ width: 16, height: 16, color: colors.blue }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>Call support</p>
                <p style={{ fontSize: 12, color: colors.textMuted, margin: "1px 0 0" }}>{contact?.phone ?? "—"}</p>
              </div>
              <ChevronRight style={{ width: 15, height: 15, color: colors.textMuted, flexShrink: 0 }} />
            </a>
            <a
              href={contact?.textHref ?? "#"}
              style={{
                display: "flex", alignItems: "center", gap: 12, textDecoration: "none",
                background: colors.bgElevated, border: `1px solid ${colors.border}`,
                borderRadius: 12, padding: "12px 14px",
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: colors.greenBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MessageCircle style={{ width: 16, height: 16, color: colors.green }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>Text a specialist</p>
                <p style={{ fontSize: 12, color: colors.textMuted, margin: "1px 0 0" }}>{contact?.textPhone ?? "—"}</p>
              </div>
              <ChevronRight style={{ width: 15, height: 15, color: colors.textMuted, flexShrink: 0 }} />
            </a>
            <a
              href={contact?.emailHref ?? `mailto:${SUPPORT_EMAIL}`}
              style={{
                display: "flex", alignItems: "center", gap: 12, textDecoration: "none",
                background: colors.bgElevated, border: `1px solid ${colors.border}`,
                borderRadius: 12, padding: "12px 14px",
              }}
            >
              <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: colors.bgHover, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Send style={{ width: 15, height: 15, color: colors.textSecondary }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>Email us</p>
                <p style={{ fontSize: 12, color: colors.textMuted, margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contact?.email ?? SUPPORT_EMAIL}</p>
              </div>
              <ChevronRight style={{ width: 15, height: 15, color: colors.textMuted, flexShrink: 0 }} />
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
