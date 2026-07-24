"use client"

import { useEffect }    from "react"
import { X }            from "lucide-react"
import { cn }           from "@/lib/utils"

interface SheetProps {
  open:      boolean
  onClose:   () => void
  children:  React.ReactNode
  title?:    string
  width?:    string
  className?: string
}

export function Sheet({ open, onClose, children, width = "560px", className }: SheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    if (open) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed right-0 top-0 z-50 h-full overflow-y-auto bg-white shadow-2xl",
          "transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
          className
        )}
        style={{ width, maxWidth: "100vw" }}
      >
        {children}
      </aside>
    </>
  )
}

export function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4", className)}
      {...props}
    />
  )
}

export function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-base font-semibold text-slate-900", className)} {...props} />
}

export function SheetBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-5", className)} {...props} />
}

interface SheetCloseProps {
  onClose: () => void
}

export function SheetClose({ onClose }: SheetCloseProps) {
  return (
    <button
      onClick={onClose}
      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
      aria-label="Close"
    >
      <X className="h-4 w-4" />
    </button>
  )
}
