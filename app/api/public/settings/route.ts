import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db/connection"
import AppSettings, { APP_SETTINGS_ID } from "@/lib/models/AppSettings"
import { resolveContactInfo } from "@/lib/contact"

/**
 * Public endpoint to get platform settings needed by client pages.
 * No authentication required.
 */
export async function GET() {
  try {
    await connectDB()

    const settings = await AppSettings.findById(APP_SETTINGS_ID)
      .select("defaultCurrency supportedCurrencies maintenanceMode maintenanceMessage supportPhone supportTextPhone supportEmail supportAddress supportOffices supportDepartments careersEmail complianceEmail privacyEmail legalEmail")
      .lean()

    return NextResponse.json({
      defaultCurrency: settings?.defaultCurrency || "USD",
      supportedCurrencies: settings?.supportedCurrencies || ["USD"],
      maintenanceMode: settings?.maintenanceMode || false,
      maintenanceMessage: settings?.maintenanceMessage || null,
      contact: resolveContactInfo(settings as never),
    })
  } catch (err) {
    console.error("[GET /api/public/settings]", err)
    return NextResponse.json({
      defaultCurrency: "USD",
      supportedCurrencies: ["USD"],
      maintenanceMode: false,
      maintenanceMessage: null,
      contact: resolveContactInfo(null),
    })
  }
}
