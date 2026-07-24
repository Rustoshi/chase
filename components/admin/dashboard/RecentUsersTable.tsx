"use client"

import { formatDistanceToNow } from "date-fns"
import { DataTable }          from "@/components/admin/DataTable"
import { StatusBadge }        from "@/components/admin/StatusBadge"
import type { RecentUser }    from "@/lib/services/dashboard.service"

function Avatar({ firstName, lastName }: { firstName: string; lastName: string }) {
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
  return (
    <span
      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold text-white"
      style={{ backgroundColor: "#1A2CCE" }}
    >
      {initials}
    </span>
  )
}

interface Props {
  initialData: RecentUser[]
}

export function RecentUsersTable({ initialData }: Props) {
  const columns = [
    {
      key:    "name",
      label:  "User",
      render: (r: RecentUser) => (
        <div className="flex items-center gap-2.5">
          <Avatar firstName={r.firstName} lastName={r.lastName} />
          <div>
            <p className="text-sm font-medium text-slate-800">
              {r.firstName} {r.lastName}
            </p>
            <p className="text-xs text-slate-400">{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      key:    "kycStatus",
      label:  "KYC",
      render: (r: RecentUser) => <StatusBadge status={r.kycStatus} />,
    },
    {
      key:    "isActive",
      label:  "Status",
      render: (r: RecentUser) => (
        <StatusBadge status={r.isActive ? "active" : "inactive"} />
      ),
    },
    {
      key:    "createdAt",
      label:  "Joined",
      render: (r: RecentUser) => (
        <span className="text-xs text-slate-400">
          {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
        </span>
      ),
    },
  ]

  const rows = initialData as unknown as Record<string, unknown>[]

  return (
    <DataTable
      columns={columns as unknown as Parameters<typeof DataTable>[0]["columns"]}
      data={rows}
      emptyMessage="No users yet."
    />
  )
}
