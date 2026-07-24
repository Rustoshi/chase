"use client"

import { useRef, useEffect, useCallback } from "react"

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd:   (e: React.TouchEvent) => void
}

export function useSwipeGesture(
  onSwipeLeft:  () => void,
  onSwipeRight: () => void,
  threshold: number = 50
): SwipeHandlers {
  const startX = useRef(0)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
  }, [])

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const diff = startX.current - e.changedTouches[0].clientX
      if (Math.abs(diff) >= threshold) {
        if (diff > 0) onSwipeLeft()
        else onSwipeRight()
      }
    },
    [onSwipeLeft, onSwipeRight, threshold]
  )

  // Keyboard support for accessibility
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onSwipeRight()
      if (e.key === "ArrowRight") onSwipeLeft()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onSwipeLeft, onSwipeRight])

  return { onTouchStart, onTouchEnd }
}
