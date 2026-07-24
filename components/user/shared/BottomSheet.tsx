"use client"

import { useRef } from "react"
import { X } from "lucide-react"
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock"

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  height?: "40vh" | "60vh" | "80vh" | "auto"
}

export function BottomSheet({ isOpen, onClose, title, children, height = "80vh" }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useBodyScrollLock(isOpen)

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: "rgba(16,24,40,0.4)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-hidden"
        style={{
          background: "#FFFFFF",
          borderRadius: "24px 24px 0 0",
          maxHeight: height,
          animation: "slideUp 300ms ease-out",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: "#D0D5DD",
            }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h2 style={{ color: "#101828", fontSize: 17, fontWeight: 600 }}>{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            style={{ background: "#F9FAFB", border: "1px solid #EAECF0" }}
          >
            <X className="h-4 w-4" style={{ color: "#667085" }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {children}
        </div>
      </div>
    </>
  )
}
