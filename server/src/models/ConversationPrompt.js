import mongoose from 'mongoose'

const conversationPromptSchema = new mongoose.Schema(
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
    insight: {
      type: String,
      required: true,
      trim: true,
    },
    suggestedQuestion: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'discussed', 'dismissed'],
      default: 'active',
      index: true,
    },
    weekStart: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
)

export const ConversationPrompt = mongoose.model(
  'ConversationPrompt',
  conversationPromptSchema,
)
