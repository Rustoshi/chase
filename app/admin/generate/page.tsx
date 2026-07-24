import type { Metadata } from "next"
import { auth }          from "@/lib/auth"
import { redirect }      from "next/navigation"
import { GeneratorClient } from "@/components/admin/generator/GeneratorClient"

export const metadata: Metadata = { title: "History Generator" }
export const dynamic = "force-dynamic"

export default async function GeneratePage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "admin") redirect("/admin/login")

  return (
    <div className="px-6 py-8 max-w-screen-xl mx-auto">
      <GeneratorClient />
    </div>
  )
}
