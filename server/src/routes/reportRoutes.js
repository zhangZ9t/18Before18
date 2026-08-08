import { Router } from 'express'
import {
  currentReport,
  reportHistory,
} from '../controllers/reportController.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const reportRouter = Router()

reportRouter.get('/current', asyncHandler(currentReport))
reportRouter.get('/history', asyncHandler(reportHistory))
