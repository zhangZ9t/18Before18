import { Household } from '../../models/Household.js'
import { Transaction } from '../../models/Transaction.js'
import { User } from '../../models/User.js'
import { WeeklyReport } from '../../models/WeeklyReport.js'
import { calculateWeeklySummary } from '../financial/financialCalculations.js'
import { getTeenOverview } from '../overview/overviewService.js'

function mapToObject(value) {
  if (value instanceof Map) return Object.fromEntries(value)
  return value ?? {}
}

function parentReportView(report) {
  return {
    id: report.id,
    weekStart: report.weekStart,
    weekEnd: report.weekEnd,
    income: report.income,
    spendingByCategory: mapToObject(report.spendingByCategory),
    billsPaid: report.billsPaid,
    billsMissed: report.billsMissed,
    savingsAdded: report.savingsAdded,
    safeToSpendAverage: report.safeToSpendAverage,
    goalProgress: report.goalProgress,
    habits: {
      label: 'Financial Habits Score',
      score: report.habitScore,
      breakdown: mapToObject(report.scoreBreakdown),
    },
    summary: report.aiSummary,
    conversationPrompt: report.conversationPrompt,
  }
}

function teenReportView(report, household) {
  const visibleCategoryNames = new Set(
    household.householdCategories
      .filter((category) => category.visibleToTeen)
      .map((category) => category.name),
  )
  const householdSnapshot = Object.fromEntries(
    Object.entries(mapToObject(report.householdSnapshot)).filter(([category]) =>
      visibleCategoryNames.has(category),
    ),
  )

  return {
    id: report.id,
    weekStart: report.weekStart,
    weekEnd: report.weekEnd,
    income: report.income,
    ownSpendingByCategory: mapToObject(report.spendingByCategory),
    billsPaid: report.billsPaid,
    billsMissed: report.billsMissed,
    savingsAdded: report.savingsAdded,
    safeToSpendAverage: report.safeToSpendAverage,
    goalProgress: report.goalProgress,
    habits: {
      label: 'Financial Habits Score',
      score: report.habitScore,
      breakdown: mapToObject(report.scoreBreakdown),
    },
    sharedHouseholdCategories: householdSnapshot,
    summary: report.aiSummary,
  }
}

async function buildCurrentReport(user) {
  const teen =
    user.role === 'teen'
      ? user
      : await User.findOne({ householdId: user.householdId, role: 'teen' })
  const household = await Household.findById(user.householdId)

  if (!teen) return null

  const [overview, transactions] = await Promise.all([
    getTeenOverview(teen),
    Transaction.find({ userId: teen.id }).lean(),
  ])
  const summary = calculateWeeklySummary(transactions)
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  return {
    id: 'live-summary',
    householdId: household.id,
    userId: teen.id,
    weekStart,
    weekEnd,
    income: summary.income,
    spendingByCategory: summary.spendingByCategory,
    billsPaid: overview.responsibilities.filter(({ status }) => status === 'paid')
      .length,
    billsMissed: overview.responsibilities.filter(
      ({ status }) => status === 'overdue',
    ).length,
    savingsAdded: summary.savingsAdded,
    safeToSpendAverage: overview.money.safeToSpend,
    goalProgress: overview.savingsGoal?.progressPercentage ?? 0,
    habitScore: overview.habits.score,
    scoreBreakdown: overview.habits.breakdown,
    aiSummary:
      'This summary focuses on choices and follow-through, not the amount of money your family has.',
    conversationPrompt:
      'Which money decision this week would you make the same way again?',
    householdSnapshot: Object.fromEntries(
      household.householdCategories.map(({ name, weeklyBudget }) => [
        name,
        weeklyBudget,
      ]),
    ),
  }
}

export async function getCurrentReport(user) {
  const teenId =
    user.role === 'teen'
      ? user.id
      : (
          await User.findOne({ householdId: user.householdId, role: 'teen' })
        )?.id
  const household = await Household.findById(user.householdId)
  const report = teenId
    ? await WeeklyReport.findOne({
        householdId: user.householdId,
        userId: teenId,
      }).sort({ weekStart: -1 })
    : null
  const current = report ?? (await buildCurrentReport(user))

  if (!current) return null
  return user.role === 'parent'
    ? parentReportView(current)
    : teenReportView(current, household)
}

export async function getReportHistory(user) {
  const teenId =
    user.role === 'teen'
      ? user.id
      : (
          await User.findOne({ householdId: user.householdId, role: 'teen' })
        )?.id
  if (!teenId) return []

  const [household, reports] = await Promise.all([
    Household.findById(user.householdId),
    WeeklyReport.find({
      householdId: user.householdId,
      userId: teenId,
    }).sort({ weekStart: -1 }),
  ])

  return reports.map((report) =>
    user.role === 'parent'
      ? parentReportView(report)
      : teenReportView(report, household),
  )
}
