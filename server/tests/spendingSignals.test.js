import { describe, expect, it } from 'vitest'
import {
  detectSpendingSignals,
  signalKeyOf,
} from '../src/services/insights/spendingSignals.js'
import { describeSignal } from '../src/services/insights/conversationPromptService.js'

const NOW = new Date('2026-08-09T18:00:00.000Z')
const daysAgo = (days) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000)

// The teen transaction history from the dashboard, oldest last.
const history = [
  { amount: 80, type: 'expense', category: 'Entertainment', date: daysAgo(0) },
  { amount: 80, type: 'expense', category: 'Entertainment', date: daysAgo(0) },
  { amount: 22, type: 'expense', category: 'Food', date: daysAgo(2) },
  { amount: 20, type: 'saving', category: 'Savings', date: daysAgo(3) },
  { amount: 42, type: 'expense', category: 'Entertainment', date: daysAgo(3) },
  { amount: 18, type: 'expense', category: 'Transport', date: daysAgo(4) },
  { amount: 12, type: 'expense', category: 'Subscriptions', date: daysAgo(6) },
  { amount: 13, type: 'expense', category: 'Food', date: daysAgo(7) },
  { amount: 13, type: 'expense', category: 'Other', date: daysAgo(8) },
  { amount: 300, type: 'income', category: 'Income', date: daysAgo(9) },
]

const detect = (transactions) => detectSpendingSignals(transactions, { now: NOW })

describe('spending signal detection', () => {
  it('ranks a dominant category first and excludes savings from the split', () => {
    const { current, signals } = detect(history)

    // 202 Entertainment + 35 Food + 18 Transport + 12 Subscriptions + 13 Other; the $20 saving is not spending.
    expect(current.total).toBe(280)
    expect(current.savings).toBe(20)
    expect(current.income).toBe(300)
    expect(current.categories[0]).toEqual({
      category: 'Entertainment',
      amount: 202,
      count: 3,
      share: 72,
    })

    const [top] = signals
    expect(top.type).toBe('category_dominant')
    expect(top.category).toBe('Entertainment')
    expect(top.evidence).toMatchObject({ amount: 202, share: 72, transactionCount: 3, isHeavy: true })
    expect(top.key).toBe('category_dominant:Entertainment')
    expect(signalKeyOf(top)).toBe(top.key)
  })

  it('always offers a lower-ranked alternative to fall back to', () => {
    const { signals } = detect(history)

    expect(signals.length).toBeGreaterThan(1)
    expect(signals.at(-1).type).toBe('steady')
    expect(signals.map((signal) => signal.priority)).toEqual(
      [...signals.map((signal) => signal.priority)].sort((left, right) => right - left),
    )
  })

  it('reports steady spending when no category dominates', () => {
    const balanced = [
      { amount: 30, type: 'expense', category: 'Food', date: daysAgo(1) },
      { amount: 28, type: 'expense', category: 'Transport', date: daysAgo(2) },
      { amount: 25, type: 'expense', category: 'Entertainment', date: daysAgo(3) },
      { amount: 22, type: 'expense', category: 'Other', date: daysAgo(4) },
      { amount: 20, type: 'saving', category: 'Savings', date: daysAgo(5) },
    ]

    const types = detect(balanced).signals.map((signal) => signal.type)
    expect(types).not.toContain('category_dominant')
    expect(types).not.toContain('savings_paused')
    expect(types[types.length - 1]).toBe('steady')
  })

  it('detects a surge against the previous window', () => {
    const surging = [
      { amount: 60, type: 'expense', category: 'Food', date: daysAgo(2) },
      { amount: 55, type: 'expense', category: 'Transport', date: daysAgo(3) },
      { amount: 12, type: 'expense', category: 'Food', date: daysAgo(40) },
      { amount: 50, type: 'expense', category: 'Transport', date: daysAgo(41) },
    ]

    const surge = detect(surging).signals.find((signal) => signal.type === 'category_surge')
    expect(surge).toMatchObject({
      category: 'Food',
      evidence: { amount: 60, previousAmount: 12, multiplier: 5 },
    })
  })

  it('flags a paused savings habit and an empty window', () => {
    const noSaving = history.filter((transaction) => transaction.type !== 'saving')
    expect(detect(noSaving).signals.map((signal) => signal.type)).toContain('savings_paused')

    const quiet = detect([{ amount: 40, type: 'expense', category: 'Food', date: daysAgo(120) }])
    expect(quiet.signals).toHaveLength(1)
    expect(quiet.signals[0].type).toBe('no_activity')
  })

  it('phrases every signal with its own numbers and no markdown', () => {
    for (const signal of detect(history).signals) {
      const copy = describeSignal(signal, 'Alex')

      expect(copy.insight.length).toBeGreaterThan(10)
      expect(copy.suggestedQuestion.endsWith('?')).toBe(true)
      expect(copy.insight).not.toMatch(/[*_`#]|undefined|NaN/)
    }

    expect(describeSignal(detect(history).signals[0], 'Alex').insight).toBe(
      'Entertainment took 72% of what Alex spent in the last 30 days: $202 across 3 purchases.',
    )
  })
})
