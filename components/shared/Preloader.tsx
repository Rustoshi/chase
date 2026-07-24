"use client"

/* ══════════════════════════════════════════════════════════════════════════
   Reusable inline loader (per dashboard-design.md — Grey style).
   Used as the route-level loading fallback across /app/* so every page shows
   the SAME quiet spinner — no mismatched skeletons, no second "splash".
   Pure CSS animation (no requestAnimationFrame) so it never stalls.
   ══════════════════════════════════════════════════════════════════════════ */

interface PreloaderProps {
  /** Optional caption under the spinner */
  label?: string
  /** Fill the viewport (fixed) instead of the content area */
  fullscreen?: boolean
}

export function Preloader({ label, fullscreen = false }: PreloaderProps) {
  return (
    <div
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 14, fontFamily: "var(--dash-font)",
        ...(fullscreen
          ? { position: "fixed", inset: 0, zIndex: 60, backgroundColor: "var(--dash-bg)" }
          : { minHeight: "60vh", width: "100%" }),
      }}
    >
      <span className="sh-preloader-spinner" />
      {label && <p style={{ fontSize: 13, color: "var(--dash-text-2)", margin: 0 }}>{label}</p>}
      <style>{`
        .sh-preloader-spinner {
          width: 28px; height: 28px; border-radius: 50%;
          border: 3px solid var(--dash-primary-bg);
          border-top-color: var(--dash-primary);
          animation: shPreloaderSpin 0.7s linear infinite;
        }
        @keyframes shPreloaderSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default Preloader
