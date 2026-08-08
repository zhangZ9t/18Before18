import mongoose from 'mongoose'

const responsibilitySchema = new mongoose.Schema(
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
    category: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    frequency: {
      type: String,
      enum: ['weekly', 'fortnightly', 'monthly', 'once'],
      default: 'weekly',
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'paid', 'overdue'],
      default: 'upcoming',
      index: true,
    },
    assignedAtIndependenceLevel: {
      type: Number,
      min: 1,
      max: 4,
      default: 1,
    },
    consequence: {
      type: String,
      trim: true,
      maxlength: 280,
    },
  },
  { timestamps: true },
)

export const Responsibility = mongoose.model(
  'Responsibility',
  responsibilitySchema,
)
