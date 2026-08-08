import { Router } from 'express'
import { purchaseSimulation } from '../controllers/simulationController.js'
import { requireRole } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { simulationSchema } from '../validation/schemas.js'

export const simulationRouter = Router()

simulationRouter.post(
  '/purchase',
  requireRole('teen'),
  validate(simulationSchema),
  asyncHandler(purchaseSimulation),
)
