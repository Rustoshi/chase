"use client"

import * as RadixToast from "@radix-ui/react-toast"
import { X }          from "lucide-react"
import { cn }         from "@/lib/utils"
import type { Toast, ToastVariant } from "./use-toast"

const VARIANT_STYLES: Record<ToastVariant, string> = {
  default:     "bg-white border-slate-200 text-slate-900",
  success:     "bg-emerald-50 border-emerald-200 text-emerald-900",
  destructive: "bg-red-50 border-red-200 text-red-900",
}

interface ToastItemProps extends Toast {
  onDismiss: (id: string) => void
}

export function ToastItem({ id, title, description, variant = "default", onDismiss }: ToastItemProps) {
  return (
    <RadixToast.Root
      className={cn(
        "relative flex w-[360px] items-start gap-3 rounded-xl border p-4 shadow-lg",
        "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        VARIANT_STYLES[variant]
      )}
      onOpenChange={(open) => { if (!open) onDismiss(id) }}
    >
      <div className="flex-1 space-y-0.5">
        {title && (
          <RadixToast.Title className="text-sm font-semibold leading-5">
            {title}
          </RadixToast.Title>
        )}
        {description && (
          <RadixToast.Description className="text-sm opacity-80">
            {description}
          </RadixToast.Description>
        )}
      </div>
      <RadixToast.Close
        onClick={() => onDismiss(id)}
        className="mt-0.5 rounded p-0.5 opacity-50 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </RadixToast.Close>
    </RadixToast.Root>
  )
}
