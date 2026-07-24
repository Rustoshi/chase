import mongoose, { Schema, Document, Model } from "mongoose"

export interface ICardTransaction extends Document {
  cardId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  type: "purchase" | "refund" | "payment" | "fee" | "cashback" | "withdrawal"
  amount: number // in cents
  currency: string
  status: "pending" | "completed" | "declined" | "reversed"
  merchantName?: string
  merchantCategory?: string
  description: string
  reference: string
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const CardTransactionSchema = new Schema<ICardTransaction>(
  {
    cardId: {
      type: Schema.Types.ObjectId,
      ref: "CardApplication",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["purchase", "refund", "payment", "fee", "cashback", "withdrawal"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "declined", "reversed"],
      default: "completed",
    },
    merchantName: {
      type: String,
    },
    merchantCategory: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
)

CardTransactionSchema.index({ cardId: 1, createdAt: -1 })
CardTransactionSchema.index({ userId: 1, createdAt: -1 })

const CardTransaction: Model<ICardTransaction> =
  mongoose.models.CardTransaction ||
  mongoose.model<ICardTransaction>("CardTransaction", CardTransactionSchema)

export default CardTransaction
