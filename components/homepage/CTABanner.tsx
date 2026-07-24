"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { BANK_NAME } from "@/lib/brand"

// Safe Haven Private tokens (design.md)
const INK     = "#17140F"
const BRONZE  = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI_FONT = "var(--sh-font-ui)"
const LABEL   = "text-[11px] uppercase tracking-[0.09em] font-medium"

export function CTABanner() {
  const sectionRef = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }
    
    return () => observer.disconnect()
  }, [])
  
  return (
    <section
      ref={sectionRef}
      className="py-20 lg:py-24"
      style={{ backgroundColor: "var(--sh-linen)", fontFamily: UI_FONT }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div
          className={`relative overflow-hidden text-center px-8 py-16 sm:py-24 transition-all duration-700 ease-out ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
        >
          {/* Backdrop image + flat ink scrim (no gradient) */}
          <Image
            src="/images/stock/skyline.jpg"
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 1280px) 100vw, 1152px"
            className="object-cover"
          />
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(23,20,15,0.66)" }} />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2
              className="text-[2rem] sm:text-[2.75rem] leading-[1.1]"
              style={{ fontFamily: DISPLAY, fontWeight: 300, color: "var(--sh-linen)" }}
            >
              Ready to begin?
            </h2>
            <p className="mt-5 text-[16px] leading-relaxed" style={{ color: "var(--sh-linen-70)" }}>
              Open your {BANK_NAME} account today. It takes only a few minutes.
            </p>
            <div className="mt-9 flex items-center justify-center gap-7">
              <Link
                href="/register"
                className={`${LABEL} inline-flex items-center px-7 py-3.5 transition-colors duration-200`}
                style={{ color: BRONZE, border: `0.5px solid ${BRONZE}`, borderRadius: "2px" }}
              >
                Open an account
              </Link>
              <Link
                href="/contact"
                className="text-[14px] transition-colors duration-200"
                style={{ color: "var(--sh-linen)" }}
              >
                Contact sales →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
