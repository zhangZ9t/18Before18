import bcrypt from 'bcryptjs'
import { Household } from '../models/Household.js'
import { User } from '../models/User.js'
import { serializeUser } from '../serializers/userSerializer.js'
import { AppError } from '../utils/AppError.js'
import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  signAuthToken,
} from '../utils/authToken.js'
import { generateInviteCode } from '../utils/inviteCode.js'
import { sendSuccess } from '../utils/http.js'

const defaultCategories = [
  { name: 'Housing', weeklyBudget: 450, visibleToTeen: true },
  { name: 'Food', weeklyBudget: 180, visibleToTeen: true },
  { name: 'Transport', weeklyBudget: 90, visibleToTeen: true },
  { name: 'Utilities', weeklyBudget: 75, visibleToTeen: true },
  { name: 'Subscriptions', weeklyBudget: 28, visibleToTeen: false },
  { name: 'Savings', weeklyBudget: 100, visibleToTeen: true },
]

async function uniqueInviteCode() {
  let inviteCode
  let alreadyExists = true

  while (alreadyExists) {
    inviteCode = generateInviteCode()
    alreadyExists = await Household.exists({ inviteCode })
  }

  return inviteCode
}

function setAuthCookie(response, user) {
  response.cookie(AUTH_COOKIE_NAME, signAuthToken(user), authCookieOptions())
}

export async function registerParent(request, response) {
  const { name, email, password, householdName } = request.validated.body

  if (await User.exists({ email })) {
    throw new AppError('An account already uses this email', 409, 'EMAIL_IN_USE')
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const parent = await User.create({
    name,
    email,
    passwordHash,
    role: 'parent',
  })

  try {
    const household = await Household.create({
      name: householdName || `${name.split(' ').at(-1)} Family`,
      ownerId: parent.id,
      inviteCode: await uniqueInviteCode(),
      weeklyDeposit: 100,
      savingsCommitment: 20,
      independenceLevel: 1,
      householdCategories: defaultCategories,
    })

    parent.householdId = household.id
    await parent.save()
    setAuthCookie(response, parent)

    return sendSuccess(
      response,
      {
        user: serializeUser(parent),
        household: {
          id: household.id,
          name: household.name,
          inviteCode: household.inviteCode,
        },
      },
      201,
    )
  } catch (error) {
    await User.deleteOne({ _id: parent.id })
    throw error
  }
}

export async function registerTeen(request, response) {
  const { name, email, password, householdInviteCode } = request.validated.body

  if (await User.exists({ email })) {
    throw new AppError('An account already uses this email', 409, 'EMAIL_IN_USE')
  }

  const household = await Household.findOne({ inviteCode: householdInviteCode })

  if (!household) {
    throw new AppError('That household invite code is not valid', 400, 'INVALID_INVITE')
  }

  const teen = await User.create({
    name,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    role: 'teen',
    householdId: household.id,
  })

  setAuthCookie(response, teen)
  return sendSuccess(
    response,
    {
      user: serializeUser(teen),
      household: {
        id: household.id,
        name: household.name,
      },
    },
    201,
  )
}

export async function login(request, response) {
  const { email, password } = request.validated.body
  const user = await User.findOne({ email }).select('+passwordHash')

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError('Email or password is incorrect', 401, 'INVALID_CREDENTIALS')
  }

  setAuthCookie(response, user)
  return sendSuccess(response, { user: serializeUser(user) })
}

export function logout(_request, response) {
  const options = authCookieOptions()
  delete options.maxAge
  response.clearCookie(AUTH_COOKIE_NAME, options)
  return sendSuccess(response, { message: 'Logged out' })
}

export function me(request, response) {
  return sendSuccess(response, { user: serializeUser(request.user) })
}
