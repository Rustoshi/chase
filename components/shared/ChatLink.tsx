"use client"

import type React from "react"

/**
 * Opens the Smartsupp live-chat widget. The SmartsuppChat loader defines a
 * command queue (`window.smartsupp`) as soon as it mounts, so `chat:open` is
 * queued and runs once the widget script finishes loading.
 */
export function openSmartsupp() {
  if (typeof window === "undefined") return
  const w = window as unknown as { smartsupp?: (...args: unknown[]) => void }
  if (typeof w.smartsupp === "function") {
    w.smartsupp("chat:open")
    return
  }
  // Fallback: click the rendered widget launcher if the API isn't ready yet.
  const el =
    document.getElementById("smartsupp-widget-container") ||
    document.querySelector('iframe[title*="Smartsupp" i]') ||
    document.querySelector("[data-smartsupp-widget]")
  if (el) (el as HTMLElement).click()
}

interface ChatLinkProps {
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}

/** A link/button that opens the Smartsupp chat widget instead of navigating. */
export function ChatLink({ className, style, children }: ChatLinkProps) {
  return (
    <a
      href="#chat"
      onClick={(e) => { e.preventDefault(); openSmartsupp() }}
      className={className}
      style={style}
    >
      {children}
    </a>
  )
}
