"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, Menu } from "lucide-react"
import { useSidebar } from "./UserAppShell"
import { useThemeColors } from "@/components/shared/ThemeProvider"

interface UserHeaderProps {
  title:         string
  showBack?:     boolean
  onBack?:       () => void
  rightElement?: React.ReactNode
}

export function UserHeader({ title, showBack, onBack, rightElement }: UserHeaderProps) {
  const router = useRouter()
  const { open: openSidebar } = useSidebar()
  const colors = useThemeColors()

  return (
    <header
      className="sticky top-0 z-30 flex items-center h-14 px-4 lg:h-16 lg:px-6"
      style={{
        background: colors.bgBase,
        borderBottom: `1px solid ${colors.border}`,
        transition: "background-color 200ms, border-color 200ms",
      }}
    >
      <div className="flex w-10 items-center">
        {showBack ? (
          <button
            onClick={() => onBack ? onBack() : router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors active:scale-95"
            style={{ color: colors.textTertiary }}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={openSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors active:scale-95 lg:hidden"
            style={{ color: colors.textTertiary }}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>

      <h1 className="flex-1 text-center text-base font-semibold lg:text-left lg:text-lg" style={{ color: colors.textPrimary }}>
        {title}
      </h1>

      <div className="flex w-10 items-center justify-end">
        {rightElement}
      </div>
    </header>
  )
}
