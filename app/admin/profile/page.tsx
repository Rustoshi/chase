import type { Metadata } from "next"
import { auth }          from "@/lib/auth"
import { redirect }      from "next/navigation"
import { ProfileClient } from "@/components/admin/settings/ProfileClient"

export const metadata: Metadata = { title: "My Profile" }
export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login")

  return (
    <div className="px-6 py-8 max-w-screen-xl mx-auto">
      <ProfileClient user={session.user} />
    </div>
  )
}
