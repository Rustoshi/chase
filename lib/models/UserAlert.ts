import mongoose, { Document, Model, Schema } from "mongoose"

/**
 * A critical, admin-authored alert pinned to a single client.
 *
 * Unlike `Notification` (a passive feed the user may never open), a UserAlert is
 * pushed in front of the client: it opens as a modal on entry and then persists
 * as a banner on every page until an admin turns it off. There is at most one
 * per user — setting a new one replaces the previous.
 */

export type AlertSeverity = "info" | "warning" | "critical"

export interface IUserAlert extends Document {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId

  title: string
  body: string
  severity: AlertSeverity

  /** Master switch — an inactive alert is invisible to the client. */
  isActive: boolean

  /** Hard block: the modal cannot be closed without an explicit acknowledgement. */
  requireAcknowledge: boolean

  /** Freeze money movement (transfers + deposits) while this alert is active. */
  blockTransactions: boolean

  /** Set when the client explicitly acknowledges. Cleared whenever the alert is edited. */
  acknowledgedAt?: Date

  createdBy?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const UserAlertSchema = new Schema<IUserAlert>(
  {
    userId:   { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    title:    { type: String, required: true, trim: true, maxlength: 120 },
    body:     { type: String, required: true, trim: true, maxlength: 2000 },
    severity: { type: String, enum: ["info", "warning", "critical"], default: "critical" },

    isActive:           { type: Boolean, default: true },
    requireAcknowledge: { type: Boolean, default: false },
    blockTransactions:  { type: Boolean, default: false },

    acknowledgedAt: { type: Date },
    createdBy:      { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
)

const UserAlert: Model<IUserAlert> =
  (mongoose.models.UserAlert as Model<IUserAlert>) ??
  mongoose.model<IUserAlert>("UserAlert", UserAlertSchema)

export default UserAlert
