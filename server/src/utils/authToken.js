import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const AUTH_COOKIE_NAME = 'eighteen_auth'

export function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    env.JWT_SECRET,
    { expiresIn: '7d' },
  )
}

export function verifyAuthToken(token) {
  return jwt.verify(token, env.JWT_SECRET)
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  }
}
