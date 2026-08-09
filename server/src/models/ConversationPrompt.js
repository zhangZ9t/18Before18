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
      enum: ['active', 'discussed', 'dismissed', 'superseded'],
      default: 'active',
      index: true,
    },
    // Prompts are identified by the spending pattern that produced them, not by a calendar week.
    signalKey: {
      type: String,
      required: true,
      index: true,
    },
    signalType: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: null,
    },
    // Share or count rounded to the nearest 10, so a prompt survives small drift but not a real shift.
    bucket: {
      type: Number,
      default: 0,
    },
    evidence: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    mode: {
      type: String,
      enum: ['fallback', 'openai', 'gemini'],
      default: 'fallback',
    },
    detectedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
)

export const ConversationPrompt = mongoose.model(
  'ConversationPrompt',
  conversationPromptSchema,
)
