import { Router } from 'express'
import {
  decideIndependence,
  getHousehold,
  requestIndependence,
  updateHousehold,
  updateVisibility,
} from '../controllers/householdController.js'
import { requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  householdUpdateSchema,
  independenceDecisionSchema,
  independenceRequestSchema,
  visibilityUpdateSchema,
} from '../validation/schemas.js'

export const householdRouter = Router()

householdRouter.get('/', asyncHandler(getHousehold))
householdRouter.patch(
  '/',
  requireRole('parent'),
  validate(householdUpdateSchema),
  asyncHandler(updateHousehold),
)
householdRouter.patch(
  '/visibility',
  requireRole('parent'),
  validate(visibilityUpdateSchema),
  asyncHandler(updateVisibility),
)
householdRouter.post(
  '/independence/request',
  requireRole('teen'),
  validate(independenceRequestSchema),
  asyncHandler(requestIndependence),
)
householdRouter.patch(
  '/independence/decision',
  requireRole('parent'),
  validate(independenceDecisionSchema),
  asyncHandler(decideIndependence),
)
