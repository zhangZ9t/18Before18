import { Router } from 'express'
import {
  approveAdvance,
  declineAdvance,
  listAdvances,
  requestAdvance,
} from '../controllers/advanceController.js'
import { requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  advanceRequestSchema,
  resourceIdSchema,
} from '../validation/schemas.js'

export const advanceRouter = Router()

advanceRouter.get('/', asyncHandler(listAdvances))
advanceRouter.post(
  '/request',
  requireRole('teen'),
  validate(advanceRequestSchema),
  asyncHandler(requestAdvance),
)
advanceRouter.patch(
  '/:id/approve',
  requireRole('parent'),
  validate(resourceIdSchema),
  asyncHandler(approveAdvance),
)
advanceRouter.patch(
  '/:id/decline',
  requireRole('parent'),
  validate(resourceIdSchema),
  asyncHandler(declineAdvance),
)
