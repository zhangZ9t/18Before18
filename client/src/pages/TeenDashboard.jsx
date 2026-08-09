import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import DashboardLayout from '../components/DashboardLayout'
import ExpenseEntryForm from '../components/ExpenseEntryForm'
import MetricCard from '../components/MetricCard'
import ReportView from '../components/ReportView'
import SafeToSpendCard from '../components/SafeToSpendCard'
import StatusState from '../components/StatusState'
import WhatIfSimulator from '../components/WhatIfSimulator'
import useSectionNavigation from '../hooks/useSectionNavigation'
import { formatDate, formatMoney } from '../utils/formatters'

const navItems = [
  { id: 'week', label: 'This Week' },
  { id: 'goals', label: 'Goals' },
  { id: 'practice', label: 'Practice' },
  { id: 'history', label: 'History' },
  { id: 'settings', label: 'Settings' },
]
const sectionIds = navItems.map(({ id }) => id)

const emptyGoalForm = () => ({
  name: '',
  targetAmount: 300,
  currentAmount: 0,
  weeklyContribution: 20,
})

const goalFormFromGoal = (goal) =>
  goal
    ? {
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        weeklyContribution: goal.weeklyContribution,
      }
    : emptyGoalForm()

function Responsibilities({ items, onPaid }) {
  if (!items.length) {
    return <div className="empty-card"><h3>No responsibilities yet</h3><p>Your assigned bills and commitments will appear here.</p></div>
  }

  return (
    <div className="responsibility-list">
      {items.map((item) => (
        <article key={item.id}>
          <span className={`status-dot status-dot--${item.status}`} aria-hidden="true" />
          <div><strong>{item.name}</strong><span>{formatMoney(item.amount)} · Due {formatDate(item.dueDate)}</span></div>
          <span className={`status-pill status-pill--${item.status}`}>{item.status}</span>
          {item.status !== 'paid' && <button className="text-button" type="button" onClick={() => onPaid(item.id)}>Mark paid</button>}
          <p>{item.consequence}</p>
        </article>
      ))}
    </div>
  )
}

function GoalCard({ goal }) {
  if (!goal) {
    return <div className="empty-card"><h3>No savings goal yet</h3><p>Create your first goal to connect today’s choices with something you want later.</p></div>
  }

  return (
    <section className="goal-card">
      <div className="goal-card__heading"><div><p className="eyebrow">Savings goal</p><h2>{goal.name}</h2></div><strong>{goal.progressPercentage}%</strong></div>
      <div className="progress-track progress-track--large"><span style={{ width: `${goal.progressPercentage}%` }} /></div>
      <div className="goal-card__numbers"><span><strong>{formatMoney(goal.currentAmount)}</strong> saved</span><span>of {formatMoney(goal.targetAmount)}</span></div>
      <div className="goal-card__projection"><span>Estimated</span><p>At {formatMoney(goal.weeklyContribution)} per week, about <strong>{goal.projection.estimatedWeeks} weeks</strong> remain.</p></div>
    </section>
  )
}

function TeenDashboard() {
  const { activeSection: activeTab, navigateToSection } = useSectionNavigation({
    initialSection: 'week',
    sectionIds,
    sectionPrefix: 'teen',
  })
  const [overview, setOverview] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [practice, setPractice] = useState(undefined)
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [scenarioOutcome, setScenarioOutcome] = useState(null)
  const [history, setHistory] = useState(undefined)
  const [report, setReport] = useState(undefined)
  const [goalForm, setGoalForm] = useState(emptyGoalForm)

  const loadOverview = useCallback(async () => {
    try {
      const data = await api.get('/teen/overview')
      setOverview(data)
      setStatus('success')
      return data
    } catch (requestError) {
      setError(requestError.message)
      setStatus('error')
      return null
    }
  }, [])

  const loadHistoryAndReport = useCallback(async () => {
    try {
      const [transactions, currentReport] = await Promise.all([
        api.get('/transactions'),
        api.get('/reports/current'),
      ])
      setHistory(transactions.transactions)
      setReport(currentReport.report)
    } catch (requestError) {
      setError(requestError.message)
      setHistory([])
      setReport(null)
    }
  }, [])

  useEffect(() => {
    api
      .get('/teen/overview')
      .then((data) => {
        setOverview(data)
        setGoalForm(goalFormFromGoal(data.savingsGoal))
        setStatus('success')
      })
      .catch((requestError) => {
        setError(requestError.message)
        setStatus('error')
      })
  }, [])

  useEffect(() => {
    api.get('/practice').then(setPractice).catch((requestError) => {
      setError(requestError.message)
      setPractice({ scenarios: [] })
    })
    Promise.all([api.get('/transactions'), api.get('/reports/current')])
      .then(([transactions, currentReport]) => {
        setHistory(transactions.transactions)
        setReport(currentReport.report)
      })
      .catch((requestError) => {
        setError(requestError.message)
        setHistory([])
        setReport(null)
      })
  }, [])

  const markPaid = async (id) => {
    await api.patch(`/responsibilities/${id}`, { status: 'paid' })
    setNotice('Responsibility updated. Your safe-to-spend picture has been refreshed.')
    await loadOverview()
  }

  const saveGoal = async (event) => {
    event.preventDefault()
    try {
      const payload = {
        ...goalForm,
        targetAmount: Number(goalForm.targetAmount),
        currentAmount: Number(goalForm.currentAmount),
        weeklyContribution: Number(goalForm.weeklyContribution),
      }

      if (overview.savingsGoal) {
        await api.patch(`/goals/${overview.savingsGoal.id}`, payload)
      } else {
        await api.post('/goals', payload)
      }

      setNotice(overview.savingsGoal ? 'Goal updated.' : 'Goal created.')
      const refreshedOverview = await loadOverview()
      if (refreshedOverview) {
        setGoalForm(goalFormFromGoal(refreshedOverview.savingsGoal))
      }
      navigateToSection('goals')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const requestMoreResponsibility = async () => {
    const requestedLevel = Math.min(4, overview.household.independenceLevel + 1)
    try {
      await api.post('/household/independence/request', { requestedLevel })
      setNotice(`Level ${requestedLevel} request sent for a family conversation.`)
      await loadOverview()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const pauseAndSimulate = () => {
    setNotice('Practice paused. Test the amount in the What-If Simulator before deciding.')
    window.setTimeout(() => document.getElementById('what-if-simulator')?.scrollIntoView({ behavior: 'smooth' }), 0)
  }

  const recordExpense = async (expense) => {
    try {
      await api.post('/transactions', expense)
      setNotice('Expense recorded. Your money picture has been refreshed.')
      await Promise.all([loadOverview(), loadHistoryAndReport()])
      return true
    } catch (requestError) {
      setError(requestError.message)
      return false
    }
  }

  if (status === 'loading') {
    return <main className="centered-page"><StatusState title="Building your money picture" message="Checking commitments, goals, and this week’s money…" /></main>
  }
  if (status === 'error') {
    return <main className="centered-page"><StatusState type="error" title="We couldn’t open your dashboard" message={error} action={<button className="button button--dark" type="button" onClick={loadOverview}>Try again</button>} /></main>
  }

  const { money, savingsGoal, responsibilities, household, advances } = overview
  const committedTotal = money.upcomingBills + money.activeAdvancePayments + money.savingsCommitment
  const percentage = (value) => `${Math.max(0, Math.min(100, (value / Math.max(1, money.balance)) * 100))}%`

  return (
    <DashboardLayout role="teen" navItems={navItems} activeTab={activeTab} onTabChange={navigateToSection}>
      {notice && <div className="notice-banner" role="status"><span>✓</span>{notice}<button aria-label="Dismiss message" type="button" onClick={() => setNotice('')}>×</button></div>}
      {error && status !== 'error' && <div className="notice-banner notice-banner--error" role="alert"><span>!</span>{error}<button aria-label="Dismiss error" type="button" onClick={() => setError('')}>×</button></div>}

      <div className="teen-dashboard-onepage">
        <section className="dashboard-section teen-dashboard-section teen-dashboard-section--week" data-section="week" id="teen-week">
          <header className="dashboard-title-row">
            <div><p className="eyebrow">My dashboard · Level {household.independenceLevel}</p><h1>Your money, clearly.</h1><p>See what’s available after the things you’ve already committed to.</p></div>
            <div className="week-chip"><span>This week</span><strong>Money now</strong></div>
          </header>

          <section className="dashboard-metrics" aria-label="Money summary">
            <MetricCard label="Real balance" value={formatMoney(money.balance)} detail="In your account now" tone="ink" />
            <MetricCard label="Upcoming bills" value={formatMoney(money.upcomingBills)} detail="Set aside for responsibilities" tone="coral" />
            <MetricCard label="Savings commitment" value={formatMoney(money.savingsCommitment)} detail="Protected for your goals" tone="violet" />
            <SafeToSpendCard safeToSpend={money.safeToSpend} />
          </section>

          <section className="money-picture-card">
            <div className="panel-heading panel-heading--split panel-heading--light"><div><p className="eyebrow">The full picture</p><h2>Where your balance is going</h2></div><div className="total-balance"><span>Total balance</span><strong>{formatMoney(money.balance)}</strong></div></div>
            <div className="balance-track" role="img" aria-label={`${formatMoney(money.safeToSpend)} safe to spend and ${formatMoney(committedTotal)} committed`}>
              <span className="balance-track__safe" style={{ width: percentage(money.safeToSpend) }} />
              <span className="balance-track__bills" style={{ width: percentage(money.upcomingBills) }} />
              <span className="balance-track__advance" style={{ width: percentage(money.activeAdvancePayments) }} />
              <span className="balance-track__saving" style={{ width: percentage(money.savingsCommitment) }} />
            </div>
            <div className="balance-legend">
              <span><i className="dot dot--lime" />Safe to spend <strong>{formatMoney(money.safeToSpend)}</strong></span>
              <span><i className="dot dot--coral" />Bills <strong>{formatMoney(money.upcomingBills)}</strong></span>
              <span><i className="dot dot--gold" />Advance <strong>{formatMoney(money.activeAdvancePayments)}</strong></span>
              <span><i className="dot dot--violet" />Savings <strong>{formatMoney(money.savingsCommitment)}</strong></span>
            </div>
            <div className="learning-note"><span>✦</span><p><strong>Your balance isn’t the same as your spending money.</strong> Safe-to-spend protects commitments first.</p></div>
          </section>

          <ExpenseEntryForm
            description="Add what you spent so your balance and safe-to-spend amount stay current. Your note remains in your personal view."
            noteLabel="Private note (optional)"
            onSubmit={recordExpense}
            title="Record an expense"
          />

          <div className="two-column-grid teen-card-group">
            <section className="panel-card"><div className="panel-heading panel-heading--split"><div><p className="eyebrow">Responsibilities</p><h2>Coming up</h2></div><span className="count-badge">{responsibilities.filter(({ status: itemStatus }) => itemStatus !== 'paid').length} due</span></div><Responsibilities items={responsibilities} onPaid={markPaid} /></section>
            <GoalCard goal={savingsGoal} />
          </div>

          {advances.length > 0 && (
            <section className="advance-strip"><div><p className="eyebrow">Family Advance</p><h2>Future money already committed</h2></div><div className="advance-strip__details"><strong>{formatMoney(advances[0].installmentAmount)} / week</strong><span>{advances[0].installmentsRemaining} payments remaining</span></div><p>This is a family learning arrangement—not real credit or BNPL.</p></section>
          )}
          <WhatIfSimulator onDataChanged={() => Promise.all([loadOverview(), loadHistoryAndReport()])} />
        </section>

        <section className="dashboard-section teen-dashboard-section" data-section="goals" id="teen-goals">
          <header className="dashboard-title-row"><div><p className="eyebrow">Goals</p><h1>Make future-you visible.</h1><p>Connect weekly choices with something worth waiting for.</p></div></header>
          <div className={`goal-management-grid teen-card-group${savingsGoal ? ' has-goal' : ''}`}>
            {savingsGoal && <GoalCard goal={savingsGoal} />}
            <form className="form-card" onSubmit={saveGoal}>
              <div className="panel-heading">
                <p className="eyebrow">{savingsGoal ? 'Goal settings' : 'First goal'}</p>
                <h2>{savingsGoal ? 'Update your goal' : 'What are you saving for?'}</h2>
                {savingsGoal && <p>Change the target or weekly contribution as your plan changes.</p>}
              </div>
              <div className="form-grid">
                <label>Goal name<input required value={goalForm.name} onChange={(event) => setGoalForm({ ...goalForm, name: event.target.value })} placeholder="Headphones" /></label>
                <label>Target amount<input min="1" type="number" value={goalForm.targetAmount} onChange={(event) => setGoalForm({ ...goalForm, targetAmount: event.target.value })} /></label>
                <label>Already saved<input min="0" type="number" value={goalForm.currentAmount} onChange={(event) => setGoalForm({ ...goalForm, currentAmount: event.target.value })} /></label>
                <label>Weekly contribution<input min="0" type="number" value={goalForm.weeklyContribution} onChange={(event) => setGoalForm({ ...goalForm, weeklyContribution: event.target.value })} /></label>
              </div>
              <button className="button button--dark" type="submit">{savingsGoal ? 'Update goal' : 'Create goal'}</button>
            </form>
          </div>
        </section>

        <section className="dashboard-section teen-dashboard-section" data-section="practice" id="teen-practice">
          <header className="dashboard-title-row"><div><p className="eyebrow">Practice Zone</p><h1>Low-risk pressure. Real learning.</h1><p>These are clearly labelled simulations. Nothing here spends real money.</p></div><span className="simulation-label">Practice scenarios only</span></header>
          {!practice ? <StatusState title="Loading scenarios" /> : practice.scenarios.length === 0 ? <div className="empty-card"><h3>No scenarios at this level yet</h3><p>More practice appears as responsibility grows.</p></div> : <div className="practice-grid">{practice.scenarios.map((scenario) => <article className={`practice-card practice-card--${scenario.type}`} key={scenario._id}><span className="practice-card__label">Practice Scenario</span><h2>{scenario.title}</h2><p>{scenario.description}</p>{selectedScenario === scenario._id && <div className="scenario-reveal"><strong>{scenario.payload.headline || `Full cost: ${formatMoney(scenario.payload.purchaseAmount || scenario.payload.replacementCost || scenario.payload.recurringAmount)}`}</strong><p>Pause. What changes in your safe-to-spend and future commitments?</p></div>}{scenarioOutcome?.id === scenario._id && <p className="success-message" role="status">{scenarioOutcome.message}</p>}{scenario.type === 'flash_sale' ? <div className="simulation-actions"><button className="button button--ghost button--small" type="button" onClick={() => { setSelectedScenario(scenario._id); setScenarioOutcome({ id: scenario._id, message: 'You continued in practice. The full offer is visible, and no real money was spent.' }) }}>Continue</button><button className="button button--dark button--small" type="button" onClick={pauseAndSimulate}>Pause and simulate</button><button className="text-button" type="button" onClick={() => { setSelectedScenario(null); setScenarioOutcome({ id: scenario._id, message: 'You stepped away from this practice offer. Nothing changed.' }) }}>Back out</button></div> : <button className="button button--ghost button--small" type="button" onClick={() => setSelectedScenario(selectedScenario === scenario._id ? null : scenario._id)}>{selectedScenario === scenario._id ? 'Close reflection' : 'Pause and reveal'}</button>}</article>)}</div>}
        </section>

        <section className="dashboard-section teen-dashboard-section" data-section="history" id="teen-history">
          <header className="dashboard-title-row"><div><p className="eyebrow">History & report</p><h1>Look back without judgement.</h1><p>Use the pattern to understand what happened and what to try next.</p></div></header>
          {!history ? <StatusState title="Loading your history" /> : <div className="history-layout"><section className="panel-card"><div className="panel-heading"><p className="eyebrow">Recent activity</p><h2>Your transactions</h2></div>{history.length === 0 ? <div className="empty-card"><h3>No activity yet</h3><p>Recorded transactions will appear here.</p></div> : <div className="transaction-list">{history.map((transaction) => <article key={transaction.id}><span>{transaction.category}</span><div><strong>{transaction.merchant || transaction.description || 'Money activity'}</strong><small>{formatDate(transaction.date)}</small></div><b className={transaction.type === 'income' ? 'is-income' : ''}>{transaction.type === 'income' ? '+' : '−'}{formatMoney(transaction.amount)}</b></article>)}</div>}</section><ReportView report={report} role="teen" /></div>}
        </section>

        <section className="dashboard-section teen-dashboard-section" data-section="settings" id="teen-settings">
          <header className="dashboard-title-row"><div><p className="eyebrow">Independence</p><h1>More responsibility, when you’re ready.</h1><p>Use a request to start a conversation—not to unlock money automatically.</p></div></header>
          <div className="two-column-grid teen-card-group"><section className="level-card"><span>Current level</span><strong>{household.independenceLevel}</strong><h2>{['', 'Starter', 'Explorer', 'Independent', 'Ready'][household.independenceLevel]}</h2><p>{household.independenceLevel < 4 ? 'The next level adds realistic responsibilities with less intervention.' : 'You are practising with minimal parental intervention.'}</p><button className="button button--dark" disabled={household.independenceLevel >= 4 || household.independenceRequest?.status === 'pending'} type="button" onClick={requestMoreResponsibility}>{household.independenceRequest?.status === 'pending' ? 'Request pending' : household.independenceLevel >= 4 ? 'Highest level reached' : 'Request more responsibility'}</button></section><section className="panel-card"><div className="panel-heading"><p className="eyebrow">Shared household picture</p><h2>What you can see</h2><p>These categories were chosen by your parent. Sensitive balances and transactions stay private.</p></div><div className="category-list">{household.visibleCategories.map((category) => <div key={category.name}><span>{category.name}</span><strong>{formatMoney(category.weeklyBudget)} / week</strong></div>)}</div></section></div>
        </section>
      </div>

      <p className="dashboard-footnote">18 Before 18 demonstrates financial learning with mock transaction data. It does not hold money, provide credit, or connect to a bank.</p>
    </DashboardLayout>
  )
}

export default TeenDashboard
