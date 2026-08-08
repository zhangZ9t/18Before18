import { rateLimit } from 'express-rate-limit'
import { env } from '../config/env.js'

const sharedOptions = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
}

export const authLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication attempts. Please try again shortly.',
    },
  },
})

export const aiLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60 * 1000,
  limit: 20,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'The coach needs a moment. Please try again shortly.',
    },
  },
})
