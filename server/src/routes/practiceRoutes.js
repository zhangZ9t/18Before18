import { Router } from 'express'
import { listPracticeScenarios } from '../controllers/practiceController.js'
import { requireRole } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const practiceRouter = Router()

practiceRouter.get(
  '/',
  requireRole('teen'),
  asyncHandler(listPracticeScenarios),
)
