"use client"

import { useState }       from "react"
import { useForm }        from "react-hook-form"
import { zodResolver }    from "@hookform/resolvers/zod"
import { z }              from "zod"
import { Eye, EyeOff, KeyRound } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { toast }          from "@/components/ui/use-toast"
import {
  DASH, ModalHeader, Field, TextInput, PrimaryButton, GhostButton, ModalFooter,
} from "./_ui"

const Schema = z
  .object({
    newPassword:     z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path:    ["confirmPassword"],
  })

type FormValues = z.infer<typeof Schema>

interface Props {
  open:      boolean
  onClose:   () => void
  userId:    string
  userName:  string
}

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8)  score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { score, label: "Weak",   color: DASH.danger }
  if (score <= 3) return { score, label: "Fair",   color: DASH.warning }
  return               { score, label: "Strong", color: DASH.success }
}

function RevealButton({ shown, onClick }: { shown: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={-1}
      style={{
        position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
        display: "flex", background: "none", border: "none", cursor: "pointer",
        color: DASH.textMuted, padding: 0,
      }}
    >
      {shown ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  )
}

export function ResetPasswordModal({ open, onClose, userId, userName }: Props) {
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({ resolver: zodResolver(Schema) })

  const pw       = watch("newPassword") ?? ""
  const strength = getStrength(pw)

  const onSubmit = async (values: FormValues) => {
    const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: values.newPassword }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast({ title: "Reset failed", description: data.error ?? "Unknown error", variant: "destructive" })
      return
    }

    toast({ title: "Password reset successfully", variant: "success" })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="max-w-md p-6" style={{ fontFamily: DASH.font }}>
        <DialogTitle className="sr-only">Reset Password</DialogTitle>

        <ModalHeader
          icon={KeyRound}
          tone="primary"
          title="Reset password"
          description={`Set a new password for ${userName}. They will use it on next login.`}
        />

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 22 }}>
          <Field label="New password" htmlFor="rp-new" error={errors.newPassword?.message}>
            <div style={{ position: "relative" }}>
              <TextInput
                id="rp-new"
                type={showNew ? "text" : "password"}
                style={{ paddingRight: 40 }}
                {...register("newPassword")}
              />
              <RevealButton shown={showNew} onClick={() => setShowNew((s) => !s)} />
            </div>

            {pw.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
                <div style={{ display: "flex", gap: 4, height: 6 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1, borderRadius: 999,
                        backgroundColor: i < strength.score ? strength.color : DASH.border,
                        transition: "background-color .2s",
                      }}
                    />
                  ))}
                </div>
                <p style={{ fontSize: 12, color: strength.color, fontWeight: 500, margin: 0 }}>{strength.label}</p>
              </div>
            )}
          </Field>

          <Field label="Confirm password" htmlFor="rp-confirm" error={errors.confirmPassword?.message}>
            <div style={{ position: "relative" }}>
              <TextInput
                id="rp-confirm"
                type={showConfirm ? "text" : "password"}
                style={{ paddingRight: 40 }}
                {...register("confirmPassword")}
              />
              <RevealButton shown={showConfirm} onClick={() => setShowConfirm((s) => !s)} />
            </div>
          </Field>

          <ModalFooter>
            <GhostButton type="button" onClick={() => { reset(); onClose() }} disabled={isSubmitting}>
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Resetting…" : "Reset password"}
            </PrimaryButton>
          </ModalFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
