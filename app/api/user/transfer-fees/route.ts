import { NextResponse } from "next/server"
import { auth }         from "@/lib/auth"
import { getAppSettings } from "@/lib/services/settings.service"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await getAppSettings()

    return NextResponse.json({
      localTransferFee: settings.localTransferFee ?? 0,
      internationalTransferFee: settings.internationalTransferFee ?? 15,
      internationalTransferFeeType: settings.internationalTransferFeeType ?? "flat",
      internationalTransferFeePercent: settings.internationalTransferFeePercent ?? 2.5,
    })
  } catch (err) {
    console.error("[Transfer Fees Error]", err)
    return NextResponse.json({ error: "Failed to fetch transfer fees" }, { status: 500 })
  }
}
