import { NextResponse } from "next/server"
import { getAppSettings } from "@/lib/services/settings.service"

export async function GET() {
  try {
    const settings = await getAppSettings()
    return NextResponse.json({
      allowRegistration: settings.allowRegistration !== false,
    })
  } catch {
    // Default to allowing registration if settings can't be fetched
    return NextResponse.json({ allowRegistration: true })
  }
}
