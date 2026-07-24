import { cn } from "@/lib/utils"

export type BadgeVariant = "default" | "secondary" | "success" | "warning" | "destructive" | "outline"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  default:     "bg-[#0F4C81] text-white",
  secondary:   "bg-slate-100 text-slate-700",
  success:     "bg-emerald-50 text-emerald-700 border border-emerald-100",
  warning:     "bg-amber-50 text-amber-700 border border-amber-100",
  destructive: "bg-red-50 text-red-700 border border-red-100",
  outline:     "border border-slate-200 text-slate-700",
}

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        VARIANT_STYLES[variant],
        className
      )}
      {...props}
    />
  )
}
