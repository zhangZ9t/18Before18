import { AppError } from '../utils/AppError.js'

function formatIssues(error) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

export const validate = (schema) => (request, _response, next) => {
  const result = schema.safeParse({
    body: request.body,
    params: request.params,
    query: request.query,
  })

  if (!result.success) {
    return next(
      new AppError(
        'Invalid request',
        400,
        'VALIDATION_ERROR',
        formatIssues(result.error),
      ),
    )
  }

  request.validated = result.data
  return next()
}
