"use client"

import * as RadixSelect from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"
import { cn }                 from "@/lib/utils"

export const SelectGroup = RadixSelect.Group
export const SelectValue = RadixSelect.Value

interface SelectProps {
  value?:       string
  onValueChange?: (value: string) => void
  placeholder?: string
  children:     React.ReactNode
  className?:   string
  disabled?:    boolean
}

export function Select({ value, onValueChange, placeholder, children, className, disabled }: SelectProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RadixSelect.Trigger
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2",
          "text-sm text-slate-700 shadow-sm placeholder:text-slate-400",
          "hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20 focus:border-[#0F4C81]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          className="z-50 min-w-[8rem] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          position="popper"
          sideOffset={4}
        >
          <RadixSelect.Viewport className="p-1">
            {children}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
}

interface SelectItemProps extends React.ComponentPropsWithoutRef<typeof RadixSelect.Item> {
  children: React.ReactNode
}

export function SelectItem({ children, className, ...props }: SelectItemProps) {
  return (
    <RadixSelect.Item
      className={cn(
        "relative flex cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-3 text-sm text-slate-700",
        "hover:bg-slate-50 focus:bg-slate-50 focus:outline-none",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <RadixSelect.ItemIndicator>
          <Check className="h-4 w-4 text-[#0F4C81]" />
        </RadixSelect.ItemIndicator>
      </span>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  )
}
