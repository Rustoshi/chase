"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { RefreshCw }                                 from "lucide-react"
import { cn }                                        from "@/lib/utils"

const AUTO_REFRESH_INTERVAL = 60 // seconds

interface Props {
  onRefresh: () => void
}

export function DashboardRefresher({ onRefresh }: Props) {
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [spinning,   setSpinning]   = useState(false)
  const lastRefresh                 = useRef<number>(Date.now())

  // Auto-refresh timer
  useEffect(() => {
    const tick = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastRefresh.current) / 1000)
      setSecondsAgo(elapsed)
      if (elapsed >= AUTO_REFRESH_INTERVAL) {
        triggerRefresh()
      }
    }, 1000)
    return () => clearInterval(tick)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const triggerRefresh = useCallback(() => {
    setSpinning(true)
    lastRefresh.current = Date.now()
    setSecondsAgo(0)
    onRefresh()
    setTimeout(() => setSpinning(false), 600)
  }, [onRefresh])

  const label =
    secondsAgo < 5
      ? "Just now"
      : secondsAgo < 60
        ? `${secondsAgo}s ago`
        : `${Math.floor(secondsAgo / 60)}m ago`

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 12, color: "var(--admin-text-muted)" }}>Updated {label}</span>
      <button
        onClick={triggerRefresh}
        className="admin-btn admin-btn-secondary admin-btn-sm"
      >
        <RefreshCw 
          size={14} 
          style={{ 
            animation: spinning ? "spin 0.6s linear infinite" : "none" 
          }} 
        />
        Refresh
      </button>
    </div>
  )
}
