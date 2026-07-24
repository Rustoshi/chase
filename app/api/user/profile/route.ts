import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import User from "@/lib/models/User"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const user = await User.findById(session.user.id)
      .select("preferredCurrency kycStatus kycTier firstName lastName email avatarUrl createdAt")
      .lean()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      preferredCurrency: user.preferredCurrency || "USD",
      kycStatus:         user.kycStatus || "unverified",
      kycTier:           user.kycTier ?? 1,
      firstName:         user.firstName,
      lastName:          user.lastName,
      email:             user.email,
      avatarUrl:         user.avatarUrl || null,
      createdAt:         user.createdAt ? new Date(user.createdAt).toISOString() : null,
    })
  } catch (err) {
    console.error("[User Profile API]", err)
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 })
  }
}

// Accepts a Cloudinary secure_url (client uploads directly, like KYC docs).
const patchSchema = z.object({
  avatarUrl: z.string().url("Invalid image URL").max(500).nullable(),
})

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: unknown
    try { body = await req.json() } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Validation failed" }, { status: 422 })
    }

    // Only allow images hosted on Cloudinary to be stored.
    if (parsed.data.avatarUrl && !/^https:\/\/res\.cloudinary\.com\//.test(parsed.data.avatarUrl)) {
      return NextResponse.json({ error: "Image must be uploaded through the app" }, { status: 422 })
    }

    await connectDB()
    await User.updateOne(
      { _id: session.user.id },
      { $set: { avatarUrl: parsed.data.avatarUrl || "" } }
    )

    return NextResponse.json({ success: true, avatarUrl: parsed.data.avatarUrl || null })
  } catch (err) {
    console.error("[User Profile PATCH]", err)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
