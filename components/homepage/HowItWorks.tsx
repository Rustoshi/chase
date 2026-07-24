"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { UserPlus, ShieldCheck, Wallet, ArrowRightLeft } from "lucide-react"

const INK     = "#17140F"
const BRONZE  = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI_FONT = "var(--sh-font-ui)"
const LABEL   = "text-[11px] uppercase tracking-[0.09em] font-medium"

const STEPS = [
  {
    step: 1,
    icon: UserPlus,
    title: "Create Account",
    description: "Sign up in minutes with just your email and phone number.",
  },
  {
    step: 2,
    icon: ShieldCheck,
    title: "Verify Identity",
    description: "Complete KYC with a quick document upload.",
  },
  {
    step: 3,
    icon: Wallet,
    title: "Fund Account",
    description: "Add money via transfer, card, or direct deposit.",
  },
  {
    step: 4,
    icon: ArrowRightLeft,
    title: "Start Banking",
    description: "Send, receive, and manage your money instantly.",
  },
]

export function HowItWorks() {
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
      { threshold: 0.2 }
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
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: header + framed image */}
          <div
            className={`transition-all duration-700 ease-out ${
              inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <div className="flex items-center gap-3">
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
              <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>How it works</span>
            </div>
            <h2
              className="mt-5 text-[1.75rem] sm:text-[2rem] leading-[1.15]"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            >
              Open an account in four steps
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed max-w-md" style={{ color: "var(--sh-ink-80, #17140FCC)" }}>
              It takes only a few minutes. No paperwork, no branch visits.
            </p>
            <div
              className="mt-8 relative overflow-hidden aspect-[4/3]"
              style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
            >
              <Image
                src="/images/stock/banking-home.jpg"
                alt="Opening a Safe Haven account from home"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>

          {/* Right: vertical numbered steps */}
          <div className="relative">
            {/* vertical connector hairline */}
            <div
              className="absolute top-3 bottom-3"
              style={{ left: "15px", width: "0.5px", backgroundColor: "var(--sh-ink-20)" }}
            />
            <div className="space-y-8">
              {STEPS.map((item, index) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.step}
                    className={`relative flex gap-5 transition-all duration-500 ease-out ${
                      inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                    }`}
                    style={{ transitionDelay: inView ? `${150 + index * 150}ms` : "0ms" }}
                  >
                    <div className="relative flex-shrink-0 w-[30px] flex justify-center">
                      <span
                        style={{
                          fontFamily: DISPLAY,
                          fontWeight: 300,
                          fontSize: "1.5rem",
                          lineHeight: 1,
                          color: INK,
                          backgroundColor: "var(--sh-linen)",
                          padding: "4px 0",
                        }}
                      >
                        {String(item.step).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="pt-0.5">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" strokeWidth={1.25} style={{ color: BRONZE }} />
                        <h3 className="text-[17px]" style={{ fontWeight: 500, color: INK }}>
                          {item.title}
                        </h3>
                      </div>
                      <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: "var(--sh-ink-50)" }}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
