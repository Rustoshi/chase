import mongoose, { Document, Model, Schema } from "mongoose"

export interface IAddress {
  street?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

export interface IPushSubscriptionKeys {
  p256dh: string
  auth: string
}

export interface IPushSubscription {
  endpoint: string
  keys: IPushSubscriptionKeys
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId
  firstName: string
  lastName: string
  email: string
  passwordHash: string
  phone?: string
  avatarUrl?: string
  ssn?: string
  dateOfBirth?: Date
  address?: IAddress
  role: "user" | "admin"
  kycStatus: "unverified" | "pending" | "verified" | "rejected"
  kycTier: 1 | 2 | 3
  isActive: boolean
  isSuspended: boolean
  suspendReason?: string
  twoFactorEnabled: boolean
  pushSubscription?: IPushSubscription
  emailVerified: boolean
  emailVerificationToken?: string
  passwordResetToken?: string
  passwordResetExpiry?: Date
  transferPin: string
  referralCode: string
  referredBy?: mongoose.Types.ObjectId
  preferredCurrency: string
  createdAt: Date
  updatedAt: Date
}

const AddressSchema = new Schema<IAddress>(
  {
    street:  String,
    city:    String,
    state:   String,
    zip:     String,
    country: String,
  },
  { _id: false }
)

const PushSubscriptionSchema = new Schema(
  {
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth:   { type: String, required: true },
    },
  },
  { _id: false }
)

const UserSchema = new Schema<IUser>(
  {
    firstName:              { type: String, required: true, trim: true },
    lastName:               { type: String, required: true, trim: true },
    email:                  { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash:           { type: String, required: true },
    phone:                  { type: String, trim: true },
    avatarUrl:              { type: String, trim: true },
    ssn:                    { type: String, trim: true },
    dateOfBirth:            { type: Date },
    address:                { type: AddressSchema },
    role:                   { type: String, enum: ["user", "admin"], default: "user" },
    kycStatus:              { type: String, enum: ["unverified", "pending", "verified", "rejected"], default: "unverified" },
    kycTier:                { type: Number, enum: [1, 2, 3], default: 1 },
    isActive:               { type: Boolean, default: true },
    isSuspended:            { type: Boolean, default: false },
    suspendReason:          { type: String },
    twoFactorEnabled:       { type: Boolean, default: false },
    pushSubscription:       { type: PushSubscriptionSchema },
    emailVerified:          { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    passwordResetToken:     { type: String },
    passwordResetExpiry:    { type: Date },
    transferPin:            { type: String },
    referralCode:           { type: String, unique: true, sparse: true },
    referredBy:             { type: Schema.Types.ObjectId, ref: "User" },
    preferredCurrency:      { type: String, default: "USD", uppercase: true, trim: true },
  },
  { timestamps: true }
)

// email and referralCode already carry unique:true in their field definitions;
// re-declaring them here would trigger process.emitWarning in some runtimes.

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ?? mongoose.model<IUser>("User", UserSchema)

export default User
