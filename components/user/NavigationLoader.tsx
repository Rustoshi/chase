"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"

/* ══════════════════════════════════════════════════════════════════════════
   Routing splash (per dashboard-design.md — Grey style).
   Shown briefly on client-side route changes. Visually identical to the entry
   SplashScreen so the whole loading experience is one language. Timed with
   setTimeout (not requestAnimationFrame) so it never stalls in hidden tabs.
   ══════════════════════════════════════════════════════════════════════════ */

interface NavigationLoaderProps {
  /** How long the loader stays before it starts fading (ms) */
  minDuration?: number
}

export function NavigationLoader({ minDuration = 450 }: NavigationLoaderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [phase, setPhase] = useState<"idle" | "show" | "exit">("idle")
  const firstRun = useRef(true)

  useEffect(() => {
    // Skip the very first mount — the entry SplashScreen already covers it.
    if (firstRun.current) { firstRun.current = false; return }

    setPhase("show")
    const t1 = setTimeout(() => setPhase("exit"), minDuration)
    const t2 = setTimeout(() => setPhase("idle"), minDuration + 350)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [pathname, searchParams, minDuration])

  if (phase === "idle") return null

  return (
    <div
      aria-hidden
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        backgroundColor: "var(--dash-surface)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 28,
        fontFamily: "var(--dash-font)",
        opacity: phase === "exit" ? 0 : 1,
        transition: "opacity 350ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <Image src="/images/logo.png" alt={BANK_NAME} width={256} height={128} style={{ height: 28, width: "auto" }} />
      <span className="nav-loader-spinner" />
      <style>{`
        .nav-loader-spinner {
          width: 28px; height: 28px; border-radius: 50%;
          border: 3px solid var(--dash-primary-bg);
          border-top-color: var(--dash-primary);
          animation: navLoaderSpin 0.7s linear infinite;
        }
        @keyframes navLoaderSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
