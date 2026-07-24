import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getAppSettings } from "@/lib/services/settings.service"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const settings = await getAppSettings()
    const transferCodes = (settings.transferCodes || {}) as Record<string, { enabled?: boolean; code?: string; label?: string; message?: string }>

    // Return only enabled codes with their labels and messages (not the actual codes)
    const enabledCodes: Array<{
      key: string
      label: string
      message: string
    }> = []

    const codeKeys = ["imfCode", "swiftCode", "imfClearanceCode", "taxCode"] as const

    for (const key of codeKeys) {
      const codeConfig = transferCodes[key]
      if (codeConfig?.enabled && codeConfig.code) {
        enabledCodes.push({
          key,
          label: codeConfig.label || key,
          message: codeConfig.message || "",
        })
      }
    }

    return NextResponse.json({ codes: enabledCodes })
  } catch (err) {
    console.error("[transfer-codes] GET error:", err)
    return NextResponse.json({ error: "Failed to fetch transfer codes" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { codeKey, enteredCode } = body

    if (!codeKey || typeof enteredCode !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const settings = await getAppSettings()
    const transferCodes = (settings.transferCodes || {}) as Record<string, { enabled?: boolean; code?: string; label?: string; message?: string }>

    const codeConfig = transferCodes[codeKey]
    
    if (!codeConfig?.enabled) {
      return NextResponse.json({ error: "This code is not required" }, { status: 400 })
    }

    if (!codeConfig.code) {
      return NextResponse.json({ error: "Code not configured" }, { status: 400 })
    }

    // Case-insensitive comparison
    const isValid = enteredCode.trim().toUpperCase() === codeConfig.code.trim().toUpperCase()

    if (!isValid) {
      return NextResponse.json({ 
        error: "Invalid code. Please check and try again.",
        valid: false 
      }, { status: 400 })
    }

    return NextResponse.json({ valid: true, message: "Code verified successfully" })
  } catch (err) {
    console.error("[transfer-codes] POST error:", err)
    return NextResponse.json({ error: "Failed to validate code" }, { status: 500 })
  }
}
