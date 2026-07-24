"use client"

import * as RadixCheckbox from "@radix-ui/react-checkbox"
import { Check }          from "lucide-react"
import { cn }             from "@/lib/utils"

interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof RadixCheckbox.Root> {
  label?: string
}

export function Checkbox({ className, label, id, ...props }: CheckboxProps) {
  return (
    <div className="flex items-center gap-2">
      <RadixCheckbox.Root
        id={id}
        className={cn(
          "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border border-slate-300 bg-white",
          "hover:border-[#0F4C81] focus:outline-none focus:ring-2 focus:ring-[#0F4C81]/20",
          "data-[state=checked]:border-[#0F4C81] data-[state=checked]:bg-[#0F4C81]",
          className
        )}
        {...props}
      >
        <RadixCheckbox.Indicator>
          <Check className="h-3 w-3 text-white" />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label && (
        <label htmlFor={id} className="cursor-pointer text-sm text-slate-700">
          {label}
        </label>
      )}
    </div>
  )
}
