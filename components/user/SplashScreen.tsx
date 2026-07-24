"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { BANK_NAME } from "@/lib/brand"

/* ══════════════════════════════════════════════════════════════════════════
   Dashboard splash (per dashboard-design.md — Grey style).
   The single full-screen loader for the app. Children render behind it so
   the app is ready the instant the splash fades — no second loader flash.
   Timed with setTimeout (not requestAnimationFrame) so it reliably completes
   even in background/hidden tabs.
   ══════════════════════════════════════════════════════════════════════════ */

interface SplashScreenProps {
  children: React.ReactNode
  /** How long the splash stays before it starts fading (ms) */
  minDuration?: number
}

export function SplashScreen({ children, minDuration = 1300 }: SplashScreenProps) {
  const [phase, setPhase] = useState<"show" | "exit" | "done">("show")

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("exit"), minDuration)
    const t2 = setTimeout(() => setPhase("done"), minDuration + 450)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [minDuration])

  return (
    <>
      {children}
      {phase !== "done" && (
        <div
          aria-hidden
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            backgroundColor: "var(--dash-surface)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 30,
            fontFamily: "var(--dash-font)",
            opacity: phase === "exit" ? 0 : 1,
            transition: "opacity 450ms cubic-bezier(0.4, 0, 0.2, 1)",
            pointerEvents: phase === "exit" ? "none" : "auto",
          }}
        >
          <Image src="/images/logo.png" alt={BANK_NAME} width={256} height={128} priority style={{ height: 30, width: "auto" }} />
          <span className="sh-splash-spinner" />
          <style>{`
            .sh-splash-spinner {
              width: 30px; height: 30px; border-radius: 50%;
              border: 3px solid var(--dash-primary-bg);
              border-top-color: var(--dash-primary);
              animation: shSplashSpin 0.7s linear infinite;
            }
            @keyframes shSplashSpin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      )}
    </>
  )
}
