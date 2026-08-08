import { Router } from 'express'
import {
  createResponsibility,
  listResponsibilities,
  updateResponsibility,
} from '../controllers/responsibilityController.js'
import { requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  responsibilityCreateSchema,
  responsibilityUpdateSchema,
} from '../validation/schemas.js'

export const responsibilityRouter = Router()

responsibilityRouter.get('/', asyncHandler(listResponsibilities))
responsibilityRouter.post(
  '/',
  requireRole('parent'),
  validate(responsibilityCreateSchema),
  asyncHandler(createResponsibility),
)
responsibilityRouter.patch(
  '/:id',
  validate(responsibilityUpdateSchema),
  asyncHandler(updateResponsibility),
)
