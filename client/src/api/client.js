const API_PREFIX = '/api'

export class ApiError extends Error {
  constructor(message, status, code, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function apiRequest(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_PREFIX}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })
  } catch {
    throw new ApiError(
      'Could not reach the API. Make sure the server is running.',
      0,
      'NETWORK_ERROR',
    )
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new ApiError(
      response.status >= 500
        ? 'The API is unavailable. Check that the server and MongoDB are running.'
        : 'The API returned an unexpected response.',
      response.status,
      'INVALID_API_RESPONSE',
    )
  }

  if (!response.ok || !payload.success) {
    throw new ApiError(
      payload.error?.message || 'Request failed',
      response.status,
      payload.error?.code,
      payload.error?.details,
    )
  }

  return payload.data
}

export const api = {
  get: (path) => apiRequest(path),
  post: (path, body = {}) =>
    apiRequest(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body = {}) =>
    apiRequest(path, { method: 'PATCH', body: JSON.stringify(body) }),
}
