import { describe, expect, it } from 'vitest'
import {
  calculateAdvanceImpact,
  calculateGoalProjection,
  calculateHabitScore,
  calculateSafeToSpend,
  calculateWeeklySummary,
} from '../src/services/financial/financialCalculations.js'

describe('financial calculations', () => {
  it('subtracts bills, savings, and active advances from balance', () => {
    expect(
      calculateSafeToSpend({
        balance: 180,
        upcomingBills: 55,
        savingsCommitment: 30,
        activeAdvancePayments: 20,
      }),
    ).toBe(75)
  })

  it('shows negative pressure instead of hiding overspending', () => {
    expect(
      calculateSafeToSpend({
        balance: 40,
        upcomingBills: 35,
        savingsCommitment: 20,
      }),
    ).toBe(-15)
  })

  it('labels goal completion timing as an estimate and calculates delay', () => {
    const projection = calculateGoalProjection({
      targetAmount: 300,
      currentAmount: 180,
      weeklyContribution: 20,
      simulatedSpend: 25,
      fromDate: new Date('2026-08-08T00:00:00.000Z'),
    })

    expect(projection.remaining).toBe(120)
    expect(projection.delayWeeks).toBe(2)
    expect(projection.estimatedWeeks).toBe(8)
    expect(projection.isEstimate).toBe(true)
  })

  it('projects each Family Advance repayment week', () => {
    const impact = calculateAdvanceImpact({
      amount: 80,
      installmentCount: 4,
      weeklySafeToSpend: 65,
    })

    expect(impact.installmentAmount).toBe(20)
    expect(impact.weeklyProjection).toHaveLength(4)
    expect(impact.weeklyProjection[0].safeToSpend).toBe(45)
  })

  it('scores behaviour without using wealth or income', () => {
    const result = calculateHabitScore({
      savingConsistency: 0.9,
      billsPaidOnTime: 1,
      planning: 0.7,
      goalProgress: 0.8,
      learningActivity: 0.5,
    })

    expect(result.score).toBe(78)
    expect(result.label).toBe('Financial Habits Score')
    expect(result.breakdown).not.toHaveProperty('wealth')
    expect(result.breakdown).not.toHaveProperty('income')
  })

  it('summarises spending by category', () => {
    const summary = calculateWeeklySummary([
      { type: 'income', amount: 100, category: 'Income' },
      { type: 'expense', amount: 18.5, category: 'Food' },
      { type: 'expense', amount: 11.5, category: 'Food' },
      { type: 'saving', amount: 20, category: 'Savings' },
    ])

    expect(summary).toEqual({
      income: 100,
      spending: 30,
      savingsAdded: 20,
      spendingByCategory: { Food: 30 },
    })
  })
})
