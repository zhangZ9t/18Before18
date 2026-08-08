import { Router } from 'express'
import { chat, insight } from '../controllers/aiController.js'
import { aiLimiter } from '../middleware/rateLimits.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { aiChatSchema } from '../validation/schemas.js'

export const aiRouter = Router()

aiRouter.post('/chat', aiLimiter, validate(aiChatSchema), asyncHandler(chat))
aiRouter.post('/insight', aiLimiter, asyncHandler(insight))
