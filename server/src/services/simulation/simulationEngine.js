import {
  calculateGoalProjection,
  calculateSafeToSpend,
} from '../financial/financialCalculations.js'

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100

export function simulatePurchase({
  balance,
  purchase,
  bills = 0,
  savings = 0,
  advances = [],
  weeklyIncome = 0,
  goal,
}) {
  const purchaseAmount = Math.max(0, Number(purchase) || 0)
  const advancePayment = advances.reduce(
    (total, advance) => total + (Number(advance.installmentAmount) || 0),
    0,
  )
  const currentSafeToSpend = calculateSafeToSpend({
    balance,
    upcomingBills: bills,
    activeAdvancePayments: advancePayment,
    savingsCommitment: savings,
  })
  const newBalance = roundMoney((Number(balance) || 0) - purchaseAmount)
  const newSafeToSpend = calculateSafeToSpend({
    balance: newBalance,
    upcomingBills: bills,
    activeAdvancePayments: advancePayment,
    savingsCommitment: savings,
  })
  const goalProjection = goal
    ? calculateGoalProjection({
        ...goal,
        simulatedSpend: purchaseAmount,
      })
    : null
  const riskFlags = []

  if (newSafeToSpend < 0) riskFlags.push('COMMITMENTS_EXCEED_BALANCE')
  if (purchaseAmount > Math.max(0, currentSafeToSpend)) {
    riskFlags.push('USES_COMMITTED_MONEY')
  }
  if (currentSafeToSpend > 0 && purchaseAmount >= currentSafeToSpend * 0.6) {
    riskFlags.push('HIGH_FLEXIBLE_SPEND')
  }

  const projectionLength = Math.max(
    4,
    ...advances.map((advance) => Number(advance.installmentsRemaining) || 0),
  )
  const weeklyProjection = Array.from({ length: projectionLength }, (_, index) => {
    const activePayments = advances.reduce((total, advance) => {
      return index < (Number(advance.installmentsRemaining) || 0)
        ? total + (Number(advance.installmentAmount) || 0)
        : total
    }, 0)

    return {
      week: index + 1,
      income: roundMoney(Number(weeklyIncome) || 0),
      advancePayments: roundMoney(activePayments),
      availableAfterAdvances: roundMoney(
        (Number(weeklyIncome) || 0) - activePayments,
      ),
    }
  })

  return {
    purchaseAmount: roundMoney(purchaseAmount),
    currentSafeToSpend,
    newBalance,
    newSafeToSpend,
    billsStillDue: roundMoney(Number(bills) || 0),
    savingsProtected: roundMoney(Number(savings) || 0),
    goalDelayWeeks: goalProjection?.delayWeeks ?? null,
    futureCommitments: roundMoney(advancePayment),
    riskFlags,
    weeklyProjection,
    options: [
      { id: 'buy-now', label: 'Buy now' },
      { id: 'wait', label: "Don't buy" },
      { id: 'save-first', label: 'Save first' },
      { id: 'family-advance', label: 'Family Advance' },
    ],
    isEstimate: true,
  }
}
