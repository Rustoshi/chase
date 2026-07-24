"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

type Theme = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = "nova-theme"

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Default to dark - matches server render
  const [theme, setThemeState] = useState<Theme>("dark")
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark")

  // Initialize theme from localStorage (client-side only)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored && stored !== theme) {
      setThemeState(stored)
    }
  }, [])

  // Resolve theme and apply to document
  useEffect(() => {
    const resolved: ResolvedTheme = theme === "system" ? getSystemTheme() : theme
    setResolvedTheme(resolved)
    document.documentElement.setAttribute("data-theme", resolved)

    // Listen for system theme changes when in system mode
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      const handler = (e: MediaQueryListEvent) => {
        const newResolved = e.matches ? "dark" : "light"
        setResolvedTheme(newResolved)
        document.documentElement.setAttribute("data-theme", newResolved)
      }
      mediaQuery.addEventListener("change", handler)
      return () => mediaQuery.removeEventListener("change", handler)
    }
  }, [theme])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark"
    setTheme(newTheme)
  }, [resolvedTheme, setTheme])

  // REMOVED: The `if (!mounted) return null` was blocking SSR completely
  // Now we render immediately with dark theme default, then hydrate

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

// Shared colours hook for the dashboard/app pages.
// Fixed to the Grey light system (dashboard-design.md → --dash-* tokens),
// regardless of OS/theme setting, so every app page is dark-on-light with
// consistent colours (no white-on-white). Values are literals (not var())
// so they resolve identically on server and client.
export function useThemeColors() {
  return {
    // Backgrounds
    bgBase:     "#F5F6F8",  // --dash-bg
    bgElevated: "#FFFFFF",  // --dash-surface
    bgSurface:  "#F9FAFB",  // --dash-surface-2
    bgHover:    "rgba(16,24,40,0.03)",
    bgActive:   "rgba(16,24,40,0.05)",
    bgCard:     "#FFFFFF",
    bgInput:    "#FFFFFF",
    bgOverlay:  "rgba(16,24,40,0.5)",

    // Hero/section backgrounds — flat grey canvas (no dark gradients)
    heroGradient: "#F5F6F8",
    bgHero:       "#F5F6F8",

    // Borders
    border:       "#EAECF0",  // --dash-border
    borderSubtle: "#F2F4F7",
    borderStrong: "#D0D5DD",  // --dash-border-2
    borderBlue:   "rgba(26,44,206,0.20)",

    // Text — dark on light (guarantees contrast)
    textPrimary:   "#101828",  // --dash-text
    textSecondary: "#475467",
    textTertiary:  "#667085",  // --dash-text-2
    textMuted:     "#98A2B3",  // --dash-text-3
    textInverse:   "#FFFFFF",

    // Accents — Grey indigo + money semantics
    blue:    "#1A2CCE",  // --dash-primary
    blueBg:  "#EEF0FE",  // --dash-primary-bg
    green:   "#12B76A",  // --dash-success
    greenBg: "#ECFDF3",
    red:     "#F04438",  // --dash-danger
    redBg:   "#FEF3F2",
    yellow:  "#F79009",  // --dash-warning
    yellowBg:"#FFFAEB",
    amber:   "#F79009",
    amberBg: "#FFFAEB",

    // Soft shadows
    shadow:     "0 1px 3px rgba(16,24,40,0.08), 0 1px 2px rgba(16,24,40,0.04)",
    shadowCard: "0 1px 3px rgba(16,24,40,0.08), 0 1px 2px rgba(16,24,40,0.04)",

    // Utility
    isDark: false,
  }
}
