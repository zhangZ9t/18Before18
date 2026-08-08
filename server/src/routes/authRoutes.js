import { Router } from 'express'
import {
  login,
  logout,
  me,
  registerParent,
  registerTeen,
} from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimits.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  loginSchema,
  parentRegistrationSchema,
  teenRegistrationSchema,
} from '../validation/schemas.js'

export const authRouter = Router()

authRouter.post(
  '/register/parent',
  authLimiter,
  validate(parentRegistrationSchema),
  asyncHandler(registerParent),
)
authRouter.post(
  '/register/teen',
  authLimiter,
  validate(teenRegistrationSchema),
  asyncHandler(registerTeen),
)
authRouter.post('/login', authLimiter, validate(loginSchema), asyncHandler(login))
authRouter.post('/logout', logout)
authRouter.get('/me', requireAuth, me)
