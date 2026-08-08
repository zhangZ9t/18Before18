import mongoose from 'mongoose'

const householdCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    weeklyBudget: {
      type: Number,
      min: 0,
      default: 0,
    },
    visibleToTeen: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
)

const independenceRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    requestedLevel: {
      type: Number,
      min: 1,
      max: 4,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'declined'],
    },
    requestedAt: Date,
    resolvedAt: Date,
  },
  { _id: false },
)

const householdSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    weeklyDeposit: {
      type: Number,
      min: 0,
      default: 100,
    },
    depositFrequency: {
      type: String,
      enum: ['weekly', 'fortnightly', 'monthly'],
      default: 'weekly',
    },
    savingsCommitment: {
      type: Number,
      min: 0,
      default: 20,
    },
    independenceLevel: {
      type: Number,
      min: 1,
      max: 4,
      default: 1,
    },
    householdCategories: {
      type: [householdCategorySchema],
      default: [],
    },
    savingsTarget: {
      type: Number,
      min: 0,
      default: 0,
    },
    independenceRequest: independenceRequestSchema,
  },
  { timestamps: true },
)

export const Household = mongoose.model('Household', householdSchema)
