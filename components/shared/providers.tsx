"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster }         from "@/components/ui/toaster"
import { ThemeProvider }   from "@/components/shared/ThemeProvider"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </SessionProvider>
  )
}
