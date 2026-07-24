import { cn } from "@/lib/utils"

export type AvatarSize = "sm" | "md" | "lg"

interface UserAvatarProps {
  firstName: string
  lastName:  string
  size?:     AvatarSize
  className?: string
  avatarUrl?: string | null
}

// 8 deterministic background colours — picked by name hash
const PALETTE = [
  "#1A2CCE", // brand indigo
  "#00887A", // teal
  "#7C3AED", // violet
  "#B45309", // amber
  "#065F46", // emerald dark
  "#9D174D", // pink
  "#1D4ED8", // indigo
  "#F04438", // red
]

function hashName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0
  }
  return h
}

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-sm",
  lg: "h-20 w-20 text-2xl",
}

export function UserAvatar({ firstName, lastName, size = "md", className, avatarUrl }: UserAvatarProps) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
  const color    = PALETTE[hashName(`${firstName}${lastName}`) % PALETTE.length]

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={`${firstName} ${lastName}`}
        className={cn(
          "inline-block flex-shrink-0 rounded-full object-cover",
          SIZE_CLASSES[size],
          className
        )}
      />
    )
  }

  return (
    <span
      className={cn(
        "inline-flex flex-shrink-0 items-center justify-center rounded-full font-semibold text-white",
        SIZE_CLASSES[size],
        className
      )}
      style={{ backgroundColor: color }}
      aria-label={`${firstName} ${lastName}`}
    >
      {initials}
    </span>
  )
}
