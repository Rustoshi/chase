"use client"

import { ChevronDown } from "lucide-react"

export function ScrollButton() {
  return (
    <button
      onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
      className="flex flex-col items-center gap-2 text-white/30 hover:text-white/60 transition-colors cursor-pointer group"
    >
      <span className="text-xs font-medium tracking-widest uppercase">Explore</span>
      <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform hero-bounce" />
    </button>
  )
}
