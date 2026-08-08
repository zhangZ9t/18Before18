import mongoose from 'mongoose'

const familyAdvanceSchema = new mongoose.Schema(
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
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    originalAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    amountAdvanced: {
      type: Number,
      required: true,
      min: 1,
    },
    installmentAmount: {
      type: Number,
      required: true,
      min: 1,
    },
    installmentCount: {
      type: Number,
      required: true,
      min: 1,
      max: 52,
    },
    installmentsRemaining: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['requested', 'approved', 'declined', 'active', 'completed'],
      default: 'requested',
      index: true,
    },
  },
  { timestamps: true },
)

export const FamilyAdvance = mongoose.model('FamilyAdvance', familyAdvanceSchema)
