import mongoose, { Document, Model, Schema } from "mongoose"

/**
 * Holds a signup that is awaiting email-OTP verification. The real User is only
 * created once the OTP is confirmed. Documents auto-expire via a TTL index so
 * abandoned signups clean themselves up. The password is stored pre-hashed —
 * never in plaintext.
 */

export interface IPendingRegistrationPayload {
  firstName:    string
  lastName:     string
  passwordHash: string
  pin:          string
  phone?:       string
  currency:     string
}

export interface IPendingRegistration extends Document {
  email:      string
  otpHash:    string
  payload:    IPendingRegistrationPayload
  attempts:   number
  lastSentAt: Date
  expiresAt:  Date
  createdAt:  Date
  updatedAt:  Date
}

const PayloadSchema = new Schema<IPendingRegistrationPayload>(
  {
    firstName:    { type: String, required: true },
    lastName:     { type: String, required: true },
    passwordHash: { type: String, required: true },
    pin:          { type: String, required: true },
    phone:        { type: String },
    currency:     { type: String, required: true },
  },
  { _id: false }
)

const PendingRegistrationSchema = new Schema<IPendingRegistration>(
  {
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    otpHash:    { type: String, required: true },
    payload:    { type: PayloadSchema, required: true },
    attempts:   { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
    expiresAt:  { type: Date, required: true },
  },
  { timestamps: true }
)

// email already carries unique:true in its field definition.
// TTL index — Mongo removes the doc once expiresAt passes.
PendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const PendingRegistration: Model<IPendingRegistration> =
  (mongoose.models.PendingRegistration as Model<IPendingRegistration>) ??
  mongoose.model<IPendingRegistration>("PendingRegistration", PendingRegistrationSchema)

export default PendingRegistration
