import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/db/connection"
import SupportTicket from "@/lib/models/SupportTicket"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    await connectDB()
    const tickets = await SupportTicket.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean()

    const serialized = tickets.map((t: Record<string, unknown>) => ({
      _id:       String(t._id),
      subject:   t.subject,
      status:    t.status,
      priority:  t.priority,
      messages:  (t.messages as Array<Record<string, unknown>>)?.map((m) => ({
        sender:    m.senderRole || m.sender || "user",
        content:   m.body || m.content || "",
        createdAt: ((m.sentAt || m.createdAt) as Date)?.toISOString?.() || new Date().toISOString(),
      })) || [],
      createdAt: (t.createdAt as Date)?.toISOString(),
      updatedAt: (t.updatedAt as Date)?.toISOString(),
    }))

    return NextResponse.json({ tickets: serialized })
  } catch (err) {
    console.error("[GET /api/user/support]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { subject, message, priority, category } = body

    if (!subject || subject.length < 3) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 })
    }
    if (!message || message.length < 10) {
      return NextResponse.json({ error: "Message must be at least 10 characters" }, { status: 400 })
    }

    await connectDB()

    const ticket = await SupportTicket.create({
      userId: session.user.id,
      subject: category ? `[${category}] ${subject}` : subject,
      priority: priority || "normal",
      status: "open",
      messages: [{
        senderId: session.user.id,
        senderRole: "user",
        body: message,
        sentAt: new Date(),
      }],
    })

    return NextResponse.json({
      ticket: {
        _id: String(ticket._id),
        subject: ticket.subject,
        status: ticket.status,
      },
    }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/user/support]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
