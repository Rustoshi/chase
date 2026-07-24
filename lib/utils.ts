import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/** Merge Tailwind classes without style conflicts — required by shadcn/ui. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
