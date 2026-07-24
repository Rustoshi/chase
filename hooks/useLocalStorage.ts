"use client"

import { useState, useEffect, useCallback } from "react"

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(defaultValue)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item !== null) {
        setStoredValue(JSON.parse(item))
      }
    } catch {
      // Corrupt or unreadable — use default
    }
  }, [key])

  const setValue = useCallback(
    (value: T) => {
      setStoredValue(value)
      try {
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch {
        // Storage full or blocked
      }
    },
    [key]
  )

  return [storedValue, setValue]
}
