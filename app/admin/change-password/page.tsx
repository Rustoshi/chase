import type { Metadata }       from "next"
import { auth }                 from "@/lib/auth"
import { redirect }             from "next/navigation"
import { ChangePasswordClient } from "@/components/admin/settings/ChangePasswordClient"

export const metadata: Metadata = { title: "Change Password" }
export const dynamic = "force-dynamic"

export default async function ChangePasswordPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login")

  return (
    <div className="px-6 py-8 max-w-screen-xl mx-auto">
      <ChangePasswordClient />
    </div>
  )
}
