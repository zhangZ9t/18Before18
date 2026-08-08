const asPlainObject = (transaction) =>
  typeof transaction.toObject === 'function'
    ? transaction.toObject()
    : transaction

export function serializeTeenTransaction(transaction) {
  const value = asPlainObject(transaction)

  return {
    id: value._id?.toString() ?? value.id,
    amount: value.amount,
    type: value.type,
    category: value.category,
    merchant: value.merchant ?? null,
    description: value.description ?? null,
    date: value.date,
    source: value.source,
  }
}

export function serializeParentCategorySpending(transactions) {
  const categoryTotals = transactions.reduce((totals, transaction) => {
    const value = asPlainObject(transaction)
    if (value.type !== 'expense') return totals

    totals[value.category] =
      Math.round(((totals[value.category] ?? 0) + value.amount) * 100) / 100
    return totals
  }, {})

  return Object.entries(categoryTotals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((left, right) => right.amount - left.amount)
}
