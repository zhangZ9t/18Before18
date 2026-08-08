import { Transaction } from '../models/Transaction.js'
import { User } from '../models/User.js'
import {
  serializeParentCategorySpending,
  serializeTeenTransaction,
} from '../serializers/transactionSerializer.js'
import { AppError } from '../utils/AppError.js'
import { sendSuccess } from '../utils/http.js'

export async function listTransactions(request, response) {
  if (request.user.role === 'parent') {
    const transactions = await Transaction.find({
      householdId: request.user.householdId,
      type: 'expense',
    }).lean()

    return sendSuccess(response, {
      view: 'category-only',
      categories: serializeParentCategorySpending(transactions),
    })
  }

  const transactions = await Transaction.find({ userId: request.user.id }).sort({
    date: -1,
  })

  return sendSuccess(response, {
    view: 'personal',
    transactions: transactions.map(serializeTeenTransaction),
  })
}

export async function createTransaction(request, response) {
  const { teenId, ...input } = request.validated.body
  let userId = request.user.id

  if (request.user.role === 'parent') {
    if (!teenId) {
      throw new AppError('Choose a teen for this transaction', 400, 'TEEN_REQUIRED')
    }

    const teen = await User.findOne({
      _id: teenId,
      householdId: request.user.householdId,
      role: 'teen',
    })

    if (!teen) {
      throw new AppError('Teen not found in this household', 404, 'TEEN_NOT_FOUND')
    }
    userId = teen.id
  }

  const transaction = await Transaction.create({
    ...input,
    userId,
    householdId: request.user.householdId,
    source: 'manual',
  })

  return sendSuccess(
    response,
    { transaction: serializeTeenTransaction(transaction) },
    201,
  )
}
