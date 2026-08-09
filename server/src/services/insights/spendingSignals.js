const DAY_MS = 24 * 60 * 60 * 1000

export const SIGNAL_WINDOW_DAYS = 30

// Tuned so a demo household with a handful of transactions still produces one honest signal.
export const SIGNAL_THRESHOLDS = {
  dominantShare: 40,
  heavyShare: 60,
  surgeMultiplier: 2,
  surgeMinimumAmount: 20,
  largePurchaseShare: 35,
  subscriptionShare: 15,
  minimumWindowSpend: 15,
  minimumTransactions: 3,
}

const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100
const percentage = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0)
const toDate = (value) => (value instanceof Date ? value : new Date(value))
// Buckets keep a prompt stable while a pattern only drifts a little.
const bucketOf = (value) => Math.round(value / 10) * 10

// Savings contributions are money kept, not money spent, so they never count towards dominance.
const isSavings = (transaction) =>
  transaction.type === 'saving' || transaction.category === 'Savings'
const isSpending = (transaction) =>
  transaction.type === 'expense' && !isSavings(transaction)

const sumAmount = (transactions) =>
  roundMoney(transactions.reduce((total, transaction) => total + transaction.amount, 0))

function summariseWindow(transactions) {
  const spending = transactions.filter(isSpending)
  const total = sumAmount(spending)
  const totals = new Map()

  for (const transaction of spending) {
    const entry = totals.get(transaction.category) ?? { amount: 0, count: 0 }
    totals.set(transaction.category, {
      amount: roundMoney(entry.amount + transaction.amount),
      count: entry.count + 1,
    })
  }

  const largest = spending.reduce(
    (biggest, transaction) =>
      !biggest || transaction.amount > biggest.amount ? transaction : biggest,
    null,
  )

  return {
    total,
    transactionCount: spending.length,
    income: sumAmount(transactions.filter((transaction) => transaction.type === 'income')),
    savings: sumAmount(transactions.filter(isSavings)),
    categories: [...totals.entries()]
      .map(([category, { amount, count }]) => ({
        category,
        amount,
        count,
        share: percentage(amount, total),
      }))
      .sort((left, right) => right.amount - left.amount),
    // Category and amount only: merchant detail never leaves the teen's own view.
    largest: largest ? { amount: largest.amount, category: largest.category } : null,
  }
}

export function signalKeyOf(signal) {
  return `${signal.type}:${signal.category ?? 'all'}`
}

/**
 * Reads real transactions and reports every pattern worth a conversation, ranked.
 * Deterministic and model-free: the wording layer only phrases what this returns.
 */
export function detectSpendingSignals(
  transactions = [],
  { now = new Date(), windowDays = SIGNAL_WINDOW_DAYS } = {},
) {
  const end = toDate(now)
  const start = new Date(end.getTime() - windowDays * DAY_MS)
  const previousStart = new Date(start.getTime() - windowDays * DAY_MS)
  const dated = transactions.map((transaction) => {
    const value =
      typeof transaction.toObject === 'function' ? transaction.toObject() : transaction
    return { ...value, date: toDate(value.date) }
  })

  const current = summariseWindow(
    dated.filter((transaction) => transaction.date > start && transaction.date <= end),
  )
  const previous = summariseWindow(
    dated.filter(
      (transaction) => transaction.date > previousStart && transaction.date <= start,
    ),
  )

  const {
    dominantShare,
    heavyShare,
    surgeMultiplier,
    surgeMinimumAmount,
    largePurchaseShare,
    subscriptionShare,
    minimumWindowSpend,
    minimumTransactions,
  } = SIGNAL_THRESHOLDS
  const signals = []
  const [top] = current.categories
  const hasSpend = current.total >= minimumWindowSpend

  if (top && hasSpend && current.categories.length > 1 && top.share >= dominantShare) {
    signals.push({
      type: 'category_dominant',
      category: top.category,
      bucket: bucketOf(top.share),
      priority: 100 + top.share,
      evidence: {
        amount: top.amount,
        share: top.share,
        transactionCount: top.count,
        windowSpend: current.total,
        categoryCount: current.categories.length,
        isHeavy: top.share >= heavyShare,
        windowDays,
      },
    })
  }

  const [surge] = current.categories
    .map((category) => ({
      category,
      previousAmount:
        previous.categories.find((entry) => entry.category === category.category)?.amount ?? 0,
    }))
    .filter(
      ({ category, previousAmount }) =>
        category.amount >= surgeMinimumAmount &&
        (previousAmount === 0
          ? category.amount >= surgeMinimumAmount * 2
          : category.amount >= previousAmount * surgeMultiplier),
    )
    .sort((left, right) => right.category.amount - left.category.amount)

  if (surge && previous.transactionCount > 0) {
    signals.push({
      type: 'category_surge',
      category: surge.category.category,
      bucket: bucketOf(surge.category.share),
      priority: 88,
      evidence: {
        amount: surge.category.amount,
        previousAmount: surge.previousAmount,
        share: surge.category.share,
        multiplier:
          surge.previousAmount > 0
            ? Math.round((surge.category.amount / surge.previousAmount) * 10) / 10
            : null,
        windowDays,
      },
    })
  }

  if (current.income > 0 && current.total > current.income) {
    signals.push({
      type: 'outspent_income',
      category: null,
      bucket: bucketOf(percentage(current.total, current.income)),
      priority: 85,
      evidence: { windowSpend: current.total, income: current.income, windowDays },
    })
  }

  if (hasSpend && current.savings === 0) {
    signals.push({
      type: 'savings_paused',
      category: null,
      bucket: 0,
      priority: 78,
      evidence: { windowSpend: current.total, windowDays },
    })
  }

  if (current.largest && current.transactionCount >= minimumTransactions) {
    const share = percentage(current.largest.amount, current.total)

    if (share >= largePurchaseShare) {
      signals.push({
        type: 'single_purchase',
        category: current.largest.category,
        bucket: bucketOf(share),
        priority: 70 + share,
        evidence: {
          amount: current.largest.amount,
          share,
          windowSpend: current.total,
          windowDays,
        },
      })
    }
  }

  const subscriptions = current.categories.find(
    (category) => category.category === 'Subscriptions',
  )

  if (subscriptions && (subscriptions.count >= 2 || subscriptions.share >= subscriptionShare)) {
    signals.push({
      type: 'subscription_stack',
      category: 'Subscriptions',
      bucket: bucketOf(subscriptions.share),
      priority: 60 + subscriptions.share,
      evidence: {
        amount: subscriptions.amount,
        share: subscriptions.share,
        transactionCount: subscriptions.count,
        windowDays,
      },
    })
  }

  // Something is always worth saying, even on a quiet month.
  signals.push(
    current.transactionCount === 0
      ? {
          type: 'no_activity',
          category: null,
          bucket: 0,
          priority: 5,
          evidence: { windowDays },
        }
      : {
          type: 'steady',
          category: null,
          bucket: current.categories.length,
          priority: 10,
          evidence: {
            windowSpend: current.total,
            categoryCount: current.categories.length,
            topCategory: top?.category ?? null,
            topShare: top?.share ?? 0,
            windowDays,
          },
        },
  )

  return {
    window: { days: windowDays, start, end },
    current,
    previous: { total: previous.total, categories: previous.categories },
    signals: signals
      .sort((left, right) => right.priority - left.priority)
      .map((signal) => ({ ...signal, key: signalKeyOf(signal) })),
  }
}
