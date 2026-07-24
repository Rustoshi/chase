"use client"

import * as RadixToast from "@radix-ui/react-toast"
import { useToast }    from "./use-toast"
import { ToastItem }   from "./toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <RadixToast.Provider swipeDirection="right">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onDismiss={dismiss} />
      ))}
      <RadixToast.Viewport className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 outline-none" />
    </RadixToast.Provider>
  )
}
