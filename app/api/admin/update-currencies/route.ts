import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db/connection"
import AppSettings, { APP_SETTINGS_ID } from "@/lib/models/AppSettings"

const NEW_CURRENCIES = [
  // North America
  "USD", "CAD", "MXN",
  // Europe
  "EUR", "GBP", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "RON", "BGN", "HRK",
  // Asia Pacific
  "JPY", "CNY", "INR", "AUD", "NZD", "SGD", "HKD", "KRW", "TWD", "THB", "IDR", "MYR", "PHP", "VND",
  // Middle East
  "ILS", "AED", "SAR", "QAR", "KWD", "BHD", "OMR",
  // South America
  "BRL", "ARS", "CLP", "COP", "PEN", "UYU", "PYG", "BOB",
  // Africa
  "ZAR", "EGP", "KES", "GHS", "TZS", "UGX", "ZMW", "BWP", "NAD", "MZN", "AOA", "SCR", "SRD",
  // Eastern Europe & Central Asia
  "RUB", "UAH", "KZT", "GEL", "AMD", "AZN",
  // Others
  "TRY", "PKR", "BDT", "LKR", "NPR", "MUR", "JMD", "TTD", "BBD", "XCD", "BZD", "GTQ", "HNL", "NIO", "CRC", "PAB", "DOP", "CUP", "HTG", "XAF", "XOF", "XPF"
]

async function updateCurrencies() {
  await connectDB()
  const settings = await AppSettings.findByIdAndUpdate(
    APP_SETTINGS_ID,
    { supportedCurrencies: NEW_CURRENCIES },
    { upsert: true, new: true }
  )
  return settings
}

export async function GET() {
  try {
    const settings = await updateCurrencies()
    return NextResponse.json({
      success: true,
      message: "Currency list updated successfully",
      currencies: settings.supportedCurrencies
    })
  } catch (err) {
    console.error("[GET /api/admin/update-currencies]", err)
    return NextResponse.json(
      { error: "Failed to update currencies" },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const settings = await updateCurrencies()
    return NextResponse.json({
      success: true,
      message: "Currency list updated successfully",
      currencies: settings.supportedCurrencies
    })
  } catch (err) {
    console.error("[POST /api/admin/update-currencies]", err)
    return NextResponse.json(
      { error: "Failed to update currencies" },
      { status: 500 }
    )
  }
}
