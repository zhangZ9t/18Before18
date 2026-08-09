const STORAGE_KEY = '18b18-life-mode-v3'

export const BILL_KEYS = ['rent', 'groceries', 'power', 'gas']

export const BILL_META = {
  rent: { icon: '🏠', name: 'Rent' },
  groceries: { icon: '🛒', name: 'Groceries' },
  power: { icon: '⚡', name: 'Power' },
  gas: { icon: '⛽', name: 'Gas / transport' },
}

export const RULE_FIELDS = [
  { key: 'income', label: 'Deposit', alwaysOn: true },
  { key: 'save', label: 'Savings target' },
  { key: 'rent', label: 'Rent' },
  { key: 'groceries', label: 'Groceries' },
  { key: 'power', label: 'Power' },
  { key: 'gas', label: 'Gas' },
  { key: 'loans', label: 'Allow loans', toggleOnly: true },
]

export const MERCHANTS = [
  { value: 'Uber Eats', label: 'Uber Eats · food' },
  { value: 'Countdown', label: 'Countdown · groceries' },
  { value: 'Spotify', label: 'Spotify · subscription' },
  { value: 'JB Hi-Fi', label: 'JB Hi-Fi · gear' },
  { value: 'Movie tickets', label: 'Event Cinemas · fun' },
  { value: 'Gas station', label: 'Z Energy · fuel' },
]

export const LOAN_PURPOSE_SUGGESTIONS = ['Sneakers', 'City bike', 'Headphones', 'Concert tickets', 'Phone repair']

const DEFAULT_ENABLED = {
  income: true,
  save: true,
  rent: true,
  groceries: true,
  power: true,
  gas: true,
  loans: true,
}

export function createInitialState(overrides = {}) {
  return {
    week: 1,
    phase: 'idle', // idle | active | ended
    parentName: 'Alex',
    teenName: 'Jamie',
    parentBalance: 4820,
    teenBalance: 0,
    carryDebt: 0,
    rules: {
      income: 200,
      save: 30,
      rent: 40,
      groceries: 25,
      power: 10,
      gas: 10,
    },
    enabled: { ...DEFAULT_ENABLED },
    paid: { rent: false, groceries: false, power: false, gas: false },
    funSpend: 0,
    returnedThisWeek: 0,
    activeLoan: null,
    parentTx: [],
    teenTx: [],
    weekHistory: [],
    pushes: [],
    warnedBillRisk: false,
    toast: '',
    banner: null,
    coachAlert: null,
    ...overrides,
  }
}

export function money(n) {
  const value = Math.round(Number(n) || 0)
  return `${value < 0 ? '-$' : '$'}${Math.abs(value)}`
}

export function todayLabel() {
  return new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })
}

export function isEnabled(state, key) {
  if (key === 'income') return true
  return Boolean(state.enabled?.[key])
}

export function enabledBillKeys(state) {
  return BILL_KEYS.filter((key) => isEnabled(state, key))
}

export function obligations(stateOrRules, maybeState) {
  // Support obligations(state) and legacy obligations(rules)
  const state = maybeState || (stateOrRules?.rules ? stateOrRules : null)
  const rules = state ? state.rules : stateOrRules
  const keys = state ? enabledBillKeys(state) : BILL_KEYS
  return Object.fromEntries(
    keys.map((key) => [key, Math.max(0, Number(rules[key]) || 0)]),
  )
}

export function unpaidTotal(state) {
  const obs = obligations(state)
  return Object.keys(obs).reduce((sum, key) => sum + (state.paid[key] ? 0 : obs[key]), 0)
}

export function totalBills(state) {
  return Object.values(obligations(state)).reduce((a, b) => a + b, 0)
}

export function savingsTarget(state) {
  return isEnabled(state, 'save') ? Math.max(0, Number(state.rules.save) || 0) : 0
}

export function loanRemaining(state) {
  if (!state.activeLoan) return 0
  return Math.max(0, Number(state.activeLoan.remainingBalance) || 0)
}

export function loanWeeksLeft(loan) {
  if (!loan) return 0
  const weekly = Math.max(1, Number(loan.weekly) || 1)
  const remaining = Math.max(0, Number(loan.remainingBalance) || 0)
  return Math.ceil(remaining / weekly)
}

export function safeToSpend(state) {
  return state.teenBalance - unpaidTotal(state) - savingsTarget(state)
}

function pushTx(list, tx, week) {
  return [
    {
      date: todayLabel(),
      week,
      ...tx,
    },
    ...list,
  ].slice(0, 40)
}

export function teenCoachMessage(state) {
  if (state.phase === 'idle') {
    return 'Waiting for this week’s deposit from your parent. Once it lands, pay bills before burning the free money.'
  }
  const unpaid = unpaidTotal(state)
  const safe = safeToSpend(state)
  const save = savingsTarget(state)
  if (state.activeLoan && loanRemaining(state) > 0) {
    const loan = state.activeLoan
    return `You still owe ${money(loanRemaining(state))} for “${loan.purpose}” (${money(loan.weekly)} / week · ~${loanWeeksLeft(loan)} payday${loanWeeksLeft(loan) === 1 ? '' : 's'} left). That comes out before free spending.`
  }
  if (state.phase === 'ended') {
    if (unpaid > 0) {
      return `You left ${money(unpaid)} unpaid. That comes out of next week’s deposit before you see the rest.`
    }
    return 'All bills paid. Download your weekly summary — reviewing your own week is the adult habit.'
  }
  if (safe < 0) {
    return `Balance shows ${money(state.teenBalance)}, but after bills + savings you’re effectively ${money(safe)}. Your balance is not spendable money.`
  }
  if (unpaid === 0) {
    return 'Obligations covered. Pace what’s left — don’t burn it on day one. A loan is still future money committed.'
  }
  const saveBit = save > 0 ? `, ${money(save)} savings` : ''
  return `You have ${money(state.teenBalance)} in account, ${money(unpaid)} still for bills${saveBit}. ${money(Math.max(0, safe))} genuinely free.`
}

export function weekMilestones(state) {
  const bills = enabledBillKeys(state)
  const paidCount = bills.filter((key) => state.paid[key]).length
  const billTotal = bills.length
  const billsDone = billTotal === 0 || paidCount === billTotal
  const madeChoices = state.funSpend > 0 || Boolean(state.activeLoan)
  const phase = state.phase

  const steps = [
    {
      id: 'deposit',
      label: 'Deposit',
      detail: phase === 'idle' ? 'Waiting for parent' : `Week ${state.week} landed`,
      done: phase !== 'idle',
    },
    {
      id: 'bills',
      label: billTotal ? `Bills ${paidCount}/${billTotal}` : 'Bills',
      detail:
        billTotal === 0
          ? 'None assigned'
          : billsDone
            ? 'All covered'
            : `${billTotal - paidCount} still due`,
      done: phase !== 'idle' && billsDone,
    },
    {
      id: 'choices',
      label: 'Your moves',
      detail: state.activeLoan
        ? `Loan · ${state.activeLoan.purpose}`
        : state.funSpend > 0
          ? `${money(state.funSpend)} spent`
          : phase === 'active'
            ? 'Spend or loan'
            : 'Not yet',
      done: madeChoices || phase === 'ended',
    },
    {
      id: 'close',
      label: 'Close week',
      detail:
        phase === 'ended' ? 'Review ready' : phase === 'active' ? 'End when ready' : 'After deposit',
      done: phase === 'ended',
    },
  ].map((step, index, list) => {
    const firstOpen = list.findIndex((item) => !item.done)
    return {
      ...step,
      current: firstOpen === index,
    }
  })

  const doneCount = steps.filter((step) => step.done).length
  const progress = phase === 'idle' ? 8 : Math.round((doneCount / steps.length) * 100)

  return {
    week: state.week,
    phase,
    progress: Math.min(100, progress),
    paidCount,
    billTotal,
    steps,
  }
}

export function demoFlowCopy(state, role = 'teen') {
  const teen = state.teenName.split(' ')[0]
  const parent = state.parentName.split(' ')[0]
  const milestones = weekMilestones(state)

  if (role === 'parent') {
    if (state.phase === 'idle') {
      return {
        step: '1 · Set the week',
        title: 'Start the money loop',
        body: `Toggle bills & loans, then Start week so ${teen} gets a real deposit. Switch to Teen to watch them manage it.`,
        cta: 'Switch to Teen after Start week',
        href: '/teen',
      }
    }
    if (state.phase === 'active') {
      return {
        step: `Week ${state.week} · live`,
        title: `${teen} is managing this week`,
        body: `${milestones.paidCount}/${milestones.billTotal || 0} bills paid back. Switch to Teen to spend, pay bills, or apply for a loan — then End week here or there.`,
        cta: 'Open Teen view',
        href: '/teen',
      }
    }
    return {
      step: `Week ${state.week} · closed`,
      title: 'Read the coaching alert',
      body: 'Use What / Why / How with your teen, then Start week again for the next payday (debt & loans carry forward).',
      cta: 'Ready for next payday',
      href: null,
    }
  }

  if (state.phase === 'idle') {
    return {
      step: 'Waiting',
      title: `Ask ${parent} to Start week`,
      body: 'Parent sets deposit, bills, and whether loans are allowed — then hits Start week. Use the Parent / Teen switcher in the header.',
      cta: 'Open Parent view',
      href: '/parent',
    }
  }
  if (state.phase === 'active') {
    return {
      step: `Week ${state.week} · your turn`,
      title: 'Pay bills before free money',
      body: 'Card spends and loans are real in this demo. Miss a bill → next deposit arrives short. End week when you’re done.',
      cta: null,
      href: null,
    }
  }
  return {
    step: `Week ${state.week} · closed`,
    title: 'Week locked — review',
    body: `Download your summary. ${parent} gets the coaching push. Only they can start the next payday.`,
    cta: 'See parent coaching',
    href: '/parent',
  }
}

export function buildTeachingMoment(state) {
  const unpaid = unpaidTotal(state)
  const week = state.week
  const teen = state.teenName.split(' ')[0]
  const income = Number(state.rules.income) || 0
  const save = savingsTarget(state)

  if (unpaid > 0 && state.funSpend > 0) {
    return {
      id: `w${week}-missed-spend`,
      severity: 'alert',
      title: 'Worth a conversation this week',
      preview: `${teen} spent ${money(state.funSpend)} before covering ${money(unpaid)} in bills.`,
      what: `${teen} used the card for ${money(state.funSpend)} in discretionary spend and still has ${money(unpaid)} in unpaid bills. Next payday will arrive short by that amount.`,
      why: 'This is the exact adult pattern that turns into late fees and stress later — spending what’s “in the account” before protecting obligations. Catching it now means the lesson is cheap.',
      how: `Keep it calm and curious, not punitive. Ask: “You knew rent and power were due — what would protect that money first next payday, before food delivery?” Then listen. Offer one rule they invent themselves (e.g. pay bills the same day as deposit).`,
    }
  }
  if (unpaid > 0) {
    return {
      id: `w${week}-unpaid`,
      severity: 'warn',
      title: 'Bills unfinished — teach the carry-over',
      preview: `${money(unpaid)} unpaid will come out of next week’s deposit.`,
      what: `${teen} closed the week with ${money(unpaid)} still unpaid. The system will automatically deduct that from next payday.`,
      why: 'In real life, unpaid obligations don’t disappear — they shrink next month’s freedom. Experiencing that here builds the link between today’s choices and tomorrow’s options.',
      how: `Say: “No drama — the money just moves to next week. What got in the way of paying everything?” Help them name one friction and one fix for Monday.`,
    }
  }
  if (state.funSpend > Math.max(0, income - totalBills(state) - save)) {
    return {
      id: `w${week}-pace`,
      severity: 'teach',
      title: 'Bills OK — pacing is the lesson',
      preview: 'Obligations covered, but discretionary spend was front-loaded.',
      what: `${teen} paid every bill back to your account. Card spending this week was ${money(state.funSpend)} — heavy relative to what was actually free after bills and savings.`,
      why: 'Paying bills is the baseline. Adults also need to pace fun money so the week doesn’t go dry by Wednesday.',
      how: `Celebrate the bills first. Then ask: “Would you pace fun money differently if payday were further away?” Suggest splitting free money into 2–3 smaller spends next week.`,
    }
  }
  return {
    id: `w${week}-strong`,
    severity: 'good',
    title: 'Strong week — reinforce it',
    preview: 'Bills paid and spending stayed inside safe-to-spend.',
    what: `${teen} covered every obligation and kept discretionary spend inside safe-to-spend. Ending balance: ${money(state.teenBalance)}.`,
    why: 'Positive weeks matter as much as mistakes. Naming what worked locks in the habit — and prepares them for more responsibility.',
    how: `Ask: “What helped you stay on top of it this week?” If they have a clear answer, consider adding one small new bill next month.`,
  }
}

export function buildMidWeekRiskMoment(state) {
  const unpaid = unpaidTotal(state)
  const teen = state.teenName.split(' ')[0]
  return {
    id: `w${state.week}-risk-${Date.now()}`,
    severity: 'alert',
    title: 'Heads-up: bill money at risk',
    preview: `Balance can’t cover the remaining ${money(unpaid)} in bills.`,
    what: `After a card spend, ${teen}’s balance (${money(state.teenBalance)}) is below the ${money(unpaid)} still owed in bills this week.`,
    why: 'This is the moment adults feel as “I thought I had money.” Interrupting mid-week — once, calmly — teaches that balance ≠ spendable money.',
    how: `Don’t confiscate the card. Open with: “Your balance looks fine, but rent isn’t paid yet — how much of that money is actually free?” Help them separate committed vs free without shame.`,
  }
}

export function buildLoanMoment(state, loan) {
  const teen = state.teenName.split(' ')[0]
  const weeks = loanWeeksLeft(loan)
  return {
    id: `w${state.week}-loan-${Date.now()}`,
    severity: 'warn',
    title: `${teen} took a loan for “${loan.purpose}”`,
    preview: `${money(loan.total)} now · ${money(loan.weekly)} / week · ~${weeks} weeks.`,
    what: `${teen} borrowed ${money(loan.total)} for “${loan.purpose}”. The money is in their account now. They committed to ${money(loan.weekly)} each payday until ${money(loan.remainingBalance)} is repaid.`,
    why: 'A loan feels like “having the money,” but next week’s freedom is already smaller. If bills get missed because of the repayment, the lesson is about stacking commitments — not shame.',
    how: `Ask: “What is the ${loan.purpose.toLowerCase()} for, and could any of it wait?” Then: “With ${money(loan.weekly)} leaving every payday, what’s left for bills and fun?” Let them own the plan.`,
  }
}

function deliverPush(state, moment) {
  if (state.pushes.some((item) => item.id === moment.id)) {
    return { ...state, banner: moment, coachAlert: moment }
  }
  return {
    ...state,
    pushes: [{ ...moment, time: 'just now', week: state.week, open: true }, ...state.pushes],
    banner: moment,
    coachAlert: moment,
  }
}

export function updateRules(state, partial) {
  if (state.phase === 'active') return { ...state, toast: 'Finish or end the week before changing rules.' }
  return {
    ...state,
    rules: {
      ...state.rules,
      ...Object.fromEntries(
        Object.entries(partial).map(([key, value]) => [key, Math.max(0, Number(value) || 0)]),
      ),
    },
  }
}

export function toggleRuleEnabled(state, key) {
  if (key === 'income') return state
  if (state.phase === 'active') return { ...state, toast: 'Finish or end the week before changing what’s assigned.' }
  const nextEnabled = !(state.enabled?.[key] ?? true)
  const label = RULE_FIELDS.find((item) => item.key === key)?.label || key
  return {
    ...state,
    enabled: {
      ...DEFAULT_ENABLED,
      ...state.enabled,
      [key]: nextEnabled,
      income: true,
    },
    toast: nextEnabled
      ? key === 'loans'
        ? 'Loans allowed — teen can apply in Life Mode'
        : `${label} assigned to teen`
      : key === 'loans'
        ? 'Loans turned off for teen'
        : `${label} hidden from teen`,
  }
}

export function startWeek(state) {
  if (state.phase === 'active') return state
  const income = Number(state.rules.income) || 0
  if (income <= 0) return { ...state, toast: 'Set a weekly deposit first.' }
  if (state.parentBalance < income) return { ...state, toast: 'Parent account needs more funds.' }

  let next = { ...state }
  if (state.phase === 'ended') next = { ...next, week: state.week + 1 }

  const debt = next.carryDebt
  let loanDeduction = 0
  const priorLoan = next.activeLoan
  let activeLoan = priorLoan
  if (activeLoan && loanRemaining({ activeLoan }) > 0) {
    loanDeduction = Math.min(Number(activeLoan.weekly) || 0, loanRemaining({ activeLoan }))
    const remainingBalance = Math.max(0, loanRemaining({ activeLoan }) - loanDeduction)
    activeLoan = remainingBalance > 0 ? { ...activeLoan, remainingBalance } : null
  }

  const netDeposit = Math.max(0, income - debt - loanDeduction)
  const teen = next.teenName.split(' ')[0]

  let parentBalance = next.parentBalance - income
  let parentTx = pushTx(
    next.parentTx,
    {
      desc: 'Weekly Life Mode deposit',
      meta: `To ${teen} · Week ${next.week}${debt ? ` · ${money(debt)} held for debt` : ''}${loanDeduction ? ` · ${money(loanDeduction)} loan repayment` : ''}`,
      amount: income,
      type: 'debit',
    },
    next.week,
  )
  let teenTx = pushTx(
    next.teenTx,
    {
      desc: 'Allowance deposit',
      meta: [
        `From ${next.parentName.split(' ')[0]}`,
        debt ? `${money(income)} − ${money(debt)} debt` : `Week ${next.week}`,
        loanDeduction ? `− ${money(loanDeduction)} loan` : '',
      ]
        .filter(Boolean)
        .join(' · '),
      amount: netDeposit,
      type: 'credit',
    },
    next.week,
  )

  if (debt > 0) {
    parentBalance += debt
    parentTx = pushTx(
      parentTx,
      {
        desc: 'Prior-week debt recovery',
        meta: `Kept from ${teen}’s deposit · Week ${next.week}`,
        amount: debt,
        type: 'credit',
      },
      next.week,
    )
  }

  if (loanDeduction > 0 && priorLoan) {
    parentBalance += loanDeduction
    teenTx = pushTx(
      teenTx,
      {
        desc: `Loan repayment · ${priorLoan.purpose}`,
        meta: `${money(loanDeduction)} / week · ${money((activeLoan?.remainingBalance ?? 0))} left`,
        amount: loanDeduction,
        type: 'debit',
      },
      next.week,
    )
    parentTx = pushTx(
      parentTx,
      {
        desc: `Loan repayment · ${priorLoan.purpose}`,
        meta: `From ${teen} · Week ${next.week}`,
        amount: loanDeduction,
        type: 'credit',
      },
      next.week,
    )
  }

  return {
    ...next,
    parentBalance,
    teenBalance: next.teenBalance + netDeposit,
    returnedThisWeek: 0,
    funSpend: 0,
    paid: { rent: false, groceries: false, power: false, gas: false },
    phase: 'active',
    warnedBillRisk: false,
    carryDebt: 0,
    activeLoan,
    parentTx,
    teenTx,
    toast: [
      debt ? `${money(debt)} debt` : null,
      loanDeduction ? `${money(loanDeduction)} loan` : null,
    ]
      .filter(Boolean)
      .length
      ? `Week ${next.week} — ${teen} got ${money(netDeposit)} after deductions`
      : `Week ${next.week} — ${money(income)} parent → teen`,
  }
}

export function payBill(state, key) {
  if (state.phase !== 'active') return state
  if (!isEnabled(state, key)) return { ...state, toast: 'That bill isn’t assigned this week.' }
  if (state.paid[key]) return state
  const amount = obligations(state)[key]
  const label = BILL_META[key]?.name || key
  if (state.teenBalance < amount) {
    return {
      ...state,
      toast: `Not enough for ${label}`,
    }
  }
  const teen = state.teenName.split(' ')[0]
  return {
    ...state,
    teenBalance: state.teenBalance - amount,
    parentBalance: state.parentBalance + amount,
    paid: { ...state.paid, [key]: true },
    returnedThisWeek: state.returnedThisWeek + amount,
    teenTx: pushTx(
      state.teenTx,
      { desc: `Bill · ${label}`, meta: 'Returned to parent', amount, type: 'debit' },
      state.week,
    ),
    parentTx: pushTx(
      state.parentTx,
      { desc: `Bill · ${label}`, meta: `From ${teen} · Week ${state.week}`, amount, type: 'credit' },
      state.week,
    ),
    toast: `${label} ${money(amount)} → parent`,
  }
}

export function cardSpend(state, merchant, amountInput) {
  if (state.phase !== 'active') return state
  const amount = Math.max(1, Number(amountInput) || 0)
  if (state.teenBalance < amount) {
    return { ...state, toast: 'Card declined — insufficient funds' }
  }

  let next = {
    ...state,
    teenBalance: state.teenBalance - amount,
    funSpend: state.funSpend + amount,
    teenTx: pushTx(
      state.teenTx,
      { desc: merchant, meta: 'Card · discretionary', amount, type: 'debit' },
      state.week,
    ),
    toast: `Card · ${merchant} −${money(amount)}`,
  }

  const unpaid = unpaidTotal(next)
  if (!next.warnedBillRisk && unpaid > 0 && next.teenBalance < unpaid) {
    next = deliverPush({ ...next, warnedBillRisk: true }, buildMidWeekRiskMoment(next))
  }
  return next
}

export function applyLoan(state, { purpose, amount, weekly } = {}) {
  if (state.phase !== 'active') return { ...state, toast: 'Start the week before applying for a loan.' }
  if (!isEnabled(state, 'loans')) return { ...state, toast: 'Your parent hasn’t allowed loans yet.' }
  if (state.activeLoan) return { ...state, toast: 'Finish your current loan first.' }

  const cleanPurpose = String(purpose || '').trim()
  const total = Math.round(Number(amount) || 0)
  const weeklyPay = Math.round(Number(weekly) || 0)

  if (!cleanPurpose) return { ...state, toast: 'Say what the money is for.' }
  if (total < 20) return { ...state, toast: 'Loan amount must be at least $20.' }
  if (weeklyPay < 5) return { ...state, toast: 'Weekly payment must be at least $5.' }
  if (weeklyPay > total) return { ...state, toast: 'Weekly payment can’t be bigger than the loan.' }
  if (state.parentBalance < total) {
    return { ...state, toast: 'Parent account needs more funds to advance this loan.' }
  }

  const loan = {
    purpose: cleanPurpose,
    total,
    weekly: weeklyPay,
    remainingBalance: total,
  }

  let next = {
    ...state,
    parentBalance: state.parentBalance - total,
    teenBalance: state.teenBalance + total,
    activeLoan: loan,
    parentTx: pushTx(
      state.parentTx,
      {
        desc: `Loan advance · ${cleanPurpose}`,
        meta: `To ${state.teenName.split(' ')[0]} · ${money(weeklyPay)} / week`,
        amount: total,
        type: 'debit',
      },
      state.week,
    ),
    teenTx: pushTx(
      state.teenTx,
      {
        desc: `Loan received · ${cleanPurpose}`,
        meta: `${money(weeklyPay)} / week until repaid`,
        amount: total,
        type: 'credit',
      },
      state.week,
    ),
    toast: `${money(total)} for “${cleanPurpose}” is in your account — ${money(weeklyPay)} / week from now`,
  }

  next = deliverPush(next, buildLoanMoment(next, loan))
  return next
}

export function declineLoan(state) {
  return {
    ...state,
    toast: 'You backed out. Understanding the loan before taking it is the skill.',
  }
}

export function endWeek(state) {
  if (state.phase !== 'active') return state
  const unpaid = unpaidTotal(state)
  const summary = {
    week: state.week,
    deposit: Number(state.rules.income) || 0,
    billsPaid: state.returnedThisWeek,
    unpaid,
    funSpend: state.funSpend,
    endingBalance: state.teenBalance,
    safeTarget: savingsTarget(state),
    txs: state.teenTx.filter((tx) => tx.week === state.week),
  }
  const withHistory = {
    ...state,
    weekHistory: [...state.weekHistory, summary],
    carryDebt: unpaid,
    phase: 'ended',
    toast: unpaid > 0
      ? `Week ${state.week} closed — coaching push sent`
      : `Week ${state.week} closed — coaching push sent`,
  }
  return deliverPush(withHistory, buildTeachingMoment(withHistory))
}

export function togglePush(state, index) {
  return {
    ...state,
    pushes: state.pushes.map((item, i) => ({
      ...item,
      open: i === index ? !item.open : false,
    })),
  }
}

export function clearBanner(state) {
  return { ...state, banner: null }
}

export function clearToast(state) {
  return { ...state, toast: '' }
}

export function dismissCoachAlert(state) {
  return { ...state, coachAlert: null, banner: null }
}

export function resetLifeMode(names = {}) {
  return createInitialState({
    parentName: names.parentName || 'Alex',
    teenName: names.teenName || 'Jamie',
    toast: 'Life Mode reset',
  })
}

export function downloadWeeklySummary(state) {
  const summary = state.weekHistory[state.weekHistory.length - 1]
  if (!summary) return { ok: false, toast: 'End a week first' }
  const lines = [
    '18 Before 18 — Weekly spending summary',
    `Teen: ${state.teenName}`,
    `Week: ${summary.week}`,
    `Generated: ${new Date().toISOString()}`,
    '',
    `Deposit received,${summary.deposit}`,
    `Bills paid back to parent,${summary.billsPaid}`,
    `Unpaid obligations carried forward,${summary.unpaid}`,
    `Card / discretionary spend,${summary.funSpend}`,
    `Ending balance,${summary.endingBalance}`,
    `Savings target,${summary.safeTarget}`,
    '',
    'Date,Description,Meta,Type,Amount',
    ...summary.txs.map(
      (tx) => `"${tx.date}","${tx.desc}","${tx.meta || ''}","${tx.type}",${tx.amount}`,
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `18before18-week-${summary.week}-${state.teenName.split(' ')[0].toLowerCase()}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
  return { ok: true, toast: 'Weekly summary downloaded' }
}

export function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      ...createInitialState(),
      ...parsed,
      enabled: { ...DEFAULT_ENABLED, ...(parsed.enabled || {}) , income: true },
      toast: '',
      banner: null,
    }
  } catch {
    return null
  }
}

export function persistState(state) {
  const rest = { ...state }
  delete rest.toast
  delete rest.banner
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rest))
}

export { STORAGE_KEY }
