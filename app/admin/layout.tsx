import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AdminShell } from "@/components/admin/AdminShell"

// Admin routes that render without the shell (no auth required).
// Middleware already blocks the underlying routes from unauthorised access;
// this list prevents the layout from trying to auth-guard its own login page
// which would cause an infinite redirect loop.
const PUBLIC_ADMIN_PATHS = ["/admin/login"]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const pathname    = headersList.get("x-pathname") ?? ""

  // Public admin pages — render children bare (no shell, no auth check)
  if (PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    return <>{children}</>
  }

  const session = await auth()

  if (!session?.user || session.user.role !== "admin") {
    redirect("/admin/login")
  }

  return <AdminShell session={session!}>{children}</AdminShell>
}
