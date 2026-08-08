import mongoose from 'mongoose'

const weeklyReportSchema = new mongoose.Schema(
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
    weekStart: {
      type: Date,
      required: true,
    },
    weekEnd: {
      type: Date,
      required: true,
    },
    income: { type: Number, min: 0, default: 0 },
    spendingByCategory: {
      type: Map,
      of: Number,
      default: {},
    },
    billsPaid: { type: Number, min: 0, default: 0 },
    billsMissed: { type: Number, min: 0, default: 0 },
    savingsAdded: { type: Number, min: 0, default: 0 },
    safeToSpendAverage: { type: Number, default: 0 },
    goalProgress: { type: Number, min: 0, max: 100, default: 0 },
    habitScore: { type: Number, min: 0, max: 100, default: 0 },
    scoreBreakdown: {
      type: Map,
      of: Number,
      default: {},
    },
    aiSummary: String,
    conversationPrompt: String,
    householdSnapshot: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true },
)

weeklyReportSchema.index({ householdId: 1, userId: 1, weekStart: -1 })

export const WeeklyReport = mongoose.model('WeeklyReport', weeklyReportSchema)
