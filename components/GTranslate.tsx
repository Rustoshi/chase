"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    gtranslateSettings?: {
      default_language: string
      languages: string[]
      wrapper_selector: string
      flag_size: number
      alt_flags?: Record<string, string>
    }
  }
}

/**
 * GTranslate language switcher widget.
 * Supports major world languages.
 */
export function GTranslate() {
  useEffect(() => {
    if (typeof window === "undefined") return

    // Prevent double initialization
    if (window.gtranslateSettings) return

    window.gtranslateSettings = {
      default_language: "en",
      languages: [
        "en",  // English
        "es",  // Spanish
        "fr",  // French
        "de",  // German
        "it",  // Italian
        "pt",  // Portuguese
        "nl",  // Dutch
        "ru",  // Russian
        "zh-CN", // Chinese (Simplified)
        "zh-TW", // Chinese (Traditional)
        "ja",  // Japanese
        "ko",  // Korean
        "ar",  // Arabic
        "hi",  // Hindi
        "tr",  // Turkish
        "pl",  // Polish
        "vi",  // Vietnamese
        "th",  // Thai
        "id",  // Indonesian
        "sv",  // Swedish
        "da",  // Danish
        "no",  // Norwegian
        "fi",  // Finnish
        "el",  // Greek
        "he",  // Hebrew
        "cs",  // Czech
        "ro",  // Romanian
        "hu",  // Hungarian
        "uk",  // Ukrainian
      ],
      wrapper_selector: ".gtranslate_wrapper",
      flag_size: 24,
    }

    const script = document.createElement("script")
    script.src = "https://cdn.gtranslate.net/widgets/latest/dropdown.js"
    script.defer = true
    document.body.appendChild(script)

    return () => {
      // Cleanup on unmount
      const existingScript = document.querySelector('script[src*="gtranslate.net"]')
      if (existingScript) existingScript.remove()
    }
  }, [])

  return (
    <>
      <style jsx global>{`
        .gtranslate_wrapper select {
          color: #1f2937 !important;
          background-color: white !important;
        }
        .gtranslate_wrapper select option {
          color: #1f2937 !important;
          background-color: white !important;
        }
      `}</style>
      <div 
        className="gtranslate_wrapper fixed bottom-4 left-4 z-50"
        style={{ 
          background: "rgba(255, 255, 255, 0.95)",
          borderRadius: "8px",
          padding: "4px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        }}
      />
    </>
  )
}
