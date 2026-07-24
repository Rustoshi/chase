import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import Transaction from "@/lib/models/Transaction"
import Account from "@/lib/models/Account"
import User from "@/lib/models/User"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    await connectDB()

    const tx = await Transaction.findById(id).lean()
    if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Verify the transaction belongs to this user
    if (String(tx.userId) !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Get account info
    const account = tx.accountId ? await Account.findById(tx.accountId).lean() : null
    
    // Get user info for receiver details
    const user = await User.findById(tx.userId).select("firstName lastName email").lean()
    
    // Get bank name from env
    const bankName = process.env.NEXT_PUBLIC_BANK_NAME || "NovaPay"

    // Determine if credit or debit
    const CREDIT_TYPES = ["deposit", "transfer_in", "admin_deposit", "swap_in", "refund", "loan_disbursement", "tax_refund_deposit", "grant_disbursement"]
    const isCredit = CREDIT_TYPES.includes(tx.type)

    const serialized = {
      _id:          String(tx._id),
      type:         tx.type,
      status:       tx.status,
      amount:       tx.amount,
      currency:     tx.currency,
      description:  tx.description || null,
      reference:    tx.reference || null,
      feeAmount:    tx.feeAmount || 0,
      feePercent:   tx.feePercent || null,
      balanceBefore: tx.balanceBefore ?? null,
      balanceAfter:  tx.balanceAfter ?? null,
      transferType: tx.transferType || null,
      exchangeRate: tx.exchangeRate || null,
      convertedAmount: tx.convertedAmount || null,
      convertedCurrency: tx.convertedCurrency || null,
      btcRateAtTime: tx.btcRateAtTime || null,
      sender: tx.sender || (isCredit ? {
        name: tx.metadata?.sender || "External Source",
        bankName: tx.transferType === "international" ? "International Bank" :
                  tx.transferType === "local_external" ? "Local Bank" : bankName,
      } : {
        name: user ? `${user.firstName} ${user.lastName}` : "Account Holder",
        email: user?.email,
        accountNumber: account?.accountNumber,
        bankName: bankName,
      }),
      receiver: tx.receiver || (isCredit ? {
        name: user ? `${user.firstName} ${user.lastName}` : "Account Holder",
        email: user?.email,
        accountNumber: account?.accountNumber,
        bankName: bankName,
      } : {
        name: tx.externalRecipient?.name || tx.metadata?.sender || "External Recipient",
        bankName: tx.externalRecipient?.bankName || 
                  (tx.transferType === "international" ? "International Bank" :
                   tx.transferType === "local_external" ? "Local Bank" : "External Bank"),
        accountNumber: tx.externalRecipient?.accountNumber,
      }),
      externalRecipient: tx.externalRecipient || null,
      metadata:     tx.metadata || null,
      createdAt:    tx.createdAt.toISOString(),
      processedAt:  tx.processedAt?.toISOString() || tx.createdAt.toISOString(),
      account: account ? {
        _id:          String(account._id),
        walletType:   account.walletType,
        currency:     account.currency,
        accountNumber: account.accountNumber,
      } : null,
      bankName,
      isCredit,
    }

    return NextResponse.json({ transaction: serialized })
  } catch (err) {
    console.error("[GET /api/user/transactions/:id]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
