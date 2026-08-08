import { Router } from 'express'
import { createGoal, listGoals, updateGoal } from '../controllers/goalController.js'
import { requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { goalCreateSchema, goalUpdateSchema } from '../validation/schemas.js'

export const goalRouter = Router()

goalRouter.get('/', asyncHandler(listGoals))
goalRouter.post(
  '/',
  requireRole('teen'),
  validate(goalCreateSchema),
  asyncHandler(createGoal),
)
goalRouter.patch(
  '/:id',
  requireRole('teen'),
  validate(goalUpdateSchema),
  asyncHandler(updateGoal),
)
