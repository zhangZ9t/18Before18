import { Router } from 'express'
import {
  createTransaction,
  listTransactions,
} from '../controllers/transactionController.js'
import { validate } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { transactionCreateSchema } from '../validation/schemas.js'

export const transactionRouter = Router()

transactionRouter.get('/', asyncHandler(listTransactions))
transactionRouter.post(
  '/',
  validate(transactionCreateSchema),
  asyncHandler(createTransaction),
)
