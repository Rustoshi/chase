import mongoose, { Document, Model, Schema } from "mongoose"

export interface IAuditPayload {
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  [key: string]: unknown
}

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId
  adminId: mongoose.Types.ObjectId
  adminEmail: string
  action: string
  targetType?: string
  targetId?: mongoose.Types.ObjectId
  payload?: IAuditPayload
  ipAddress?: string
  userAgent?: string
  createdAt: Date
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminId:    { type: Schema.Types.ObjectId, ref: "User", required: true },
    adminEmail: { type: String, required: true },
    action:     { type: String, required: true },
    targetType: { type: String },
    targetId:   { type: Schema.Types.ObjectId },
    payload:    { type: Schema.Types.Mixed },
    ipAddress:  { type: String },
    userAgent:  { type: String },
    createdAt:  { type: Date, default: () => new Date(), immutable: true },
  },
  {
    // No updatedAt — this collection is append-only
    timestamps: false,
  }
)

AuditLogSchema.index({ adminId: 1 })
AuditLogSchema.index({ action: 1 })
AuditLogSchema.index({ targetType: 1 })
AuditLogSchema.index({ createdAt: -1 })

// Guard: throw on any mutation attempt so audit integrity is enforced at the ODM layer
const IMMUTABLE_ERROR = "AuditLog records are immutable and cannot be modified or deleted."

for (const hook of [
  "updateOne",
  "updateMany",
  "findOneAndUpdate",
  "findOneAndReplace",
  "findOneAndDelete",
  "deleteOne",
  "deleteMany",
  "replaceOne",
] as const) {
  AuditLogSchema.pre(hook, function () {
    throw new Error(IMMUTABLE_ERROR)
  })
}

const AuditLog: Model<IAuditLog> =
  (mongoose.models.AuditLog as Model<IAuditLog>) ??
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema)

export default AuditLog
