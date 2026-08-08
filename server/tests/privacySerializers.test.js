import { describe, expect, it } from 'vitest'
import {
  serializeParentCategorySpending,
  serializeTeenTransaction,
} from '../src/serializers/transactionSerializer.js'

describe('transaction privacy serializers', () => {
  const transactions = [
    {
      _id: 'transaction-1',
      amount: 18.5,
      type: 'expense',
      category: 'Food',
      merchant: "McDonald's",
      description: 'Lunch',
      date: new Date('2026-08-08'),
      source: 'mock',
    },
    {
      _id: 'transaction-2',
      amount: 11.5,
      type: 'expense',
      category: 'Food',
      merchant: 'Local Dairy',
      description: 'Snack',
      date: new Date('2026-08-07'),
      source: 'mock',
    },
  ]

  it('allows a teen to see merchant-level detail for their own transaction', () => {
    expect(serializeTeenTransaction(transactions[0]).merchant).toBe("McDonald's")
  })

  it('returns only category totals to a parent', () => {
    const result = serializeParentCategorySpending(transactions)
    expect(result).toEqual([{ category: 'Food', amount: 30 }])
    expect(JSON.stringify(result)).not.toContain("McDonald's")
    expect(JSON.stringify(result)).not.toContain('Local Dairy')
  })
})
