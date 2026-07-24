"use client"

import * as RadixTabs from "@radix-ui/react-tabs"
import { cn }         from "@/lib/utils"

export const Tabs      = RadixTabs.Root
export const TabsContent = RadixTabs.Content

export function TabsList({ className, ...props }: React.ComponentPropsWithoutRef<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      className={cn(
        "inline-flex items-center gap-0 border-b border-slate-200",
        className
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: React.ComponentPropsWithoutRef<typeof RadixTabs.Trigger>) {
  return (
    <RadixTabs.Trigger
      className={cn(
        "relative px-4 pb-3 pt-0 text-sm font-medium text-slate-500",
        "transition-colors hover:text-slate-700",
        "data-[state=active]:text-[#0F4C81]",
        "data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:-bottom-px data-[state=active]:after:h-0.5 data-[state=active]:after:bg-[#0F4C81]",
        className
      )}
      {...props}
    />
  )
}
