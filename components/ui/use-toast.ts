"use client"

import { useState, useEffect } from "react"

export type ToastVariant = "default" | "success" | "destructive"

export interface Toast {
  id:           string
  title?:       string
  description?: string
  variant?:     ToastVariant
}

// Module-level state — survives re-renders, works across component tree
let _listeners: Array<(toasts: Toast[]) => void> = []
let _toasts:    Toast[] = []

function _notify(toasts: Toast[]) {
  _toasts = toasts
  _listeners.forEach((fn) => fn(toasts))
}

function _dismiss(id: string) {
  _notify(_toasts.filter((t) => t.id !== id))
}

export function toast(props: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2, 11)
  _notify([..._toasts, { id, ...props }])
  setTimeout(() => _dismiss(id), props.variant === "destructive" ? 6000 : 4000)
  return { id, dismiss: () => _dismiss(id) }
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(_toasts)

  useEffect(() => {
    _listeners.push(setToasts)
    setToasts(_toasts)
    return () => {
      _listeners = _listeners.filter((fn) => fn !== setToasts)
    }
  }, [])

  return { toasts, toast, dismiss: _dismiss }
}
