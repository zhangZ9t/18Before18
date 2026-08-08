import { SavingsGoal } from '../models/SavingsGoal.js'
import { AppError } from '../utils/AppError.js'
import { sendSuccess } from '../utils/http.js'

export async function listGoals(request, response) {
  const query =
    request.user.role === 'teen'
      ? { teenId: request.user.id }
      : { householdId: request.user.householdId }
  const goals = await SavingsGoal.find(query).sort({ createdAt: -1 })
  return sendSuccess(response, { goals })
}

export async function createGoal(request, response) {
  const goal = await SavingsGoal.create({
    ...request.validated.body,
    teenId: request.user.id,
    householdId: request.user.householdId,
  })
  return sendSuccess(response, { goal }, 201)
}

export async function updateGoal(request, response) {
  const goal = await SavingsGoal.findOne({
    _id: request.validated.params.id,
    teenId: request.user.id,
    householdId: request.user.householdId,
  })

  if (!goal) {
    throw new AppError('Savings goal not found', 404, 'GOAL_NOT_FOUND')
  }

  Object.assign(goal, request.validated.body)
  if (goal.currentAmount >= goal.targetAmount && !goal.completedAt) {
    goal.completedAt = new Date()
  }
  await goal.save()
  return sendSuccess(response, { goal })
}
