import { ConversationPrompt } from '../../models/ConversationPrompt.js'
import { FamilyAdvance } from '../../models/FamilyAdvance.js'
import { Household } from '../../models/Household.js'
import { Responsibility } from '../../models/Responsibility.js'
import { SavingsGoal } from '../../models/SavingsGoal.js'
import { Transaction } from '../../models/Transaction.js'
import { User } from '../../models/User.js'
import {
  serializeHouseholdForParent,
  serializeHouseholdForTeen,
} from '../../serializers/householdSerializer.js'
import { serializeParentCategorySpending } from '../../serializers/transactionSerializer.js'
import { MockBankProvider } from '../bank/MockBankProvider.js'
import {
  calculateGoalProjection,
  calculateHabitScore,
  calculateSafeToSpend,
  calculateWeeklySummary,
} from '../financial/financialCalculations.js'

const bankProvider = new MockBankProvider()

function goalView(goal) {
  if (!goal) return null

  const projection = calculateGoalProjection({
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    weeklyContribution: goal.weeklyContribution,
  })

  return {
    id: goal.id,
    name: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    weeklyContribution: goal.weeklyContribution,
    targetDate: goal.targetDate,
    progressPercentage: Math.min(
      100,
      Math.round((goal.currentAmount / goal.targetAmount) * 100),
    ),
    projection,
  }
}

function responsibilityView(responsibility) {
  return {
    id: responsibility.id,
    name: responsibility.name,
    category: responsibility.category,
    amount: responsibility.amount,
    frequency: responsibility.frequency,
    dueDate: responsibility.dueDate,
    status: responsibility.status,
    consequence:
      responsibility.consequence ||
      `If this is missed, $${responsibility.amount} of future money will already be committed.`,
  }
}

export async function getTeenOverview(teen) {
  const [household, responsibilities, goal, advances, transactions, balance] =
    await Promise.all([
      Household.findById(teen.householdId),
      Responsibility.find({ teenId: teen.id }).sort({ dueDate: 1 }),
      SavingsGoal.findOne({ teenId: teen.id, completedAt: null }).sort({
        createdAt: -1,
      }),
      FamilyAdvance.find({
        teenId: teen.id,
        status: { $in: ['active', 'approved'] },
      }).sort({ createdAt: -1 }),
      Transaction.find({ userId: teen.id }).sort({ date: -1 }),
      bankProvider.getBalance(teen.id),
    ])

  const upcomingBills = responsibilities
    .filter((responsibility) =>
      ['upcoming', 'overdue'].includes(responsibility.status),
    )
    .reduce((total, responsibility) => total + responsibility.amount, 0)
  const activeAdvancePayments = advances.reduce(
    (total, advance) => total + advance.installmentAmount,
    0,
  )
  const safeToSpend = calculateSafeToSpend({
    balance,
    upcomingBills,
    activeAdvancePayments,
    savingsCommitment: household.savingsCommitment,
  })
  const goalData = goalView(goal)
  const paidBills = responsibilities.filter(
    (responsibility) => responsibility.status === 'paid',
  ).length
  const resolvedBills = responsibilities.filter((responsibility) =>
    ['paid', 'overdue'].includes(responsibility.status),
  ).length
  const habits = calculateHabitScore({
    savingConsistency: goal?.weeklyContribution > 0 ? 0.9 : 0,
    billsPaidOnTime: resolvedBills ? paidBills / resolvedBills : 1,
    planning: safeToSpend >= 0 ? 0.75 : 0.35,
    goalProgress: goalData ? goalData.progressPercentage / 100 : 0,
    learningActivity: 0.6,
  })

  return {
    teen: {
      id: teen.id,
      name: teen.name,
    },
    household: serializeHouseholdForTeen(household),
    money: {
      balance,
      upcomingBills,
      activeAdvancePayments,
      savingsCommitment: household.savingsCommitment,
      safeToSpend,
    },
    responsibilities: responsibilities.map(responsibilityView),
    savingsGoal: goalData,
    advances: advances.map((advance) => ({
      id: advance.id,
      itemName: advance.itemName,
      amountAdvanced: advance.amountAdvanced,
      installmentAmount: advance.installmentAmount,
      installmentsRemaining: advance.installmentsRemaining,
      status: advance.status,
    })),
    weeklySummary: calculateWeeklySummary(transactions),
    habits,
  }
}

export async function getParentOverview(parent) {
  const [household, teens, prompt] = await Promise.all([
    Household.findById(parent.householdId),
    User.find({ householdId: parent.householdId, role: 'teen' }).sort({
      createdAt: 1,
    }),
    ConversationPrompt.findOne({
      householdId: parent.householdId,
      status: 'active',
    }).sort({ weekStart: -1 }),
  ])

  const teen = teens[0]

  if (!teen) {
    return {
      household: serializeHouseholdForParent(household),
      teen: null,
      emptyState: {
        title: 'Invite your teenager',
        message: 'Share the household invite code to start learning together.',
      },
    }
  }

  const [teenOverview, transactions] = await Promise.all([
    getTeenOverview(teen),
    Transaction.find({ householdId: household.id, userId: teen.id }).lean(),
  ])

  return {
    household: serializeHouseholdForParent(household),
    teen: teenOverview.teen,
    weeklyOverview: {
      weeklyDeposit: household.weeklyDeposit,
      safeToSpend: teenOverview.money.safeToSpend,
      billsPaid: teenOverview.responsibilities.filter(
        (responsibility) => responsibility.status === 'paid',
      ).length,
      billsDue: teenOverview.responsibilities.filter(
        (responsibility) => responsibility.status !== 'paid',
      ).length,
      savingsGoal: teenOverview.savingsGoal,
      independenceLevel: household.independenceLevel,
      habits: teenOverview.habits,
    },
    spendingByCategory: serializeParentCategorySpending(transactions),
    conversationPrompt: prompt
      ? {
          id: prompt.id,
          insight: prompt.insight,
          suggestedQuestion: prompt.suggestedQuestion,
          status: prompt.status,
        }
      : null,
    responsibilities: teenOverview.responsibilities,
    pendingAdvances: await FamilyAdvance.find({
      householdId: household.id,
      status: 'requested',
    }).select('-__v'),
  }
}
