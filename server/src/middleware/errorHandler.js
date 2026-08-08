import { env } from '../config/env.js'
import { AppError } from '../utils/AppError.js'

function normalizeError(error) {
  if (error instanceof AppError) return error

  if (error?.name === 'CastError') {
    return new AppError('Resource not found', 404, 'NOT_FOUND')
  }

  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern ?? {})[0] ?? 'value'
    return new AppError(`${field} is already in use`, 409, 'DUPLICATE_VALUE')
  }

  return new AppError('Something went wrong', 500, 'INTERNAL_ERROR')
}

export function notFoundHandler(request, _response, next) {
  next(
    new AppError(
      `Route not found: ${request.method} ${request.originalUrl}`,
      404,
      'NOT_FOUND',
    ),
  )
}

export function errorHandler(error, _request, response, _next) {
  void _next
  const normalized = normalizeError(error)

  if (env.NODE_ENV !== 'test' && normalized.statusCode >= 500) {
    console.error(error)
  }

  const payload = {
    success: false,
    error: {
      code: normalized.code,
      message: normalized.message,
    },
  }

  if (normalized.details) payload.error.details = normalized.details
  if (env.NODE_ENV === 'development' && error.stack) {
    payload.error.stack = error.stack
  }

  response.status(normalized.statusCode).json(payload)
}
