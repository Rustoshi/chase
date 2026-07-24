import { NextRequest, NextResponse } from "next/server"
import { adminGuard }               from "@/lib/middleware/adminGuard"
import { exportTransactions }       from "@/lib/services/transaction.service"

export async function GET(req: NextRequest) {
  const { error } = await adminGuard()
  if (error) return error

  const sp = req.nextUrl.searchParams

  const params = {
    search:      sp.get("search")      ?? undefined,
    userId:      sp.get("userId")      ?? undefined,
    accountId:   sp.get("accountId")   ?? undefined,
    type:        sp.get("type")        ?? undefined,
    status:      sp.get("status")      ?? undefined,
    dateFrom:    sp.get("dateFrom")    ?? undefined,
    dateTo:      sp.get("dateTo")      ?? undefined,
    amountMin:   sp.has("amountMin")   ? Number(sp.get("amountMin"))  : undefined,
    amountMax:   sp.has("amountMax")   ? Number(sp.get("amountMax"))  : undefined,
    currency:    sp.get("currency")    ?? undefined,
    isGenerated: sp.has("isGenerated") ? sp.get("isGenerated") === "true" : undefined,
    sortBy:      "createdAt",
    sortOrder:   "desc" as const,
  }

  try {
    const rows   = await exportTransactions(params)
    const header = [
      "Reference","Date","Time","Type","Status","User Name","User Email",
      "Account Number","Currency","Amount","Fee","Description",
      "External Recipient Name","External Recipient Bank","Is Generated",
    ]
    const csvRows = rows.map((r) => [
      r.reference, r.date, r.time, r.type, r.status,
      r.userName, r.userEmail, r.accountNumber, r.currency,
      r.amount, r.fee, `"${r.description.replace(/"/g, '""')}"`,
      r.externalRecipientName, r.externalRecipientBank, r.isGenerated,
    ].map((v) => String(v ?? "")).join(","))

    const csv  = [header.join(","), ...csvRows].join("\n")
    const date = new Date().toISOString().slice(0, 10)

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type":        "text/csv",
        "Content-Disposition": `attachment; filename="novapay-transactions-${date}.csv"`,
      },
    })
  } catch (err) {
    console.error("[admin/transactions/export]", err)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
