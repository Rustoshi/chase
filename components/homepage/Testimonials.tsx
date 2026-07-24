"use client"

import { useEffect, useRef, useState } from "react"

const INK     = "#17140F"
const BRONZE  = "#A67C3D"
const DISPLAY = "var(--sh-font-display)"
const UI_FONT = "var(--sh-font-ui)"
const LABEL   = "text-[11px] uppercase tracking-[0.09em] font-medium"

const TESTIMONIALS = [
  {
    name: "Sarah Mitchell",
    role: "Small Business Owner",
    initials: "SM",
    quote: "Managing my business finances has never been easier. The alerts keep me on top of every transaction.",
  },
  {
    name: "David Chen",
    role: "Freelance Designer",
    initials: "DC",
    quote: "I switched from my traditional bank and haven't looked back. Everything is considered, and transfers are quick.",
  },
  {
    name: "Emily Rodriguez",
    role: "Marketing Manager",
    initials: "ER",
    quote: "The statements are the clearest I've had. It's the best banking decision I've made.",
  },
]

export function Testimonials() {
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
      style={{ backgroundColor: "var(--sh-surface)", fontFamily: UI_FONT }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div
          className={`max-w-2xl mx-auto text-center mb-16 transition-all duration-500 ease-out ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="flex items-center justify-center gap-3">
            <span aria-hidden style={{ width: 28, height: "1.5px", backgroundColor: BRONZE }} />
            <span className={LABEL} style={{ color: "var(--sh-ink-50)" }}>In their words</span>
          </div>
          <h2
            className="mt-5 text-[1.75rem] sm:text-[2rem] leading-[1.15]"
            style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
          >
            What our clients say
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {TESTIMONIALS.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className={`p-8 transition-all duration-500 ease-out ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{
                backgroundColor: "var(--sh-surface)",
                border: "0.5px solid var(--sh-ink-10)",
                borderRadius: "8px",
                transitionDelay: inView ? `${150 + index * 100}ms` : "0ms",
              }}
            >
              {/* Serif pull-quote */}
              <p
                className="text-[19px] leading-[1.55]"
                style={{ fontFamily: DISPLAY, fontWeight: 400, color: INK }}
              >
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Attribution */}
              <div className="mt-7 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ border: "0.5px solid var(--sh-ink-20)" }}
                >
                  <span className="text-[12px]" style={{ fontWeight: 500, color: INK }}>
                    {testimonial.initials}
                  </span>
                </div>
                <div>
                  <p className="text-[14px]" style={{ fontWeight: 500, color: INK }}>{testimonial.name}</p>
                  <p className="text-[12px]" style={{ color: "var(--sh-ink-50)" }}>{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
