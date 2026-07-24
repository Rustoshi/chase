"use client"

import { useEffect } from "react"

/**
 * Locks document scroll when `isLocked` is true.
 * Uses simple overflow:hidden on <html> to avoid layout shifts.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (isLocked) {
      document.documentElement.style.overflow = "hidden"
    } else {
      document.documentElement.style.overflow = ""
    }
    return () => {
      document.documentElement.style.overflow = ""
    }
  }, [isLocked])
}
