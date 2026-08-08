import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema(
  {
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Household',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      required: true,
      enum: ['income', 'expense', 'commitment', 'saving'],
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    merchant: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 240,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    source: {
      type: String,
      enum: ['mock', 'manual', 'future_bank'],
      default: 'manual',
    },
  },
  { timestamps: true },
)

transactionSchema.index({ householdId: 1, userId: 1, date: -1 })

export const Transaction = mongoose.model('Transaction', transactionSchema)
