"use client"

import { useState }   from "react"
import { useRouter }  from "next/navigation"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Input }      from "@/components/ui/input"
import { Label }      from "@/components/ui/label"
import { Button }     from "@/components/ui/button"
import { toast }      from "@/components/ui/use-toast"

interface Props {
  open:      boolean
  onClose:   () => void
  userId:    string
  userEmail: string
  userName:  string
}

export function ConfirmDeleteModal({ open, onClose, userId, userEmail, userName }: Props) {
  const router          = useRouter()
  const [typed, setTyped]       = useState("")
  const [loading, setLoading]   = useState(false)

  const confirmed = typed.trim() === userEmail

  const handleDelete = async () => {
    if (!confirmed) return
    setLoading(true)

    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast({ title: "Delete failed", description: data.error ?? "Unknown error", variant: "destructive" })
      setLoading(false)
      return
    }

    toast({ title: `${userName}'s account has been deleted`, variant: "success" })
    onClose()
    router.push("/admin/users")
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setTyped(""); onClose() } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogDescription>
            This action soft-deletes the account. The user will not be able to log in and their email address will be freed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <strong>Warning:</strong> This action marks the account as deleted. All data is retained for audit purposes.
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="del-confirm">
              Type <span className="font-mono font-semibold">{userEmail}</span> to confirm
            </Label>
            <Input
              id="del-confirm"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={userEmail}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setTyped(""); onClose() }} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={!confirmed || loading}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-40"
          >
            {loading ? "Deleting…" : "Delete account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
