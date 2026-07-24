"use client"

import { CreateMethodModal } from "./CreateMethodModal"

interface Props {
  open:        boolean
  onOpenChange:(v: boolean) => void
  onSuccess:   (method: Record<string, unknown>) => void
  method:      Record<string, unknown> | null
}

export function EditMethodModal({ open, onOpenChange, onSuccess, method }: Props) {
  return (
    <CreateMethodModal
      open={open}
      onOpenChange={onOpenChange}
      onSuccess={onSuccess}
      existing={method}
    />
  )
}
