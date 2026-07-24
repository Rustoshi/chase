"use client"

import { useEffect }      from "react"
import { useForm }        from "react-hook-form"
import { zodResolver }    from "@hookform/resolvers/zod"
import { z }              from "zod"
import { Ban, ShieldCheck, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { toast }          from "@/components/ui/use-toast"
import {
  DASH, ModalHeader, Field, TextArea, InfoBox, PrimaryButton, GhostButton, ModalFooter,
} from "./_ui"

const SuspendSchema   = z.object({ reason: z.string().min(1, "Reason is required") })
const UnsuspendSchema = z.object({})

type SuspendValues   = z.infer<typeof SuspendSchema>
type UnsuspendValues = z.infer<typeof UnsuspendSchema>

interface Props {
  open:          boolean
  onClose:       () => void
  onSuccess:     () => void
  userId:        string
  isSuspended:   boolean
  suspendReason?: string
  userName:      string
}

export function SuspendModal({ open, onClose, onSuccess, userId, isSuspended, suspendReason, userName }: Props) {
  const suspendForm = useForm<SuspendValues>({
    resolver: zodResolver(SuspendSchema),
    defaultValues: { reason: "" },
  })

  const unsuspendForm = useForm<UnsuspendValues>({
    resolver: zodResolver(UnsuspendSchema),
  })

  useEffect(() => {
    if (open) {
      suspendForm.reset({ reason: "" })
    }
  }, [open, suspendForm])

  const handleSuspend = async (values: SuspendValues) => {
    const res = await fetch(`/api/admin/users/${userId}/suspend`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: values.reason }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast({ title: "Failed to suspend", description: data.error, variant: "destructive" })
      return
    }
    toast({ title: `${userName} has been suspended`, variant: "success" })
    onSuccess()
    onClose()
  }

  const handleUnsuspend = async () => {
    const res = await fetch(`/api/admin/users/${userId}/unsuspend`, { method: "POST" })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast({ title: "Failed to unsuspend", description: data.error, variant: "destructive" })
      return
    }
    toast({ title: `${userName} has been unsuspended`, variant: "success" })
    onSuccess()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md p-6" style={{ fontFamily: DASH.font }}>
        <DialogTitle className="sr-only">{isSuspended ? "Unsuspend User" : "Suspend User"}</DialogTitle>

        <ModalHeader
          icon={isSuspended ? ShieldCheck : Ban}
          tone={isSuspended ? "success" : "danger"}
          title={isSuspended ? "Unsuspend user" : "Suspend user"}
          description={isSuspended
            ? `Restore access to ${userName}'s account.`
            : `${userName} will no longer be able to log in.`}
        />

        <div style={{ marginTop: 22 }}>
          {isSuspended ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {suspendReason && (
                <InfoBox tone="neutral" title="Current suspension reason">
                  {suspendReason}
                </InfoBox>
              )}
              <p style={{ fontSize: 13.5, color: DASH.textMuted, margin: 0, lineHeight: 1.5 }}>
                Confirming will restore {userName}&apos;s access immediately.
              </p>
              <ModalFooter>
                <GhostButton type="button" onClick={onClose}>Cancel</GhostButton>
                <PrimaryButton
                  tone="success"
                  onClick={handleUnsuspend}
                  disabled={unsuspendForm.formState.isSubmitting}
                >
                  {unsuspendForm.formState.isSubmitting ? "Processing…" : "Unsuspend account"}
                </PrimaryButton>
              </ModalFooter>
            </div>
          ) : (
            <form onSubmit={suspendForm.handleSubmit(handleSuspend)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field
                label="Reason for suspension"
                htmlFor="suspend-reason"
                error={suspendForm.formState.errors.reason?.message}
                required
              >
                <TextArea
                  id="suspend-reason"
                  rows={3}
                  placeholder="Describe why this account is being suspended…"
                  {...suspendForm.register("reason")}
                />
              </Field>

              <InfoBox tone="danger" icon={AlertTriangle}>
                The user will be immediately blocked from logging in. This action is reversible.
              </InfoBox>

              <ModalFooter>
                <GhostButton type="button" onClick={onClose}>Cancel</GhostButton>
                <PrimaryButton
                  tone="danger"
                  type="submit"
                  disabled={suspendForm.formState.isSubmitting}
                >
                  {suspendForm.formState.isSubmitting ? "Suspending…" : "Suspend account"}
                </PrimaryButton>
              </ModalFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
