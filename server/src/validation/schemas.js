import { z } from 'zod'

const email = z.string().trim().email().max(160).transform((value) => value.toLowerCase())
const password = z.string().min(8).max(128)
const mongoId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid resource identifier')
const money = z.coerce.number().min(0).max(1_000_000)

export const parentRegistrationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email,
    password,
    householdName: z.string().trim().min(2).max(100).optional(),
  }),
  params: z.object({}),
  query: z.object({}),
})

export const teenRegistrationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email,
    password,
    householdInviteCode: z
      .string()
      .trim()
      .min(6)
      .max(24)
      .transform((value) => value.toUpperCase()),
  }),
  params: z.object({}),
  query: z.object({}),
})

export const loginSchema = z.object({
  body: z.object({ email, password }),
  params: z.object({}),
  query: z.object({}),
})

export const householdUpdateSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      weeklyDeposit: money.optional(),
      depositFrequency: z.enum(['weekly', 'fortnightly', 'monthly']).optional(),
      savingsCommitment: money.optional(),
      independenceLevel: z.coerce.number().int().min(1).max(4).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, 'No changes supplied'),
  params: z.object({}),
  query: z.object({}),
})

export const visibilityUpdateSchema = z.object({
  body: z.object({
    categories: z
      .array(
        z.object({
          name: z.string().trim().min(1).max(60),
          visibleToTeen: z.boolean(),
        }),
      )
      .min(1),
  }),
  params: z.object({}),
  query: z.object({}),
})

export const independenceRequestSchema = z.object({
  body: z.object({
    requestedLevel: z.coerce.number().int().min(2).max(4),
  }),
  params: z.object({}),
  query: z.object({}),
})

export const independenceDecisionSchema = z.object({
  body: z.object({ decision: z.enum(['approved', 'declined']) }),
  params: z.object({}),
  query: z.object({}),
})

export const transactionCreateSchema = z.object({
  body: z.object({
    amount: money.refine((value) => value > 0, 'Amount must be greater than zero'),
    type: z.enum(['income', 'expense', 'commitment', 'saving']),
    category: z.string().trim().min(1).max(60),
    merchant: z.string().trim().max(120).optional(),
    description: z.string().trim().max(240).optional(),
    date: z.coerce.date().optional(),
    teenId: mongoId.optional(),
  }),
  params: z.object({}),
  query: z.object({}),
})

export const responsibilityCreateSchema = z.object({
  body: z.object({
    teenId: mongoId,
    name: z.string().trim().min(1).max(100),
    category: z.string().trim().min(1).max(60),
    amount: money.refine((value) => value > 0, 'Amount must be greater than zero'),
    frequency: z.enum(['weekly', 'fortnightly', 'monthly', 'once']),
    dueDate: z.coerce.date(),
    assignedAtIndependenceLevel: z.coerce.number().int().min(1).max(4).default(1),
    consequence: z.string().trim().max(280).optional(),
  }),
  params: z.object({}),
  query: z.object({}),
})

export const responsibilityUpdateSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(100).optional(),
      category: z.string().trim().min(1).max(60).optional(),
      amount: money.optional(),
      dueDate: z.coerce.date().optional(),
      status: z.enum(['upcoming', 'paid', 'overdue']).optional(),
      consequence: z.string().trim().max(280).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, 'No changes supplied'),
  params: z.object({ id: mongoId }),
  query: z.object({}),
})

export const goalCreateSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100),
    targetAmount: money.refine((value) => value > 0, 'Target must be greater than zero'),
    currentAmount: money.default(0),
    weeklyContribution: money.default(0),
    targetDate: z.coerce.date().optional(),
  }),
  params: z.object({}),
  query: z.object({}),
})

export const goalUpdateSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(1).max(100).optional(),
      targetAmount: money.optional(),
      currentAmount: money.optional(),
      weeklyContribution: money.optional(),
      targetDate: z.coerce.date().nullable().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, 'No changes supplied'),
  params: z.object({ id: mongoId }),
  query: z.object({}),
})

export const simulationSchema = z.object({
  body: z.object({
    purchaseAmount: money.refine((value) => value > 0, 'Purchase must be greater than zero'),
    category: z.string().trim().max(60).optional(),
    paymentMethod: z
      .enum(['money-now', 'wait', 'save-first', 'family-advance'])
      .default('money-now'),
  }),
  params: z.object({}),
  query: z.object({}),
})

export const advanceRequestSchema = z.object({
  body: z.object({
    itemName: z.string().trim().min(1).max(120),
    amount: money.refine((value) => value > 0, 'Amount must be greater than zero'),
    installmentCount: z.coerce.number().int().min(2).max(12).default(4),
  }),
  params: z.object({}),
  query: z.object({}),
})

export const resourceIdSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({ id: mongoId }),
  query: z.object({}),
})

export const promptUpdateSchema = z.object({
  body: z.object({ status: z.enum(['discussed', 'dismissed']) }),
  params: z.object({ id: mongoId }),
  query: z.object({}),
})

export const aiChatSchema = z.object({
  body: z.object({
    question: z.string().trim().min(2).max(600),
  }),
  params: z.object({}),
  query: z.object({}),
})

export const lifeModeCoachingSchema = z.object({
  body: z.object({
    week: z.record(z.string(), z.any()),
  }),
  params: z.object({}),
  query: z.object({}),
})
