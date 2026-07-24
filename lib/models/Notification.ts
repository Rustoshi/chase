import mongoose, { Document, Model, Schema } from "mongoose"

export type NotificationType =
  | "transaction"
  | "security"
  | "kyc"
  | "loan"
  | "card"
  | "system"
  | "marketing"
  | "deposit_request"
  | "transfer"

export type NotificationChannel = "email" | "push" | "in_app"

export interface INotificationMetadata {
  [key: string]: unknown
}

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  type: NotificationType
  channel: NotificationChannel
  subject?: string
  body: string
  isRead: boolean
  readAt?: Date
  metadata?: INotificationMetadata
  sentAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    type:     {
      type: String,
      enum: [
        "transaction", "security", "kyc", "loan", "card",
        "system", "marketing", "deposit_request", "transfer",
      ],
      required: true,
    },
    channel:  { type: String, enum: ["email", "push", "in_app"], required: true },
    subject:  { type: String },
    body:     { type: String, required: true },
    isRead:   { type: Boolean, default: false },
    readAt:   { type: Date },
    metadata: { type: Schema.Types.Mixed },
    sentAt:   { type: Date, default: () => new Date() },
  },
  { timestamps: false }
)

NotificationSchema.index({ userId: 1 })
NotificationSchema.index({ isRead: 1 })
NotificationSchema.index({ sentAt: -1 })

const Notification: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) ??
  mongoose.model<INotification>("Notification", NotificationSchema)

export default Notification
