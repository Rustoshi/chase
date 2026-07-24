import { cn } from "@/lib/utils"

export type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral"

interface StatusBadgeProps {
  status:   string
  variant?: StatusVariant
}

const AUTO_MAP: Record<string, StatusVariant> = {
  active:       "success",
  approved:     "success",
  completed:    "success",
  verified:     "success",
  disbursed:    "success",
  pending:      "warning",
  processing:   "warning",
  unverified:   "warning",
  in_progress:  "warning",
  under_review: "info",
  open:         "info",
  rejected:     "danger",
  failed:       "danger",
  suspended:    "danger",
  frozen:       "danger",
  blocked:      "danger",
  defaulted:    "danger",
  inactive:     "neutral",
  cancelled:    "neutral",
  closed:       "neutral",
}

const CLASSES: Record<StatusVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  warning: "bg-amber-50  text-amber-700  border-amber-100",
  danger:  "bg-red-50    text-red-700    border-red-100",
  info:    "bg-indigo-50   text-indigo-700   border-indigo-100",
  neutral: "bg-slate-100 text-slate-600  border-slate-200",
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const key      = status.toLowerCase().replace(/\s+/g, "_")
  const resolved = variant ?? AUTO_MAP[key] ?? "neutral"
  const label    = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-4",
        CLASSES[resolved]
      )}
    >
      {label}
    </span>
  )
}
