"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { X, Lock } from "lucide-react"
import { CURRENCIES, CURRENCY_PRESETS, isValidCurrencyCode, getCurrencyName } from "@/lib/utils/currencies"

interface Props {
  value:          string[]
  onChange:       (v: string[]) => void
  defaultCurrency: string
  disabled?:      boolean
}

export function CurrencyTagInput({ value, onChange, defaultCurrency, disabled }: Props) {
  const [input,   setInput]   = useState("")
  const [open,    setOpen]    = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef  = useRef<HTMLDivElement>(null)

  const query    = input.toUpperCase().trim()
  const filtered = CURRENCIES.filter((c) =>
    (c.code.includes(query) || c.name.toUpperCase().includes(query)) &&
    !value.includes(c.code)
  ).slice(0, 12)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function addCode(code: string) {
    const upper = code.toUpperCase()
    if (!isValidCurrencyCode(upper) || value.includes(upper)) return
    onChange([...value, upper])
    setInput("")
    inputRef.current?.focus()
  }

  function removeCode(code: string) {
    if (code === defaultCurrency) return
    onChange(value.filter((c) => c !== code))
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && query) {
      e.preventDefault()
      if (filtered[0]) addCode(filtered[0].code)
      else if (isValidCurrencyCode(query)) addCode(query)
    }
    if (e.key === "Backspace" && !input) {
      const last = value[value.length - 1]
      if (last && last !== defaultCurrency) removeCode(last)
    }
    if (e.key === "Escape") setOpen(false)
    if (e.key === "ArrowDown" && filtered[0]) {
      e.preventDefault()
      setOpen(true)
    }
  }

  function applyPreset(codes: string[]) {
    const merged = Array.from(new Set([...value, ...codes]))
    onChange(merged)
  }

  return (
    <div className="space-y-2">
      {/* Preset buttons */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-gray-500 self-center">Add preset:</span>
        {Object.entries(CURRENCY_PRESETS).map(([label, codes]) => (
          <button
            key={label}
            type="button"
            disabled={disabled}
            onClick={() => applyPreset(codes)}
            className="text-xs px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 capitalize transition-colors disabled:opacity-40"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tag field */}
      <div ref={wrapRef} className="relative">
        <div
          className={[
            "min-h-[42px] flex flex-wrap gap-1.5 items-center border rounded-lg px-2 py-1.5 cursor-text transition-colors",
            disabled ? "bg-gray-50 opacity-60" : "bg-white",
            focused ? "border-[#1A2CCE] ring-1 ring-[#1A2CCE]" : "border-gray-300",
          ].join(" ")}
          onClick={() => { if (!disabled) { inputRef.current?.focus(); setOpen(true) } }}
        >
          {value.map((code) => {
            const isDefault = code === defaultCurrency
            return (
              <span
                key={code}
                className={[
                  "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium select-none",
                  isDefault
                    ? "bg-[#1A2CCE] text-white"
                    : "bg-gray-100 text-gray-700",
                ].join(" ")}
                title={getCurrencyName(code)}
              >
                {code}
                {isDefault ? (
                  <Lock className="w-2.5 h-2.5 opacity-70" />
                ) : (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={(e) => { e.stopPropagation(); removeCode(code) }}
                    className="opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </span>
            )
          })}

          <input
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); setOpen(true) }}
            onFocus={() => { setFocused(true); setOpen(true) }}
            onKeyDown={handleKey}
            disabled={disabled}
            placeholder={value.length === 0 ? "Type a currency code…" : ""}
            className="flex-1 min-w-[100px] text-sm outline-none bg-transparent placeholder:text-gray-400"
          />
        </div>

        {/* Dropdown */}
        {open && !disabled && filtered.length > 0 && (
          <div className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-52 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); addCode(c.code) }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{c.code}</span>
                <span className="text-gray-500 text-xs">{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        {value.length} currencies selected · Default currency ({defaultCurrency}) is locked
      </p>
    </div>
  )
}
