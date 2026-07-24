import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { BANK_NAME } from "@/lib/brand"
import { AdminLoginForm } from "./_components/AdminLoginForm"

export const metadata: Metadata = {
  title: `${BANK_NAME} Admin — Sign In`,
}

export default async function AdminLoginPage() {
  // Bounce already-authenticated admins straight to the dashboard
  const session = await auth()
  if (session?.user?.role === "admin") {
    redirect("/admin/dashboard")
  }

  return <AdminLoginForm />
}
