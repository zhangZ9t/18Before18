const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100
const numberOrZero = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0)

export function calculateSafeToSpend({
  balance,
  upcomingBills = 0,
  activeAdvancePayments = 0,
  savingsCommitment = 0,
}) {
  return roundMoney(
    numberOrZero(balance) -
      numberOrZero(upcomingBills) -
      numberOrZero(activeAdvancePayments) -
      numberOrZero(savingsCommitment),
  )
}

export function calculateGoalProjection({
  targetAmount,
  currentAmount,
  weeklyContribution,
  simulatedSpend = 0,
  fromDate = new Date(),
}) {
  const remaining = Math.max(
    0,
    numberOrZero(targetAmount) - numberOrZero(currentAmount),
  )
  const weekly = numberOrZero(weeklyContribution)
  const baseWeeks = weekly > 0 ? Math.ceil(remaining / weekly) : null
  const delayWeeks =
    weekly > 0 ? Math.ceil(Math.max(0, numberOrZero(simulatedSpend)) / weekly) : null
  const estimatedWeeks = baseWeeks === null ? null : baseWeeks + delayWeeks
  const estimatedDate = estimatedWeeks === null ? null : new Date(fromDate)

  if (estimatedDate) {
    estimatedDate.setDate(estimatedDate.getDate() + estimatedWeeks * 7)
  }

  return {
    remaining: roundMoney(remaining),
    estimatedWeeks,
    estimatedDate,
    delayWeeks,
    isEstimate: true,
  }
}

export function calculateAdvanceImpact({
  amount,
  installmentCount,
  weeklySafeToSpend,
}) {
  const safeAmount = Math.max(0, numberOrZero(amount))
  const safeCount = Math.max(1, Math.trunc(numberOrZero(installmentCount)))
  const installmentAmount = roundMoney(safeAmount / safeCount)

  return {
    installmentAmount,
    installmentCount: safeCount,
    totalCommitted: safeAmount,
    weeklyProjection: Array.from({ length: safeCount }, (_, index) => ({
      week: index + 1,
      installment: installmentAmount,
      safeToSpend: roundMoney(numberOrZero(weeklySafeToSpend) - installmentAmount),
    })),
  }
}

export function calculateHabitScore({
  savingConsistency = 0,
  billsPaidOnTime = 0,
  planning = 0,
  goalProgress = 0,
  learningActivity = 0,
}) {
  const clamp = (value) => Math.min(1, Math.max(0, numberOrZero(value)))
  const breakdown = {
    savingConsistency: Math.round(clamp(savingConsistency) * 20),
    bills: Math.round(clamp(billsPaidOnTime) * 20),
    planning: Math.round(clamp(planning) * 20),
    goalProgress: Math.round(clamp(goalProgress) * 20),
    learning: Math.round(clamp(learningActivity) * 20),
  }

  return {
    score: Object.values(breakdown).reduce((total, value) => total + value, 0),
    breakdown,
    label: 'Financial Habits Score',
  }
}

export function calculateWeeklySummary(transactions = []) {
  return transactions.reduce(
    (summary, transaction) => {
      const amount = numberOrZero(transaction.amount)

      if (transaction.type === 'income') summary.income += amount
      if (transaction.type === 'expense') {
        summary.spending += amount
        summary.spendingByCategory[transaction.category] = roundMoney(
          (summary.spendingByCategory[transaction.category] ?? 0) + amount,
        )
      }
      if (transaction.type === 'saving') summary.savingsAdded += amount

      summary.income = roundMoney(summary.income)
      summary.spending = roundMoney(summary.spending)
      summary.savingsAdded = roundMoney(summary.savingsAdded)
      return summary
    },
    {
      income: 0,
      spending: 0,
      savingsAdded: 0,
      spendingByCategory: {},
    },
  )
}
