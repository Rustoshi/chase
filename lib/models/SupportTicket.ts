import mongoose, { Document, Model, Schema } from "mongoose"

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed"
export type TicketPriority = "low" | "normal" | "high" | "urgent"
export type SenderRole = "user" | "admin"

export interface ITicketMessage {
  senderId: mongoose.Types.ObjectId
  senderRole: SenderRole
  body: string
  attachmentUrl?: string
  sentAt: Date
}

export interface ISupportTicket extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  subject: string
  status: TicketStatus
  priority: TicketPriority
  assignedTo?: mongoose.Types.ObjectId
  messages: ITicketMessage[]
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const TicketMessageSchema = new Schema<ITicketMessage>(
  {
    senderId:      { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderRole:    { type: String, enum: ["user", "admin"], required: true },
    body:          { type: String, required: true },
    attachmentUrl: { type: String },
    sentAt:        { type: Date, default: () => new Date() },
  },
  { _id: true }
)

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject:    { type: String, required: true, trim: true },
    status:     { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
    priority:   { type: String, enum: ["low", "normal", "high", "urgent"], default: "normal" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    messages:   { type: [TicketMessageSchema], default: [] },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
)

SupportTicketSchema.index({ userId: 1 })
SupportTicketSchema.index({ status: 1 })
SupportTicketSchema.index({ priority: 1 })

const SupportTicket: Model<ISupportTicket> =
  (mongoose.models.SupportTicket as Model<ISupportTicket>) ??
  mongoose.model<ISupportTicket>("SupportTicket", SupportTicketSchema)

export default SupportTicket
