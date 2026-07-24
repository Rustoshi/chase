"use client"

import { useRef, useCallback } from "react"

interface QuickActionButtonProps {
  icon:      React.ReactNode
  label:     string
  onClick:   () => void
  disabled?: boolean
  badge?:    string
  gradient?: string
  color?:    string
}

export function QuickActionButton({ icon, label, onClick, disabled, badge, gradient, color }: QuickActionButtonProps) {
  const rippleRef = useRef<HTMLSpanElement>(null)

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return

    const btn = e.currentTarget
    const circle = document.createElement("span")
    const rect = btn.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    circle.style.width = circle.style.height = `${size}px`
    circle.style.left = `${e.clientX - rect.left - size / 2}px`
    circle.style.top = `${e.clientY - rect.top - size / 2}px`
    circle.style.position = "absolute"
    circle.style.borderRadius = "50%"
    circle.style.background = "rgba(16,24,40,0.06)"
    circle.style.animation = "ripple 300ms ease-out forwards"
    circle.style.pointerEvents = "none"
    btn.appendChild(circle)
    setTimeout(() => circle.remove(), 350)

    onClick()
  }, [onClick, disabled])

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className="relative flex flex-1 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl py-3 transition-all"
      style={{
        minHeight: 44,
        minWidth: 0,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {badge && (
        <span
          className="absolute -right-0.5 -top-0.5 z-10 flex h-[18px] items-center rounded-full px-1.5 text-[9px] font-bold text-white"
          style={{ background: "#F04438" }}
        >
          {badge}
        </span>
      )}

      <div
        className="flex h-12 w-12 items-center justify-center rounded-full text-white transition-transform active:scale-[0.88]"
        style={{
          background: gradient || color || "linear-gradient(135deg, #1A2CCE 0%, #1A2CCE 100%)",
          boxShadow: `0 4px 12px ${color ? color + "40" : "rgba(26,44,206,0.3)"}`,
        }}
      >
        {icon}
      </div>

      <span className="max-w-full px-0.5 text-center text-[11px] font-medium leading-tight" style={{ color: "#667085" }}>
        {label}
      </span>

      <span ref={rippleRef} />
    </button>
  )
}
