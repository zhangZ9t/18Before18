import { Household } from '../models/Household.js'
import {
  serializeHouseholdForParent,
  serializeHouseholdForTeen,
} from '../serializers/householdSerializer.js'
import { AppError } from '../utils/AppError.js'
import { sendSuccess } from '../utils/http.js'

export async function getHousehold(request, response) {
  const household = await Household.findById(request.user.householdId)

  if (!household) {
    throw new AppError('Household not found', 404, 'HOUSEHOLD_NOT_FOUND')
  }

  const data =
    request.user.role === 'parent'
      ? serializeHouseholdForParent(household)
      : serializeHouseholdForTeen(household)

  return sendSuccess(response, { household: data })
}

export async function updateHousehold(request, response) {
  const household = await Household.findOneAndUpdate(
    { _id: request.user.householdId, ownerId: request.user.id },
    { $set: request.validated.body },
    { returnDocument: 'after', runValidators: true },
  )

  if (!household) {
    throw new AppError('Household not found', 404, 'HOUSEHOLD_NOT_FOUND')
  }

  return sendSuccess(response, {
    household: serializeHouseholdForParent(household),
  })
}

export async function updateVisibility(request, response) {
  const household = await Household.findOne({
    _id: request.user.householdId,
    ownerId: request.user.id,
  })

  if (!household) {
    throw new AppError('Household not found', 404, 'HOUSEHOLD_NOT_FOUND')
  }

  const visibility = new Map(
    request.validated.body.categories.map(({ name, visibleToTeen }) => [
      name.toLowerCase(),
      visibleToTeen,
    ]),
  )

  household.householdCategories.forEach((category) => {
    const nextValue = visibility.get(category.name.toLowerCase())
    if (typeof nextValue === 'boolean') category.visibleToTeen = nextValue
  })

  await household.save()
  return sendSuccess(response, {
    household: serializeHouseholdForParent(household),
  })
}

export async function requestIndependence(request, response) {
  const household = await Household.findById(request.user.householdId)
  const { requestedLevel } = request.validated.body

  if (requestedLevel <= household.independenceLevel) {
    throw new AppError(
      'Request a level above your current responsibility level',
      400,
      'INVALID_LEVEL_REQUEST',
    )
  }

  if (household.independenceRequest?.status === 'pending') {
    throw new AppError(
      'A responsibility request is already waiting for a response',
      409,
      'REQUEST_PENDING',
    )
  }

  household.independenceRequest = {
    requestedBy: request.user.id,
    requestedLevel,
    status: 'pending',
    requestedAt: new Date(),
  }
  await household.save()

  return sendSuccess(response, {
    independenceRequest: {
      requestedLevel,
      status: 'pending',
    },
  })
}

export async function decideIndependence(request, response) {
  const household = await Household.findOne({
    _id: request.user.householdId,
    ownerId: request.user.id,
  })

  if (household?.independenceRequest?.status !== 'pending') {
    throw new AppError(
      'There is no responsibility request to review',
      404,
      'REQUEST_NOT_FOUND',
    )
  }

  const { decision } = request.validated.body
  household.independenceRequest.status = decision
  household.independenceRequest.resolvedAt = new Date()

  if (decision === 'approved') {
    household.independenceLevel = household.independenceRequest.requestedLevel
  }

  await household.save()
  return sendSuccess(response, {
    household: serializeHouseholdForParent(household),
  })
}
