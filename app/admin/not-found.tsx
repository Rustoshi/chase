import Link from "next/link"
import { LayoutDashboard } from "lucide-react"

export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-7xl font-bold tracking-tight text-slate-100">404</p>

      <div className="mt-1">
        <h1 className="text-xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          The admin page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>

      <Link
        href="/admin/dashboard"
        className="mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
        style={{ backgroundColor: "#1A2CCE" }}
      >
        <LayoutDashboard className="h-4 w-4" />
        Back to Dashboard
      </Link>
    </div>
  )
}
