"use client"

import { useEffect, useState } from "react"
import { useForm }        from "react-hook-form"
import { zodResolver }    from "@hookform/resolvers/zod"
import { z }              from "zod"
import { X, User, MapPin, Shield, Settings, AlertTriangle, Wallet } from "lucide-react"
import { toast }          from "@/components/ui/use-toast"
import { getCurrencySymbol } from "@/lib/utils/currency"
import type { UserDetail } from "@/lib/services/user.service"
import {
  DASH, Field, TextInput, TextArea, NativeSelect, InfoBox, PrimaryButton, GhostButton,
} from "./_ui"

// Fallback list if the platform settings fetch is unavailable.
const FALLBACK_CURRENCIES = [
  "USD", "EUR", "GBP", "CAD", "AUD", "CHF", "JPY", "CNY", "INR", "NGN",
  "GHS", "KES", "ZAR", "BRL", "MXN", "AED", "SAR", "MUR", "SCR", "SRD",
]

const Schema = z.object({
  firstName:     z.string().min(1, "First name is required"),
  lastName:      z.string().min(1, "Last name is required"),
  email:         z.string().email("Invalid email"),
  phone:         z.string().optional(),
  dateOfBirth:   z.string().optional(),
  street:        z.string().optional(),
  city:          z.string().optional(),
  state:         z.string().optional(),
  zip:           z.string().optional(),
  country:       z.string().optional(),
  role:          z.enum(["user", "admin"]),
  kycStatus:     z.enum(["unverified", "pending", "verified", "rejected"]),
  kycTier:       z.coerce.number().int().min(1).max(3),
  isActive:      z.boolean(),
  isSuspended:   z.boolean(),
  suspendReason: z.string().optional(),
  emailVerified: z.boolean(),
  twoFactorEnabled: z.boolean(),
  transferPin:   z.string().optional(),
  preferredCurrency: z.string().min(1, "Currency is required"),
  joinedDate:    z.string().optional(),
})

type FormValues = z.infer<typeof Schema>

interface Props {
  open:      boolean
  onClose:   () => void
  onSuccess: () => void
  user:      UserDetail
}

/* Toggle row with checkbox + label + hint */
function ToggleRow({
  id, label, hint, disabled, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label htmlFor={id} style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: disabled ? "default" : "pointer" }}>
      <input
        id={id}
        type="checkbox"
        disabled={disabled}
        {...props}
        style={{ width: 18, height: 18, marginTop: 1, accentColor: DASH.primary, cursor: disabled ? "default" : "pointer", flexShrink: 0 }}
      />
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 500, color: DASH.text }}>{label}</span>
        {hint && <span style={{ display: "block", fontSize: 12, color: DASH.textMuted, marginTop: 1 }}>{hint}</span>}
      </span>
    </label>
  )
}

export function EditUserModal({ open, onClose, onSuccess, user }: Props) {
  const [activeTab, setActiveTab] = useState<"profile" | "address" | "security" | "settings" | "balances">("profile")
  const [balances, setBalances] = useState<Record<string, string>>({})
  const [savingBalances, setSavingBalances] = useState(false)
  const [currencies, setCurrencies] = useState<string[]>(FALLBACK_CURRENCIES)

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(Schema),
      defaultValues: getDefaults(user),
    })

  function getDefaults(u: UserDetail): FormValues {
    return {
      firstName:     u.firstName,
      lastName:      u.lastName,
      email:         u.email,
      phone:         u.phone ?? "",
      dateOfBirth:   u.dateOfBirth ? u.dateOfBirth.slice(0, 10) : "",
      street:        u.address?.street  ?? "",
      city:          u.address?.city    ?? "",
      state:         u.address?.state   ?? "",
      zip:           u.address?.zip     ?? "",
      country:       u.address?.country ?? "",
      role:          u.role as "user" | "admin",
      kycStatus:     u.kycStatus as FormValues["kycStatus"],
      kycTier:       u.kycTier,
      isActive:      u.isActive,
      isSuspended:   u.isSuspended,
      suspendReason: u.suspendReason ?? "",
      emailVerified: u.emailVerified,
      twoFactorEnabled: u.twoFactorEnabled,
      transferPin:   (u as any).transferPin ?? "",
      preferredCurrency: u.preferredCurrency || "USD",
      joinedDate:    u.createdAt ? u.createdAt.slice(0, 10) : "",
    }
  }

  const watchedRole       = watch("role")
  const watchedKycStatus  = watch("kycStatus")
  const watchedSuspended  = watch("isSuspended")
  const watchedCurrency   = watch("preferredCurrency")

  useEffect(() => {
    if (open) {
      reset(getDefaults(user))
      setActiveTab("profile")
      // Initialize balances from user accounts
      const initialBalances: Record<string, string> = {}
      user.accounts?.forEach((acc) => {
        if (acc.walletType === "bitcoin") {
          initialBalances[acc.id] = acc.btcBalance.toString()
        } else {
          initialBalances[acc.id] = (acc.balance / 100).toFixed(2) // Convert cents to dollars
        }
      })
      setBalances(initialBalances)
    }
  }, [open, user, reset])

  // Load the platform's supported currencies for the selector
  useEffect(() => {
    if (!open) return
    ;(async () => {
      try {
        const res = await fetch("/api/public/settings")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.supportedCurrencies) && data.supportedCurrencies.length > 0) {
            setCurrencies(data.supportedCurrencies)
          }
        }
      } catch { /* keep fallback list */ }
    })()
  }, [open])

  const onSubmit = async (values: FormValues) => {
    const body = {
      firstName:     values.firstName,
      lastName:      values.lastName,
      email:         values.email,
      phone:         values.phone || undefined,
      dateOfBirth:   values.dateOfBirth || undefined,
      address: {
        street:  values.street  || undefined,
        city:    values.city    || undefined,
        state:   values.state   || undefined,
        zip:     values.zip     || undefined,
        country: values.country || undefined,
      },
      role:          values.role,
      kycStatus:     values.kycStatus,
      kycTier:       values.kycTier,
      isActive:      values.isActive,
      isSuspended:   values.isSuspended,
      suspendReason: values.isSuspended ? values.suspendReason : undefined,
      emailVerified: values.emailVerified,
      transferPin:   values.transferPin || undefined,
      preferredCurrency: values.preferredCurrency,
      createdAt:     values.joinedDate || undefined,
    }

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast({ title: "Update failed", description: data.error ?? "Unknown error", variant: "destructive" })
      return
    }

    toast({ title: "User updated", variant: "success" })
    onSuccess()
    onClose()
  }

  if (!open) return null

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "address", label: "Address", icon: MapPin },
    { id: "security", label: "Security", icon: Shield },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "balances", label: "Balances", icon: Wallet },
  ] as const

  const handleBalanceChange = (accountId: string, value: string) => {
    setBalances((prev) => ({ ...prev, [accountId]: value }))
  }

  const saveBalance = async (accountId: string, isBitcoin: boolean) => {
    const value = balances[accountId]
    if (value === undefined || value === "") return

    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue < 0) {
      toast({ title: "Invalid balance", description: "Please enter a valid positive number", variant: "destructive" })
      return
    }

    // Convert to cents/satoshis for storage
    const newBalance = isBitcoin ? numValue : Math.round(numValue * 100)

    setSavingBalances(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/set-balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, newBalance }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast({ title: "Failed to update balance", description: data.error ?? "Unknown error", variant: "destructive" })
        return
      }

      toast({ title: "Balance updated", description: "Account balance has been set directly", variant: "success" })
      onSuccess()
    } catch {
      toast({ title: "Error", description: "Failed to update balance", variant: "destructive" })
    } finally {
      setSavingBalances(false)
    }
  }

  const twoColClass = "grid grid-cols-1 sm:grid-cols-2 gap-3.5"

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50, display: "flex",
        alignItems: "flex-end", justifyContent: "center",
        backgroundColor: "rgba(16,24,40,0.55)", backdropFilter: "blur(2px)",
        fontFamily: DASH.font,
      }}
      className="sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="edit-user-sheet"
        style={{
          backgroundColor: DASH.surface, width: "100%", maxWidth: 640,
          maxHeight: "95vh", display: "flex", flexDirection: "column",
          boxShadow: "0 20px 48px rgba(16,24,40,0.24)", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 20px", borderBottom: `1px solid ${DASH.border}`, flexShrink: 0,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: DASH.text, margin: 0 }}>Edit user</h2>
            <p style={{ fontSize: 13, color: DASH.textMuted, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.email}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              display: "flex", padding: 8, borderRadius: DASH.radiusControl, border: "none",
              background: "none", color: DASH.textMuted, cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = DASH.surface2 }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${DASH.border}`, flexShrink: 0, overflowX: "auto" }}>
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: "1 0 auto", display: "flex", alignItems: "center", justifyContent: "center",
                  gap: 7, padding: "12px 14px", fontSize: 13, fontWeight: 500,
                  border: "none", borderBottom: `2px solid ${active ? DASH.primary : "transparent"}`,
                  background: active ? DASH.primaryTint : "transparent",
                  color: active ? DASH.primary : DASH.textMuted, cursor: "pointer",
                  transition: "color .15s, background .15s", whiteSpace: "nowrap",
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>

            {/* Profile */}
            {activeTab === "profile" && (
              <>
                <div className={twoColClass}>
                  <Field label="First name" htmlFor="eu-first" required error={errors.firstName?.message}>
                    <TextInput id="eu-first" placeholder="John" {...register("firstName")} />
                  </Field>
                  <Field label="Last name" htmlFor="eu-last" required error={errors.lastName?.message}>
                    <TextInput id="eu-last" placeholder="Doe" {...register("lastName")} />
                  </Field>
                </div>
                <Field label="Email" htmlFor="eu-email" required error={errors.email?.message}>
                  <TextInput id="eu-email" type="email" placeholder="john@example.com" {...register("email")} />
                </Field>
                <div className={twoColClass}>
                  <Field label="Phone" htmlFor="eu-phone">
                    <TextInput id="eu-phone" placeholder="+1 555 123 4567" {...register("phone")} />
                  </Field>
                  <Field label="Date of birth" htmlFor="eu-dob">
                    <TextInput id="eu-dob" type="date" {...register("dateOfBirth")} />
                  </Field>
                </div>
                <Field
                  label="Joined date"
                  htmlFor="eu-joined"
                  hint="The account's registration date shown across the app"
                >
                  <TextInput id="eu-joined" type="date" {...register("joinedDate")} />
                </Field>
              </>
            )}

            {/* Address */}
            {activeTab === "address" && (
              <>
                <Field label="Street address" htmlFor="eu-street">
                  <TextInput id="eu-street" placeholder="123 Main Street" {...register("street")} />
                </Field>
                <div className={twoColClass}>
                  <Field label="City" htmlFor="eu-city">
                    <TextInput id="eu-city" placeholder="New York" {...register("city")} />
                  </Field>
                  <Field label="State / Province" htmlFor="eu-state">
                    <TextInput id="eu-state" placeholder="NY" {...register("state")} />
                  </Field>
                </div>
                <div className={twoColClass}>
                  <Field label="ZIP / Postal code" htmlFor="eu-zip">
                    <TextInput id="eu-zip" placeholder="10001" {...register("zip")} />
                  </Field>
                  <Field label="Country" htmlFor="eu-country">
                    <TextInput id="eu-country" placeholder="United States" {...register("country")} />
                  </Field>
                </div>
              </>
            )}

            {/* Security */}
            {activeTab === "security" && (
              <>
                <div className={twoColClass}>
                  <Field label="Role" htmlFor="eu-role">
                    <NativeSelect id="eu-role" {...register("role")}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </NativeSelect>
                  </Field>
                  <Field label="KYC tier" htmlFor="eu-tier">
                    <NativeSelect id="eu-tier" {...register("kycTier")}>
                      <option value={1}>Tier 1 — Basic</option>
                      <option value={2}>Tier 2 — Standard</option>
                      <option value={3}>Tier 3 — Premium</option>
                    </NativeSelect>
                  </Field>
                </div>
                {watchedRole === "admin" && (
                  <InfoBox tone="warning" icon={AlertTriangle}>Admin role grants full portal access</InfoBox>
                )}

                <Field label="KYC status" htmlFor="eu-kyc">
                  <NativeSelect id="eu-kyc" {...register("kycStatus")}>
                    <option value="unverified">Unverified</option>
                    <option value="pending">Pending Review</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </NativeSelect>
                </Field>
                {watchedKycStatus !== user.kycStatus && (
                  <InfoBox tone="warning" icon={AlertTriangle}>Changing KYC status overrides the review process</InfoBox>
                )}

                <Field
                  label="Transfer PIN"
                  htmlFor="eu-pin"
                  hint="4-digit PIN used for authorizing transfers (leave empty to keep current)"
                >
                  <TextInput id="eu-pin" type="text" maxLength={4} placeholder="4-digit PIN" {...register("transferPin")} />
                </Field>

                <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingTop: 4 }}>
                  <ToggleRow
                    id="eu-email-verified"
                    label="Email verified"
                    hint="User has confirmed their email address"
                    {...register("emailVerified")}
                  />
                  <ToggleRow
                    id="eu-2fa"
                    label="Two-factor authentication"
                    hint="User manages this setting themselves"
                    disabled
                    {...register("twoFactorEnabled")}
                  />
                </div>
              </>
            )}

            {/* Settings */}
            {activeTab === "settings" && (
              <>
                <Field
                  label="Preferred currency"
                  htmlFor="eu-currency"
                  hint="Currency used to display this user's balances and amounts across the app"
                  error={errors.preferredCurrency?.message}
                >
                  <NativeSelect id="eu-currency" {...register("preferredCurrency")}>
                    {!currencies.includes(watchedCurrency) && watchedCurrency && (
                      <option value={watchedCurrency}>{getCurrencySymbol(watchedCurrency)} {watchedCurrency}</option>
                    )}
                    {currencies.map((c) => (
                      <option key={c} value={c}>{getCurrencySymbol(c)} {c}</option>
                    ))}
                  </NativeSelect>
                </Field>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <ToggleRow
                    id="eu-active"
                    label="Account active"
                    hint="User can log in and use the platform"
                    {...register("isActive")}
                  />
                  <ToggleRow
                    id="eu-suspended"
                    label="Account suspended"
                    hint="Temporarily block user access"
                    {...register("isSuspended")}
                  />
                </div>

                {watchedSuspended && (
                  <Field label="Suspension reason" htmlFor="eu-suspend-reason">
                    <TextArea id="eu-suspend-reason" rows={3} placeholder="Reason for suspension…" {...register("suspendReason")} />
                  </Field>
                )}

                <div
                  style={{
                    borderRadius: DASH.radiusInner, backgroundColor: DASH.surface2,
                    border: `1px solid ${DASH.border}`, padding: 16,
                  }}
                >
                  <h4 style={{ fontSize: 13, fontWeight: 600, color: DASH.text, margin: "0 0 12px" }}>Account info</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      { label: "User ID",       value: user.id, mono: true },
                      { label: "Referral code", value: user.referralCode, mono: true },
                      { label: "Accounts",      value: String(user.accounts?.length ?? 0) },
                      { label: "Currency",      value: `${getCurrencySymbol(watchedCurrency)} ${watchedCurrency}` },
                    ].map((row) => (
                      <div key={row.label} style={{ minWidth: 0 }}>
                        <span style={{ fontSize: 11.5, color: DASH.textMuted }}>{row.label}</span>
                        <p style={{
                          fontSize: row.mono ? 11.5 : 13, color: DASH.text, margin: "2px 0 0",
                          fontFamily: row.mono ? "ui-monospace, monospace" : undefined,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {row.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Balances */}
            {activeTab === "balances" && (
              <>
                <InfoBox tone="warning" icon={AlertTriangle} title="Direct balance edit">
                  Changes here will NOT create transactions. Use for corrections only.
                </InfoBox>

                {(!user.accounts || user.accounts.length === 0) ? (
                  <p style={{ fontSize: 13.5, color: DASH.textMuted, textAlign: "center", padding: "32px 0" }}>
                    No accounts found for this user.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {user.accounts.map((account) => {
                      const isBitcoin = account.walletType === "bitcoin"
                      const currencySymbol = isBitcoin ? "₿" : getCurrencySymbol(watchedCurrency)
                      const accountLabel = isBitcoin
                        ? "Bitcoin Wallet"
                        : `${watchedCurrency} ${account.accountType || "Account"}`

                      return (
                        <div
                          key={account.id}
                          style={{
                            padding: 16, borderRadius: DASH.radiusInner,
                            border: `1px solid ${DASH.border}`, backgroundColor: DASH.surface2,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ fontSize: 13.5, fontWeight: 600, color: DASH.text, margin: 0 }}>{accountLabel}</p>
                              <p style={{ fontSize: 12, color: DASH.textMuted, margin: "2px 0 0", fontFamily: "ui-monospace, monospace" }}>
                                {account.accountNumber}
                              </p>
                            </div>
                            {account.isFrozen && (
                              <span style={{
                                padding: "3px 9px", fontSize: 11, fontWeight: 600, borderRadius: 999,
                                backgroundColor: DASH.dangerBg, color: DASH.danger,
                              }}>
                                Frozen
                              </span>
                            )}
                          </div>

                          <div style={{ display: "flex", gap: 8 }}>
                            <div style={{ position: "relative", flex: 1 }}>
                              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: DASH.textMuted, pointerEvents: "none" }}>
                                {currencySymbol}
                              </span>
                              <TextInput
                                type="number"
                                step={isBitcoin ? "0.00000001" : "0.01"}
                                min="0"
                                value={balances[account.id] ?? ""}
                                onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                                placeholder={isBitcoin ? "0.00000000" : "0.00"}
                                style={{ paddingLeft: 30 }}
                              />
                            </div>
                            <PrimaryButton
                              type="button"
                              onClick={() => saveBalance(account.id, isBitcoin)}
                              disabled={savingBalances}
                              style={{ flexShrink: 0, padding: "0 18px" }}
                            >
                              {savingBalances ? "…" : "Set"}
                            </PrimaryButton>
                          </div>

                          <p style={{ fontSize: 12, color: DASH.textMuted, margin: "8px 0 0" }}>
                            Current: {currencySymbol}{isBitcoin ? account.btcBalance.toFixed(8) : (account.balance / 100).toFixed(2)}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex", flexDirection: "row", gap: 10, justifyContent: "flex-end",
              padding: "16px 20px", borderTop: `1px solid ${DASH.border}`,
              backgroundColor: DASH.surface2, flexShrink: 0,
            }}
          >
            <GhostButton type="button" onClick={onClose} disabled={isSubmitting}>Cancel</GhostButton>
            <PrimaryButton type="submit" disabled={isSubmitting} style={{ minWidth: 150 }}>
              {isSubmitting ? "Saving…" : "Save changes"}
            </PrimaryButton>
          </div>
        </form>
      </div>

      {/* Rounded corners: sheet on mobile, dialog on desktop */}
      <style>{`
        .edit-user-sheet { border-radius: 20px 20px 0 0; }
        @media (min-width: 640px) { .edit-user-sheet { border-radius: ${DASH.radiusCard}px; } }
      `}</style>
    </div>
  )
}
