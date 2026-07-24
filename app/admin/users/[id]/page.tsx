import type { Metadata }      from "next"
import { auth }               from "@/lib/auth"
import { redirect }           from "next/navigation"
import { getUserById }        from "@/lib/services/user.service"
import { UserProfileClient }  from "@/components/admin/users/UserProfileClient"

export const revalidate = 0

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const user   = await getUserById(id).catch(() => null)
  return { title: user ? `${user.firstName} ${user.lastName}` : "User Not Found" }
}

export default async function UserDetailPage({ params }: Props) {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login")

  const { id } = await params
  const user   = await getUserById(id).catch(() => null)

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <p className="text-6xl font-bold text-slate-200">404</p>
        <p className="mt-3 text-lg font-medium text-slate-600">User not found</p>
        <a
          href="/admin/users"
          className="mt-6 rounded-lg bg-[#1A2CCE] px-5 py-2 text-sm font-medium text-white hover:bg-[#1A2CCE]/90"
        >
          Back to users
        </a>
      </div>
    )
  }

  return <UserProfileClient user={user} />
}
