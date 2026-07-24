"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter, useSearchParams, usePathname }   from "next/navigation"
import Link                         from "next/link"
import { format }                   from "date-fns"
import {
  MoreHorizontal, Plus, Search, ChevronLeft, ChevronRight,
} from "lucide-react"
import { DataTable }                from "@/components/admin/DataTable"
import { PageHeader }               from "@/components/admin/PageHeader"
import { StatusBadge }              from "@/components/admin/StatusBadge"
import { UserAvatar }               from "./UserAvatar"
import { EditUserModal }            from "./modals/EditUserModal"
import { TransactionModal }         from "./modals/TransactionModal"
import { ResetPasswordModal }       from "./modals/ResetPasswordModal"
import { SuspendModal }             from "./modals/SuspendModal"
import { ConfirmDeleteModal }       from "./modals/ConfirmDeleteModal"
import { CreateUserModal }          from "./modals/CreateUserModal"
import { Input }                    from "@/components/ui/input"
import { Button }                   from "@/components/ui/button"
import { Select, SelectItem }       from "@/components/ui/select"
import { Badge }                    from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { UserListItem }        from "@/lib/services/user.service"

interface InitialData {
  users:  UserListItem[]
  total:  number
  pages:  number
}

interface Props {
  initialData: InitialData
}

// We need full UserDetail for edit — fetch on demand
type ModalTarget = { user: UserListItem }

export function UsersListClient({ initialData }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  // ── Filter state (mirrors URL) ─────────────────────────────────────────────
  const [search,     setSearch]     = useState(searchParams.get("search")     ?? "")
  const [role,       setRole]       = useState(searchParams.get("role")       ?? "")
  const [kycStatus,  setKycStatus]  = useState(searchParams.get("kycStatus")  ?? "")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") ?? "")
  const [page,       setPage]       = useState(Number(searchParams.get("page") ?? 1))

  // ── Data state ─────────────────────────────────────────────────────────────
  const [data,    setData]    = useState<InitialData>(initialData)
  const [loading, setLoading] = useState(false)

  // ── Modal state ────────────────────────────────────────────────────────────
  const [modal, setModal] = useState<
    | { type: "edit" | "credit" | "debit" | "reset" | "suspend" | "delete"; target: ModalTarget }
    | { type: "create" }
    | null
  >(null)
  const [detailUser, setDetailUser] = useState<import("@/lib/services/user.service").UserDetail | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fetch whenever filters or page change ─────────────────────────────────
  const fetchUsers = useCallback(async (params: {
    search: string; role: string; kycStatus: string;
    statusFilter: string; page: number
  }) => {
    setLoading(true)
    try {
      const sp = new URLSearchParams()
      if (params.search)       sp.set("search",   params.search)
      if (params.role)         sp.set("role",      params.role)
      if (params.kycStatus)    sp.set("kycStatus", params.kycStatus)
      if (params.statusFilter === "active")    { sp.set("isActive", "true");  sp.set("isSuspended", "false") }
      if (params.statusFilter === "suspended") sp.set("isSuspended", "true")
      if (params.statusFilter === "inactive")  sp.set("isActive", "false")
      sp.set("page",  String(params.page))
      sp.set("limit", "20")

      const res = await fetch(`/api/admin/users?${sp}`)
      if (!res.ok) throw new Error("fetch failed")
      const result = await res.json()
      setData(result)
    } catch {
      // keep previous data on error
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Update URL + fetch when filters change ────────────────────────────────
  const applyFilters = useCallback((overrides: Partial<{
    search: string; role: string; kycStatus: string; statusFilter: string; page: number
  }>) => {
    const s = overrides.search      ?? search
    const r = overrides.role        ?? role
    const k = overrides.kycStatus   ?? kycStatus
    const st = overrides.statusFilter ?? statusFilter
    const p = overrides.page        ?? 1

    const params = new URLSearchParams()
    if (s)  params.set("search",   s)
    if (r)  params.set("role",     r)
    if (k)  params.set("kycStatus", k)
    if (st) params.set("status",   st)
    if (p > 1) params.set("page",  String(p))

    router.replace(`${pathname}?${params}`, { scroll: false })
    fetchUsers({ search: s, role: r, kycStatus: k, statusFilter: st, page: p })
  }, [search, role, kycStatus, statusFilter, router, pathname, fetchUsers])

  // ── Debounced search ──────────────────────────────────────────────────────
  const handleSearchChange = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      applyFilters({ search: value, page: 1 })
    }, 400)
  }

  // ── Fetch user detail for modals that need it ─────────────────────────────
  const openModal = async (
    type: "edit" | "credit" | "debit" | "reset" | "suspend" | "delete",
    user: UserListItem
  ) => {
    if (type === "edit" || type === "credit" || type === "debit") {
      const res  = await fetch(`/api/admin/users/${user.id}`)
      const full = await res.json()
      setDetailUser(full)
    }
    setModal({ type, target: { user } })
  }

  const closeModal = () => { setModal(null); setDetailUser(null) }

  const onSuccess = () => {
    closeModal()
    fetchUsers({ search, role, kycStatus, statusFilter, page })
    router.refresh()
  }

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key:    "name",
      label:  "User",
      render: (r: UserListItem) => (
        <Link href={`/admin/users/${r.id}`} className="flex items-center gap-3 hover:opacity-80">
          <UserAvatar firstName={r.firstName} lastName={r.lastName} size="sm" avatarUrl={r.avatarUrl} />
          <div>
            <p className="font-medium text-slate-800">{r.firstName} {r.lastName}</p>
            <p className="text-xs text-slate-400">{r.email}</p>
          </div>
        </Link>
      ),
    },
    {
      key:    "phone",
      label:  "Phone",
      hideOnMobile: true,
      render: (r: UserListItem) => (
        <span className="text-slate-500">{r.phone || "—"}</span>
      ),
    },
    {
      key:    "role",
      label:  "Role",
      hideOnMobile: true,
      render: (r: UserListItem) => (
        <Badge variant={r.role === "admin" ? "warning" : "secondary"}>
          {r.role === "admin" ? "Admin" : "User"}
        </Badge>
      ),
    },
    {
      key:    "kycStatus",
      label:  "KYC",
      render: (r: UserListItem) => <StatusBadge status={r.kycStatus} />,
    },
    {
      key:    "status",
      label:  "Status",
      render: (r: UserListItem) => (
        <span title={r.isSuspended ? (r.suspendReason ?? "") : undefined}>
          <StatusBadge status={r.isSuspended ? "suspended" : r.isActive ? "active" : "inactive"} />
        </span>
      ),
    },
    {
      key:    "accountCount",
      label:  "Accounts",
      hideOnMobile: true,
      render: (r: UserListItem) => (
        <Badge variant="outline">{r.accountCount} {r.accountCount === 1 ? "account" : "accounts"}</Badge>
      ),
    },
    {
      key:    "createdAt",
      label:  "Joined",
      hideOnMobile: true,
      render: (r: UserListItem) => (
        <span className="text-sm text-slate-500">{format(new Date(r.createdAt), "MMM d, yyyy")}</span>
      ),
    },
    {
      key:    "actions",
      label:  "",
      render: (r: UserListItem) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded p-1.5 hover:bg-slate-100">
              <MoreHorizontal className="h-4 w-4 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link href={`/admin/users/${r.id}`}>View profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openModal("edit",    r)}>Edit user</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openModal("credit", r)} className="text-emerald-600">Credit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openModal("debit", r)} className="text-red-600">Debit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => openModal("reset",   r)}>Reset password</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openModal("suspend", r)}>
              {r.isSuspended ? "Unsuspend" : "Suspend"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openModal("delete", r)}
              className="text-red-600 focus:text-red-600"
            >
              Delete account
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const rows = data.users as unknown as Record<string, unknown>[]

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Users"
          subtitle={`${data.total.toLocaleString()} total users`}
        />

        {/* ── Filter bar ── */}
        <div className="space-y-3">
          {/* Search + Add button row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name, email, or phone…"
                className="pl-9"
              />
            </div>
            <Button onClick={() => setModal({ type: "create" })} className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add user</span>
            </Button>
          </div>

          {/* Filter dropdowns - scrollable on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1">
            <Select
              value={role || "all"}
              onValueChange={(v) => { const val = v === "all" ? "" : v; setRole(val); applyFilters({ role: val, page: 1 }) }}
              className="w-32 shrink-0"
            >
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </Select>

            <Select
              value={kycStatus || "all"}
              onValueChange={(v) => { const val = v === "all" ? "" : v; setKycStatus(val); applyFilters({ kycStatus: val, page: 1 }) }}
              className="w-36 shrink-0"
            >
              <SelectItem value="all">All KYC</SelectItem>
              <SelectItem value="unverified">Unverified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </Select>

            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => { const val = v === "all" ? "" : v; setStatusFilter(val); applyFilters({ statusFilter: val, page: 1 }) }}
              className="w-36 shrink-0"
            >
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </Select>
          </div>
        </div>

        {/* ── Table ── */}
        <DataTable
          columns={columns as unknown as Parameters<typeof DataTable>[0]["columns"]}
          data={rows}
          loading={loading}
          emptyMessage="No users match your filters."
        />

        {/* ── Pagination ── */}
        {data.pages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-slate-500 order-2 sm:order-1">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total.toLocaleString()}
            </p>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { const p = page - 1; setPage(p); applyFilters({ page: p }) }}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-600 min-w-[100px] text-center">Page {page} of {data.pages}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { const p = page + 1; setPage(p); applyFilters({ page: p }) }}
                disabled={page >= data.pages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modal?.type === "create" && (
        <CreateUserModal
          open
          onClose={closeModal}
          onSuccess={(id) => { onSuccess(); router.push(`/admin/users/${id}`) }}
        />
      )}

      {modal?.type === "edit" && detailUser && (
        <EditUserModal open onClose={closeModal} onSuccess={onSuccess} user={detailUser} />
      )}

      {(modal?.type === "credit" || modal?.type === "debit") && detailUser && (
        <TransactionModal open onClose={closeModal} onSuccess={onSuccess} user={detailUser} mode={modal.type} />
      )}

      {modal?.type === "reset" && modal.target && (
        <ResetPasswordModal
          open
          onClose={closeModal}
          userId={modal.target.user.id}
          userName={`${modal.target.user.firstName} ${modal.target.user.lastName}`}
        />
      )}

      {modal?.type === "suspend" && modal.target && (
        <SuspendModal
          open
          onClose={closeModal}
          onSuccess={onSuccess}
          userId={modal.target.user.id}
          isSuspended={modal.target.user.isSuspended}
          suspendReason={modal.target.user.suspendReason}
          userName={`${modal.target.user.firstName} ${modal.target.user.lastName}`}
        />
      )}

      {modal?.type === "delete" && modal.target && (
        <ConfirmDeleteModal
          open
          onClose={closeModal}
          userId={modal.target.user.id}
          userEmail={modal.target.user.email}
          userName={`${modal.target.user.firstName} ${modal.target.user.lastName}`}
        />
      )}
    </>
  )
}
