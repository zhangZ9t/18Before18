import { describe, expect, it } from 'vitest'
import { simulatePurchase } from '../src/services/simulation/simulationEngine.js'

describe('purchase simulation', () => {
  it('returns future impact without mutating the input', () => {
    const input = {
      balance: 180,
      purchase: 80,
      bills: 55,
      savings: 30,
      advances: [
        {
          installmentAmount: 20,
          installmentsRemaining: 2,
        },
      ],
      weeklyIncome: 100,
      goal: {
        targetAmount: 300,
        currentAmount: 180,
        weeklyContribution: 20,
      },
    }
    const original = structuredClone(input)
    const result = simulatePurchase(input)

    expect(input).toEqual(original)
    expect(result.currentSafeToSpend).toBe(75)
    expect(result.newBalance).toBe(100)
    expect(result.newSafeToSpend).toBe(-5)
    expect(result.goalDelayWeeks).toBe(4)
    expect(result.riskFlags).toContain('USES_COMMITTED_MONEY')
    expect(result.weeklyProjection[0].availableAfterAdvances).toBe(80)
    expect(result.weeklyProjection[2].availableAfterAdvances).toBe(100)
  })
})
