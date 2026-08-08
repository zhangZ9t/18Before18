import { Router } from 'express'
import { listPrompts, updatePrompt } from '../controllers/promptController.js'
import { requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { promptUpdateSchema } from '../validation/schemas.js'

export const promptRouter = Router()

promptRouter.get('/', requireRole('parent'), asyncHandler(listPrompts))
promptRouter.patch(
  '/:id',
  requireRole('parent'),
  validate(promptUpdateSchema),
  asyncHandler(updatePrompt),
)
