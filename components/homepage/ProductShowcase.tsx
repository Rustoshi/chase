"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Bell, Fingerprint, BarChart3, Zap } from "lucide-react"

const INK     = "#17140F"
const BRONZE  = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI_FONT = "var(--sh-font-ui)"
const LABEL   = "text-[11px] uppercase tracking-[0.09em] font-medium"

const APP_FEATURES = [
  {
    icon: Bell,
    title: "Instant Notifications",
    description: "Get alerts for every transaction, login, and account activity in real time.",
  },
  {
    icon: Fingerprint,
    title: "Biometric Security",
    description: "Log in securely with Face ID, fingerprint, or your preferred method.",
  },
  {
    icon: BarChart3,
    title: "Spending Insights",
    description: "Track your spending patterns and see where your money goes each month.",
  },
  {
    icon: Zap,
    title: "Quick Transfers",
    description: "Send money to anyone in seconds. Schedule payments and set up recurring transfers.",
  },
]

export function ProductShowcase() {
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
      className="py-20 lg:py-24 overflow-hidden"
      style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI_FONT }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Framed image */}
          <div
            className={`order-2 lg:order-1 relative overflow-hidden aspect-[16/10] lg:aspect-[4/5] transition-all duration-700 ease-out ${
              inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
            style={{ borderRadius: "8px", border: "0.5px solid var(--sh-ink-20)" }}
          >
            <Image
              src="/images/stock/mobile-banking.jpg"
              alt="Managing an account and card from a phone"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          {/* Content */}
          <div
            className={`order-1 lg:order-2 transition-all duration-700 ease-out delay-150 ${
              inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            <div className="flex items-center gap-3">
              <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
              <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>On every device</span>
            </div>
            <h2
              className="mt-5 text-[1.75rem] sm:text-[2rem] leading-[1.15]"
              style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
            >
              Banking at your fingertips
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed max-w-lg" style={{ color: "var(--sh-ink-80, #17140FCC)" }}>
              Manage your accounts, make payments, and stay on top of your finances from anywhere.
            </p>

            {/* Features — line icons, no tiles */}
            <div className="mt-10 space-y-6">
              {APP_FEATURES.map((feature) => {
                const Icon = feature.icon
                return (
                  <div key={feature.title} className="flex gap-4">
                    <Icon className="flex-shrink-0 h-5 w-5 mt-0.5" strokeWidth={1.25} style={{ color: BRONZE }} />
                    <div>
                      <h3 className="text-[16px]" style={{ fontWeight: 500, color: INK }}>{feature.title}</h3>
                      <p className="mt-1 text-[14px] leading-relaxed" style={{ color: "var(--sh-ink-50)" }}>{feature.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* CTA */}
            <div className="mt-10">
              <Link
                href="/register"
                className={`${LABEL} inline-flex items-center px-7 py-3.5 transition-colors duration-200`}
                style={{ color: "var(--sh-bronze-dark)", border: `0.5px solid ${BRONZE}`, borderRadius: "2px" }}
              >
                Open an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
