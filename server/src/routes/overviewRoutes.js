import { Router } from 'express'
import {
  parentOverview,
  teenOverview,
} from '../controllers/overviewController.js'
import { requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const overviewRouter = Router()

overviewRouter.get(
  '/parent/overview',
  requireRole('parent'),
  asyncHandler(parentOverview),
)
overviewRouter.get(
  '/teen/overview',
  requireRole('teen'),
  asyncHandler(teenOverview),
)
