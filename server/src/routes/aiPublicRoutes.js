import { Router } from 'express'
import { lifeModeCoaching } from '../controllers/aiController.js'
import { aiLimiter } from '../middleware/rateLimits.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { lifeModeCoachingSchema } from '../validation/schemas.js'

/** Demo Life Mode coaching — no login required (week facts come from the client). */
export const aiPublicRouter = Router()

aiPublicRouter.post(
  '/life-mode-coaching',
  aiLimiter,
  validate(lifeModeCoachingSchema),
  asyncHandler(lifeModeCoaching),
)
