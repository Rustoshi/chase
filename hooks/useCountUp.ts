"use client"

import { useState, useEffect, useRef } from "react"

export function useCountUp(target: number, duration: number = 800): number {
  const [value, setValue] = useState(0)
  const prevTarget = useRef(0)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const start = prevTarget.current
    const diff = target - start
    if (diff === 0) return

    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(start + diff * eased)

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      } else {
        prevTarget.current = target
        setValue(target)
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [target, duration])

  return value
}
