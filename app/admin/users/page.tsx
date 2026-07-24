import type { Metadata }    from "next"
import { auth }             from "@/lib/auth"
import { redirect }         from "next/navigation"
import { getUsers }         from "@/lib/services/user.service"
import { UsersListClient }  from "@/components/admin/users/UsersListClient"

export const metadata: Metadata = { title: "Users" }
export const revalidate = 0

export default async function UsersPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login")

  const initial = await getUsers({ page: 1, limit: 20 }).catch(() => ({
    users: [], total: 0, pages: 0,
  }))

  return <UsersListClient initialData={initial} />
}
