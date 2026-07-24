import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Providers } from "@/components/shared/providers"
import { BANK_NAME } from "@/lib/brand"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: {
    default:  BANK_NAME,
    template: `%s | ${BANK_NAME}`,
  },
  description: "Modern neobank — send, receive, and manage money instantly.",
  manifest:    "/manifest.json",
  appleWebApp: {
    capable:        true,
    statusBarStyle: "default",
    title:          BANK_NAME,
  },
}

export const viewport: Viewport = {
  themeColor:   "#0F4C81",
  width:        "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
