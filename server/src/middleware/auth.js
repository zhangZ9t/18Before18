import { User } from '../models/User.js'
import { AppError } from '../utils/AppError.js'
import { AUTH_COOKIE_NAME, verifyAuthToken } from '../utils/authToken.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const requireAuth = asyncHandler(async (request, _response, next) => {
  const token = request.cookies?.[AUTH_COOKIE_NAME]

  if (!token) {
    throw new AppError('Authentication required', 401, 'AUTH_REQUIRED')
  }

  let decoded
  try {
    decoded = verifyAuthToken(token)
  } catch {
    throw new AppError('Your session is invalid or expired', 401, 'INVALID_SESSION')
  }

  const user = await User.findById(decoded.sub)

  if (!user) {
    throw new AppError('User account no longer exists', 401, 'INVALID_SESSION')
  }

  request.user = user
  next()
})

export const requireRole = (...roles) => (request, _response, next) => {
  if (!request.user || !roles.includes(request.user.role)) {
    return next(
      new AppError('You do not have permission for this action', 403, 'FORBIDDEN'),
    )
  }

  return next()
}

export function requireHouseholdAccess(request, _response, next) {
  if (!request.user?.householdId) {
    return next(
      new AppError('Household membership required', 403, 'HOUSEHOLD_REQUIRED'),
    )
  }

  return next()
}
