"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    smartsupp?: ((...args: unknown[]) => void) & { _: unknown[] }
    _smartsupp?: Record<string, unknown>
  }
}

const SMARTSUPP_KEY = process.env.NEXT_PUBLIC_SMARTSUPP_KEY || "8a3f7c89a4f09241feea2b06e1bb805d0a4044b6"

// Pixels to lift the launcher above the mobile bottom navigation. Applied via
// Smartsupp's own `offsetY` config (not CSS), so Smartsupp repositions the
// widget for every state — closed bubble and open panel — without distortion.
const MOBILE_OFFSET_Y = 78
const MOBILE_BREAKPOINT = 1024 // matches the lg breakpoint where the bottom nav shows

/**
 * Loads the Smartsupp live-chat widget (standard loader snippet). On mobile the
 * launcher is lifted above the bottom nav using Smartsupp's documented
 * `_smartsupp.offsetY` config — never CSS/DOM overrides (those distort the
 * full-screen panel on mobile). See https://docs.smartsupp.com/chat-box/configuration/
 */
export function SmartsuppChat() {
  useEffect(() => {
    if (typeof window === "undefined") return

    // Load once (guard against re-init on remount).
    if (window.smartsupp) return

    window._smartsupp = window._smartsupp || {}
    window._smartsupp.key = SMARTSUPP_KEY
    // Set BEFORE the loader runs — Smartsupp reads offsetY at init.
    if (window.innerWidth < MOBILE_BREAKPOINT) {
      window._smartsupp.offsetY = MOBILE_OFFSET_Y
    }

    window.smartsupp = function (...args: unknown[]) {
      window.smartsupp!._.push(args)
    } as Window["smartsupp"]
    window.smartsupp!._ = []

    const s = document.getElementsByTagName("script")[0]
    const c = document.createElement("script")
    c.type = "text/javascript"
    c.charset = "utf-8"
    c.async = true
    c.src = "https://www.smartsuppchat.com/loader.js?"
    s?.parentNode?.insertBefore(c, s)
  }, [])

  return null
}
