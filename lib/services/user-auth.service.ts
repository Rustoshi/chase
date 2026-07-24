import crypto from "crypto"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"
import { connectDB } from "@/lib/db/connection"
import User, { type IUser } from "@/lib/models/User"
import Account from "@/lib/models/Account"
import Notification from "@/lib/models/Notification"
import AuditLog from "@/lib/models/AuditLog"
import PendingRegistration from "@/lib/models/PendingRegistration"
import { BANK_NAME } from "@/lib/brand"
import { sendAdminAlertEmail } from "@/lib/email"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RegisterData {
  firstName:     string
  lastName:      string
  email:         string
  /** Plaintext password (validated + hashed here). Provide this OR passwordHash. */
  password?:     string
  /** Already-bcrypt-hashed password (used by the OTP flow, which hashes earlier). */
  passwordHash?: string
  pin:           string
  phone?:        string
  currency:      string
}

// ── Email-verification OTP config ─────────────────────────────────────────────

const OTP_TTL_MS              = 10 * 60 * 1000 // code valid for 10 minutes
const OTP_MAX_ATTEMPTS        = 5
const OTP_RESEND_COOLDOWN_MS  = 30 * 1000

function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0")
}

// ── Validation helpers ────────────────────────────────────────────────────────

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
const NAME_REGEX     = /^[a-zA-Z][a-zA-Z\-']{1,49}$/
const PHONE_REGEX    = /^\+[1-9]\d{6,14}$/
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

function validatePassword(password: string): void {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long.")
  }
  if (!/[a-z]/.test(password)) {
    throw new Error("Password must contain at least one lowercase letter.")
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error("Password must contain at least one uppercase letter.")
  }
  if (!/\d/.test(password)) {
    throw new Error("Password must contain at least one number.")
  }
}

function validateName(value: string, fieldName: string): void {
  if (!value || value.length < 2) {
    throw new Error(`${fieldName} must be at least 2 characters.`)
  }
  if (value.length > 50) {
    throw new Error(`${fieldName} must be 50 characters or fewer.`)
  }
  if (!NAME_REGEX.test(value)) {
    throw new Error(`${fieldName} can only contain letters, hyphens, and apostrophes.`)
  }
}

// ── Random generators ─────────────────────────────────────────────────────────

function randomDigits(length: number): string {
  let result = ""
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString()
  }
  return result
}

function randomAlphanumeric(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  const bytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

function randomBase58(length: number): string {
  let result = ""
  const bytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    result += BASE58_ALPHABET[bytes[i] % BASE58_ALPHABET.length]
  }
  return result
}

function randomUpperLetters(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let result = ""
  const bytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }
  return result
}

async function generateUniqueAccountNumber(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    // 10-digit number starting with a non-zero digit (realistic bank format)
    const num = String(Math.floor(1_000_000_000 + Math.random() * 9_000_000_000))
    const exists = await Account.exists({ accountNumber: num })
    if (!exists) return num
  }
  throw new Error("Unable to generate a unique account number. Please try again.")
}

function generateReferralCode(firstName: string): string {
  const prefix = firstName.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3).padEnd(3, "X")
  return prefix + randomAlphanumeric(5)
}

// ── Audit log helper (user-context — uses the user's own id/email) ────────────

async function createUserAuditLog(
  userId:      string,
  userEmail:   string,
  action:      string,
  targetType?: string,
  targetId?:   string,
  payload?:    Record<string, unknown>
): Promise<void> {
  try {
    await AuditLog.create({
      adminId:    userId,
      adminEmail: userEmail,
      action,
      targetType,
      targetId,
      payload,
    })
  } catch {
    // Swallow — audit failure must not break the flow
    console.error("[AuditLog] user audit write failed")
  }
}

// ── registerUser ──────────────────────────────────────────────────────────────

export async function registerUser(
  data: RegisterData
): Promise<{ user: IUser }> {
  await connectDB()

  // Validate inputs
  validateName(data.firstName, "First name")
  validateName(data.lastName, "Last name")

  if (data.phone && !PHONE_REGEX.test(data.phone)) {
    throw new Error("Phone number must be in international format (e.g. +1234567890).")
  }

  // Check duplicate email
  const emailLower = data.email.toLowerCase().trim()
  const existingUser = await User.findOne({ email: emailLower }).lean()
  if (existingUser) {
    throw new Error("An account with this email already exists.")
  }

  // Validate PIN
  if (!/^\d{4}$/.test(data.pin)) {
    throw new Error("PIN must be exactly 4 digits.")
  }

  // Resolve password hash — either provided pre-hashed (OTP flow) or hash now.
  let passwordHash: string
  if (data.passwordHash) {
    passwordHash = data.passwordHash
  } else if (data.password) {
    validatePassword(data.password)
    passwordHash = await bcrypt.hash(data.password, 12)
  } else {
    throw new Error("A password is required.")
  }

  // Generate tokens / codes
  const referralCode = generateReferralCode(data.firstName)

  // Create user
  const user = await User.create({
    firstName:   data.firstName.trim(),
    lastName:    data.lastName.trim(),
    email:       emailLower,
    passwordHash,
    phone:       data.phone?.trim() || undefined,
    role:        "user",
    kycStatus:   "unverified",
    kycTier:     1,
    isActive:    true,
    isSuspended: false,
    emailVerified:          true,
    transferPin: data.pin,
    referralCode,
    preferredCurrency: data.currency.toUpperCase(),
  })

  // Create fiat account
  const fiatAccountNumber = await generateUniqueAccountNumber()
  await Account.create({
    userId:        user._id,
    walletType:    "fiat",
    currency:      data.currency.toUpperCase(),
    accountNumber: fiatAccountNumber,
    routingNumber: "0" + randomDigits(8),
    swiftCode:     "NVPY" + randomUpperLetters(4),
    iban:          "US" + randomDigits(2) + "NVPY" + randomDigits(16),
    balance:       0,
    btcBalance:    0,
    isFrozen:      false,
  })

  // Create bitcoin account
  const btcAccountNumber = await generateUniqueAccountNumber()
  await Account.create({
    userId:        user._id,
    walletType:    "bitcoin",
    accountNumber: btcAccountNumber,
    btcAddress:    "1" + randomBase58(33),
    btcBalance:    0,
    balance:       0,
    isFrozen:      false,
  })

  // Welcome notification
  await Notification.create({
    userId:  user._id,
    type:    "system",
    channel: "in_app",
    subject: `Welcome to ${BANK_NAME}`,
    body:    "Your account is set up and ready. Complete KYC to unlock all features.",
  })

  // Audit log
  await createUserAuditLog(
    user._id.toString(),
    user.email,
    "user.register",
    "User",
    user._id.toString()
  )

  // Notify admin of the new registration (fire-and-forget)
  sendAdminAlertEmail("New client registration", [
    { label: "Name",     value: `${user.firstName} ${user.lastName}` },
    { label: "Email",    value: user.email },
    { label: "Phone",    value: user.phone || "—" },
    { label: "Currency", value: user.preferredCurrency },
    { label: "Date",     value: new Date().toLocaleString() },
  ], "A new client just created an account.").catch(() => {})

  return { user }
}

// ── Email-verification OTP flow ───────────────────────────────────────────────

/**
 * Step 1 of signup — validate the submitted data, ensure the email is free,
 * hash the password, and stash everything in a PendingRegistration together
 * with a fresh OTP. Returns the plaintext OTP so the caller can email it.
 * The real User is NOT created here.
 */
export async function startEmailVerification(
  data: RegisterData
): Promise<{ otp: string; firstName: string; email: string }> {
  await connectDB()

  validateName(data.firstName, "First name")
  validateName(data.lastName, "Last name")
  if (!data.password) throw new Error("A password is required.")
  validatePassword(data.password)

  if (data.phone && !PHONE_REGEX.test(data.phone)) {
    throw new Error("Phone number must be in international format (e.g. +1234567890).")
  }
  if (!/^\d{4}$/.test(data.pin)) {
    throw new Error("PIN must be exactly 4 digits.")
  }

  const emailLower = data.email.toLowerCase().trim()
  const existingUser = await User.findOne({ email: emailLower }).lean()
  if (existingUser) {
    throw new Error("An account with this email already exists.")
  }

  const passwordHash = await bcrypt.hash(data.password, 12)
  const otp     = generateOtp()
  const otpHash = await bcrypt.hash(otp, 10)

  await PendingRegistration.findOneAndUpdate(
    { email: emailLower },
    {
      email:   emailLower,
      otpHash,
      payload: {
        firstName: data.firstName.trim(),
        lastName:  data.lastName.trim(),
        passwordHash,
        pin:       data.pin,
        phone:     data.phone?.trim() || undefined,
        currency:  data.currency.toUpperCase(),
      },
      attempts:   0,
      lastSentAt: new Date(),
      expiresAt:  new Date(Date.now() + OTP_TTL_MS),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  return { otp, firstName: data.firstName.trim(), email: emailLower }
}

/**
 * Step 2 of signup — confirm the OTP and, on success, actually create the User.
 * The pending record is consumed (deleted) on success.
 */
export async function verifyRegistrationOtp(
  email: string,
  otp:   string
): Promise<{ user: IUser }> {
  await connectDB()

  const emailLower = email.toLowerCase().trim()
  const pending = await PendingRegistration.findOne({ email: emailLower })

  if (!pending) {
    throw new Error("Your verification code has expired. Please start again.")
  }
  if (pending.expiresAt.getTime() < Date.now()) {
    await PendingRegistration.deleteOne({ _id: pending._id })
    throw new Error("Your verification code has expired. Please request a new one.")
  }
  if (pending.attempts >= OTP_MAX_ATTEMPTS) {
    await PendingRegistration.deleteOne({ _id: pending._id })
    throw new Error("Too many incorrect attempts. Please start again.")
  }

  const match = await bcrypt.compare(otp, pending.otpHash)
  if (!match) {
    pending.attempts += 1
    await pending.save()
    const left = OTP_MAX_ATTEMPTS - pending.attempts
    throw new Error(
      left > 0
        ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.`
        : "Too many incorrect attempts. Please start again."
    )
  }

  // OTP is valid — create the user from the stashed (pre-hashed) payload.
  const { user } = await registerUser({
    firstName:    pending.payload.firstName,
    lastName:     pending.payload.lastName,
    email:        emailLower,
    passwordHash: pending.payload.passwordHash,
    pin:          pending.payload.pin,
    phone:        pending.payload.phone,
    currency:     pending.payload.currency,
  })

  await PendingRegistration.deleteOne({ _id: pending._id })
  return { user }
}

/**
 * Resend a fresh OTP for an in-progress signup. Enforces a short cooldown and
 * resets the attempt counter. Returns null (silently) if there is no pending
 * registration for the email, so callers can respond without leaking existence.
 */
export async function resendRegistrationOtp(
  email: string
): Promise<{ otp: string; firstName: string } | null> {
  await connectDB()

  const emailLower = email.toLowerCase().trim()
  const pending = await PendingRegistration.findOne({ email: emailLower })
  if (!pending) return null

  if (Date.now() - pending.lastSentAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    throw new Error("Please wait a moment before requesting another code.")
  }

  const otp = generateOtp()
  pending.otpHash    = await bcrypt.hash(otp, 10)
  pending.expiresAt  = new Date(Date.now() + OTP_TTL_MS)
  pending.attempts   = 0
  pending.lastSentAt = new Date()
  await pending.save()

  return { otp, firstName: pending.payload.firstName }
}

// ── verifyEmail ───────────────────────────────────────────────────────────────

export async function verifyEmail(token: string): Promise<IUser> {
  await connectDB()

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerified:          false,
  })

  if (!user) {
    throw new Error("Invalid or expired verification link.")
  }

  user.emailVerified = true
  user.emailVerificationToken = undefined
  await user.save()

  await createUserAuditLog(
    user._id.toString(),
    user.email,
    "user.email_verified",
    "User",
    user._id.toString()
  )

  return user
}

// ── requestPasswordReset ──────────────────────────────────────────────────────

export async function requestPasswordReset(
  email: string
): Promise<{ token: string; firstName: string } | null> {
  await connectDB()

  const user = await User.findOne({ email: email.toLowerCase().trim() })
  if (!user) return null

  const passwordResetToken  = crypto.randomBytes(32).toString("hex")
  const passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  user.passwordResetToken  = passwordResetToken
  user.passwordResetExpiry = passwordResetExpiry
  await user.save()

  return { token: passwordResetToken, firstName: user.firstName }
}

// ── resetPassword ─────────────────────────────────────────────────────────────

export async function resetPassword(
  token:       string,
  newPassword: string
): Promise<void> {
  await connectDB()

  const user = await User.findOne({
    passwordResetToken:  token,
    passwordResetExpiry: { $gt: new Date() },
  })

  if (!user) {
    throw new Error("Invalid or expired reset link.")
  }

  validatePassword(newPassword)

  user.passwordHash       = await bcrypt.hash(newPassword, 12)
  user.passwordResetToken  = undefined
  user.passwordResetExpiry = undefined
  await user.save()

  await createUserAuditLog(
    user._id.toString(),
    user.email,
    "user.password_reset_completed",
    "User",
    user._id.toString()
  )
}

// ── changePassword ────────────────────────────────────────────────────────────

export async function changePassword(
  userId:          string,
  currentPassword: string,
  newPassword:     string
): Promise<void> {
  await connectDB()

  const user = await User.findById(userId)
  if (!user) throw new Error("User not found.")

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isMatch) throw new Error("Current password is incorrect.")

  validatePassword(newPassword)

  user.passwordHash = await bcrypt.hash(newPassword, 12)
  await user.save()

  await createUserAuditLog(
    user._id.toString(),
    user.email,
    "user.password_changed",
    "User",
    user._id.toString()
  )
}
