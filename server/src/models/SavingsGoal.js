import mongoose from 'mongoose'

const savingsGoalSchema = new mongoose.Schema(
  {
    householdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Household',
      required: true,
      index: true,
    },
    teenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    targetAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    currentAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    weeklyContribution: {
      type: Number,
      min: 0,
      default: 0,
    },
    targetDate: Date,
    completedAt: Date,
  },
  { timestamps: true },
)

export const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema)
