import mongoose from 'mongoose'

const practiceScenarioSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'bnpl',
        'flash_sale',
        'subscription',
        'free_trial',
        'fomo',
        'unexpected_expense',
        'impulse_purchase',
      ],
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    minimumIndependenceLevel: {
      type: Number,
      min: 1,
      max: 4,
      default: 1,
    },
    difficulty: {
      type: String,
      enum: ['starter', 'growing', 'challenge'],
      default: 'starter',
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
)

export const PracticeScenario = mongoose.model(
  'PracticeScenario',
  practiceScenarioSchema,
)
