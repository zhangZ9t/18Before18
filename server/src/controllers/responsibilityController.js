import { Responsibility } from '../models/Responsibility.js'
import { User } from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import { sendSuccess } from '../utils/http.js'

export async function listResponsibilities(request, response) {
  const query =
    request.user.role === 'teen'
      ? { teenId: request.user.id }
      : { householdId: request.user.householdId }
  const responsibilities = await Responsibility.find(query).sort({ dueDate: 1 })
  return sendSuccess(response, { responsibilities })
}

export async function createResponsibility(request, response) {
  const teen = await User.findOne({
    _id: request.validated.body.teenId,
    householdId: request.user.householdId,
    role: 'teen',
  })

  if (!teen) {
    throw new AppError('Teen not found in this household', 404, 'TEEN_NOT_FOUND')
  }

  const responsibility = await Responsibility.create({
    ...request.validated.body,
    householdId: request.user.householdId,
  })

  return sendSuccess(response, { responsibility }, 201)
}

export async function updateResponsibility(request, response) {
  const responsibility = await Responsibility.findOne({
    _id: request.validated.params.id,
    householdId: request.user.householdId,
  })

  if (!responsibility) {
    throw new AppError('Responsibility not found', 404, 'RESPONSIBILITY_NOT_FOUND')
  }

  if (request.user.role === 'teen') {
    const keys = Object.keys(request.validated.body)
    const canUpdateStatus =
      responsibility.teenId.toString() === request.user.id &&
      keys.length === 1 &&
      keys[0] === 'status'

    if (!canUpdateStatus) {
      throw new AppError(
        'Teens can only update the status of their own responsibility',
        403,
        'FORBIDDEN',
      )
    }
  }

  Object.assign(responsibility, request.validated.body)
  await responsibility.save()
  return sendSuccess(response, { responsibility })
}
