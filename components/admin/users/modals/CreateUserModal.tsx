"use client"

import { useState }       from "react"
import { useForm }        from "react-hook-form"
import { zodResolver }    from "@hookform/resolvers/zod"
import { z }              from "zod"
import { Eye, EyeOff }   from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Input }          from "@/components/ui/input"
import { Label }          from "@/components/ui/label"
import { Button }         from "@/components/ui/button"
import { Select, SelectItem } from "@/components/ui/select"
import { toast }          from "@/components/ui/use-toast"
import { BANK_NAME }      from "@/lib/brand"

const Schema = z.object({
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  email:     z.string().email(),
  password:  z.string().min(8, "Password must be at least 8 characters"),
  role:      z.enum(["user", "admin"]).default("user"),
  phone:     z.string().optional(),
})

type FormValues = z.infer<typeof Schema>

interface Props {
  open:      boolean
  onClose:   () => void
  onSuccess: (userId: string) => void
}

export function CreateUserModal({ open, onClose, onSuccess }: Props) {
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(Schema),
      defaultValues: { role: "user" },
    })

  const watchedRole = watch("role") ?? "user"

  const onSubmit = async (values: FormValues) => {
    const res = await fetch("/api/admin/users", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      toast({ title: "Failed to create user", description: data.error ?? "Unknown error", variant: "destructive" })
      return
    }

    toast({
      title:       "User created",
      description: `${values.firstName} ${values.lastName} — View profile`,
      variant:     "success",
    })
    reset()
    onSuccess(data.id)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create User</DialogTitle>
          <DialogDescription>Manually create a new {BANK_NAME} account. Fiat and Bitcoin wallets are generated automatically.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cu-fn">First name</Label>
              <Input id="cu-fn" {...register("firstName")} />
              {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-ln">Last name</Label>
              <Input id="cu-ln" {...register("lastName")} />
              {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cu-email">Email</Label>
            <Input id="cu-email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cu-phone">Phone (optional)</Label>
            <Input id="cu-phone" {...register("phone")} placeholder="+1 555 0100" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cu-pw">Password</Label>
            <div className="relative">
              <Input
                id="cu-pw"
                type={showPw ? "text" : "password"}
                className="pr-10"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={watchedRole} onValueChange={(v) => setValue("role", v as "user" | "admin")}>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </Select>
            {watchedRole === "admin" && (
              <p className="text-xs text-amber-600">Admin role grants full portal access.</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { reset(); onClose() }} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating…" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
