import { FamilyAdvance } from '../models/FamilyAdvance.js'
import { Household } from '../models/Household.js'
import { calculateAdvanceImpact } from '../services/financial/financialCalculations.js'
import { getTeenOverview } from '../services/overview/overviewService.js'
import { AppError } from '../utils/AppError.js'
import { sendSuccess } from '../utils/http.js'

export async function listAdvances(request, response) {
  const query =
    request.user.role === 'teen'
      ? { teenId: request.user.id }
      : { householdId: request.user.householdId }
  const advances = await FamilyAdvance.find(query).sort({ createdAt: -1 })
  return sendSuccess(response, { advances })
}

export async function requestAdvance(request, response) {
  const household = await Household.findById(request.user.householdId)
  const overview = await getTeenOverview(request.user)
  const { itemName, amount, installmentCount } = request.validated.body
  const impact = calculateAdvanceImpact({
    amount,
    installmentCount,
    weeklySafeToSpend: overview.money.safeToSpend,
  })
  const advance = await FamilyAdvance.create({
    householdId: household.id,
    teenId: request.user.id,
    parentId: household.ownerId,
    itemName,
    originalAmount: amount,
    amountAdvanced: amount,
    installmentAmount: impact.installmentAmount,
    installmentCount: impact.installmentCount,
    installmentsRemaining: impact.installmentCount,
    status: 'requested',
  })

  return sendSuccess(
    response,
    {
      advance,
      impact,
      explanation:
        'A Family Advance does not make the purchase cheaper. It commits part of your future weekly money.',
    },
    201,
  )
}

async function decideAdvance(request, response, decision) {
  const advance = await FamilyAdvance.findOne({
    _id: request.validated.params.id,
    householdId: request.user.householdId,
    parentId: request.user.id,
    status: 'requested',
  })

  if (!advance) {
    throw new AppError('Advance request not found', 404, 'ADVANCE_NOT_FOUND')
  }

  advance.status = decision === 'approved' ? 'active' : 'declined'
  await advance.save()
  return sendSuccess(response, { advance })
}

export function approveAdvance(request, response) {
  return decideAdvance(request, response, 'approved')
}

export function declineAdvance(request, response) {
  return decideAdvance(request, response, 'declined')
}
