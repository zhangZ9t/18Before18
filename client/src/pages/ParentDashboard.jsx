import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import DashboardLayout from '../components/DashboardLayout'
import MetricCard from '../components/MetricCard'
import ReportView from '../components/ReportView'
import StatusState from '../components/StatusState'
import { formatDate, formatMoney } from '../utils/formatters'

const navItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'responsibilities', label: 'Responsibilities' },
  { id: 'reports', label: 'Reports' },
  { id: 'household', label: 'Household' },
  { id: 'settings', label: 'Settings' },
]

function ParentDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [overview, setOverview] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [report, setReport] = useState(undefined)
  const [responsibilityForm, setResponsibilityForm] = useState({ name: 'Phone plan', category: 'Subscriptions', amount: 15, frequency: 'weekly', dueDate: '', assignedAtIndependenceLevel: 2 })
  const [moneySettings, setMoneySettings] = useState({ weeklyDeposit: '', savingsCommitment: '', depositFrequency: 'weekly' })

  const loadOverview = useCallback(async () => {
    try {
      const data = await api.get('/parent/overview')
      setOverview(data)
      setMoneySettings({
        weeklyDeposit: data.household.weeklyDeposit,
        savingsCommitment: data.household.savingsCommitment,
        depositFrequency: data.household.depositFrequency,
      })
      setStatus('success')
    } catch (requestError) {
      setError(requestError.message)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    api
      .get('/parent/overview')
      .then((data) => {
        setOverview(data)
        setMoneySettings({
          weeklyDeposit: data.household.weeklyDeposit,
          savingsCommitment: data.household.savingsCommitment,
          depositFrequency: data.household.depositFrequency,
        })
        setStatus('success')
      })
      .catch((requestError) => {
        setError(requestError.message)
        setStatus('error')
      })
  }, [])

  useEffect(() => {
    if (activeTab === 'reports' && report === undefined) {
      api.get('/reports/current').then((data) => setReport(data.report)).catch((requestError) => setError(requestError.message))
    }
  }, [activeTab, report])

  const updatePrompt = async (promptStatus) => {
    await api.patch(`/prompts/${overview.conversationPrompt.id}`, { status: promptStatus })
    setNotice(promptStatus === 'discussed' ? 'Conversation marked as discussed.' : 'Prompt dismissed for this week.')
    await loadOverview()
  }

  const updateHousehold = async (changes, successMessage) => {
    try {
      await api.patch('/household', changes)
      setNotice(successMessage)
      await loadOverview()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const toggleVisibility = async (category) => {
    try {
      await api.patch('/household/visibility', {
        categories: [{ name: category.name, visibleToTeen: !category.visibleToTeen }],
      })
      setNotice(`${category.name} visibility updated.`)
      await loadOverview()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const decideIndependence = async (decision) => {
    await api.patch('/household/independence/decision', { decision })
    setNotice(`Responsibility request ${decision}.`)
    await loadOverview()
  }

  const addResponsibility = async (event) => {
    event.preventDefault()
    try {
      await api.post('/responsibilities', {
        ...responsibilityForm,
        amount: Number(responsibilityForm.amount),
        teenId: overview.teen.id,
      })
      setNotice('Responsibility added. The teen’s money picture has been updated.')
      await loadOverview()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const saveMoneySettings = async (event) => {
    event.preventDefault()
    await updateHousehold(
      {
        weeklyDeposit: Number(moneySettings.weeklyDeposit),
        savingsCommitment: Number(moneySettings.savingsCommitment),
        depositFrequency: moneySettings.depositFrequency,
      },
      'Weekly money and protected savings updated.',
    )
  }

  const decideAdvance = async (id, decision) => {
    await api.patch(`/advances/${id}/${decision}`)
    setNotice(`Family Advance ${decision === 'approve' ? 'approved' : 'declined'}.`)
    await loadOverview()
  }

  if (status === 'loading') {
    return <main className="centered-page"><StatusState title="Preparing the family overview" message="Looking for one useful learning picture…" /></main>
  }
  if (status === 'error') {
    return <main className="centered-page"><StatusState type="error" title="We couldn’t open the parent dashboard" message={error} action={<button className="button button--dark" type="button" onClick={loadOverview}>Try again</button>} /></main>
  }

  const { household, teen } = overview

  if (!teen) {
    return (
      <DashboardLayout role="parent" navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
        <section className="empty-household"><p className="eyebrow">Household ready</p><h1>Invite your teenager.</h1><p>Share this private code. It joins their account to {household.name} without exposing database details.</p><strong>{household.inviteCode}</strong><LinkLikeJoin /></section>
      </DashboardLayout>
    )
  }

  const weekly = overview.weeklyOverview
  const maxCategory = Math.max(1, ...overview.spendingByCategory.map(({ amount }) => amount))

  return (
    <DashboardLayout role="parent" navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
      {notice && <div className="notice-banner" role="status"><span>✓</span>{notice}<button aria-label="Dismiss message" type="button" onClick={() => setNotice('')}>×</button></div>}
      {error && status !== 'error' && <div className="notice-banner notice-banner--error" role="alert"><span>!</span>{error}<button aria-label="Dismiss error" type="button" onClick={() => setError('')}>×</button></div>}

      {activeTab === 'overview' && (
        <>
          <header className="dashboard-title-row"><div><p className="eyebrow">{household.name}</p><h1>A useful family picture.</h1><p>How {teen.name.split(' ')[0]} is learning—and one thing worth discussing.</p></div><div className="week-chip"><span>Independence</span><strong>Level {weekly.independenceLevel}</strong></div></header>
          <section className="parent-metrics">
            <MetricCard label="Weekly deposit" value={formatMoney(weekly.weeklyDeposit)} detail="Regular money to manage" tone="ink" />
            <MetricCard label="Teen safe to spend" value={formatMoney(weekly.safeToSpend)} detail="After current commitments" tone="lime" />
            <MetricCard label="Bills paid / due" value={`${weekly.billsPaid} / ${weekly.billsDue}`} detail="Follow-through this week" tone="coral" />
            <MetricCard label="Savings goal" value={`${weekly.savingsGoal?.progressPercentage ?? 0}%`} detail={weekly.savingsGoal?.name || 'No active goal'} tone="violet" />
            <MetricCard label="Habits score" value={`${weekly.habits.score}/100`} detail="Behaviours, not wealth" tone="gold" />
          </section>

          <div className="parent-overview-grid">
            <section className="conversation-card">
              <div className="conversation-card__label"><span>✦</span> Worth discussing</div>
              {overview.conversationPrompt ? <><h2>{overview.conversationPrompt.insight}</h2><span className="conversation-card__try">Try asking</span><blockquote>“{overview.conversationPrompt.suggestedQuestion}”</blockquote><div><button className="button button--lime button--small" type="button" onClick={() => updatePrompt('discussed')}>Mark as discussed</button><button className="text-button" type="button" onClick={() => updatePrompt('dismissed')}>Dismiss</button></div></> : <><h2>No conversation prompt this week.</h2><p>Everything looks steady. A simple check-in is enough.</p></>}
            </section>

            <section className="panel-card"><div className="panel-heading panel-heading--split"><div><p className="eyebrow">Privacy-aware spending</p><h2>By category</h2></div><span className="privacy-badge">No merchants</span></div>{overview.spendingByCategory.length === 0 ? <div className="empty-card"><h3>No spending yet</h3><p>Category patterns will appear after transactions are recorded.</p></div> : <div className="spending-bars">{overview.spendingByCategory.map(({ category, amount }) => <div key={category}><span>{category}</span><div><i style={{ width: `${(amount / maxCategory) * 100}%` }} /></div><strong>{formatMoney(amount)}</strong></div>)}</div>}<p className="privacy-note">Merchant and product details are deliberately excluded from this view.</p></section>
          </div>

          {household.independenceRequest?.status === 'pending' && <section className="request-banner"><div><p className="eyebrow">Responsibility request</p><h2>{teen.name.split(' ')[0]} is asking to move to Level {household.independenceRequest.requestedLevel}.</h2><p>Use the request to discuss readiness, not just to approve a setting.</p></div><div><button className="button button--dark button--small" type="button" onClick={() => decideIndependence('approved')}>Approve</button><button className="button button--ghost button--small" type="button" onClick={() => decideIndependence('declined')}>Decline</button></div></section>}

          {overview.pendingAdvances.length > 0 && <section className="panel-card"><div className="panel-heading"><p className="eyebrow">Family Advance requests</p><h2>Future weekly money</h2></div><div className="advance-request-list">{overview.pendingAdvances.map((advance) => <article key={advance._id}><div><strong>{advance.itemName}</strong><span>{formatMoney(advance.amountAdvanced)} · {formatMoney(advance.installmentAmount)} × {advance.installmentCount} weeks</span></div><p>This commits future money; it does not reduce the cost.</p><div><button className="button button--dark button--small" type="button" onClick={() => decideAdvance(advance._id, 'approve')}>Approve</button><button className="text-button" type="button" onClick={() => decideAdvance(advance._id, 'decline')}>Decline</button></div></article>)}</div></section>}
        </>
      )}

      {activeTab === 'responsibilities' && (
        <section className="dashboard-section"><header className="dashboard-title-row"><div><p className="eyebrow">Responsibilities</p><h1>Hand over real responsibility gradually.</h1><p>Assigned bills become visible commitments, with consequences explained before they are missed.</p></div></header><div className="two-column-grid"><section className="panel-card"><div className="panel-heading"><p className="eyebrow">Assigned to {teen.name.split(' ')[0]}</p><h2>Current responsibilities</h2></div><div className="parent-responsibility-list">{overview.responsibilities.map((item) => <article key={item.id}><span className={`status-dot status-dot--${item.status}`} /><div><strong>{item.name}</strong><span>{formatMoney(item.amount)} · {formatDate(item.dueDate)}</span></div><span className={`status-pill status-pill--${item.status}`}>{item.status}</span></article>)}</div></section><form className="form-card" onSubmit={addResponsibility}><div className="panel-heading"><p className="eyebrow">Add one commitment</p><h2>Create a learning opportunity</h2></div><div className="form-grid"><label>Name<input value={responsibilityForm.name} onChange={(event) => setResponsibilityForm({ ...responsibilityForm, name: event.target.value })} required /></label><label>Category<input value={responsibilityForm.category} onChange={(event) => setResponsibilityForm({ ...responsibilityForm, category: event.target.value })} required /></label><label>Amount<input min="1" type="number" value={responsibilityForm.amount} onChange={(event) => setResponsibilityForm({ ...responsibilityForm, amount: event.target.value })} required /></label><label>Due date<input type="date" value={responsibilityForm.dueDate} onChange={(event) => setResponsibilityForm({ ...responsibilityForm, dueDate: event.target.value })} required /></label></div><button className="button button--dark" type="submit">Add responsibility</button></form></div></section>
      )}

      {activeTab === 'reports' && (
        <section className="dashboard-section"><header className="dashboard-title-row"><div><p className="eyebrow">Weekly report</p><h1>A conversation starter, not a scorecard.</h1><p>Patterns are framed around behaviour, follow-through, and improvement.</p></div></header>{report === undefined ? <StatusState title="Loading this week’s report" /> : <ReportView report={report} role="parent" />}</section>
      )}

      {activeTab === 'household' && (
        <section className="dashboard-section"><header className="dashboard-title-row"><div><p className="eyebrow">Household controls</p><h1>Choose what supports learning.</h1><p>Share useful categories without exposing salary, mortgage details, balances, or sensitive transactions.</p></div></header><div className="two-column-grid"><section className="panel-card"><div className="panel-heading"><p className="eyebrow">Graduated independence</p><h2>Current level: {household.independenceLevel}</h2></div><div className="level-selector">{[['1','Starter','Pocket money, savings, entertainment'],['2','Explorer','Phone, transport, lunch'],['3','Independent','Subscriptions, groceries, larger budget'],['4','Ready','Minimal parental intervention']].map(([level, label, copy]) => <button className={household.independenceLevel === Number(level) ? 'is-active' : ''} key={level} type="button" onClick={() => updateHousehold({ independenceLevel: Number(level) }, `Independence updated to Level ${level}.`)}><span>{level}</span><div><strong>{label}</strong><small>{copy}</small></div></button>)}</div></section><section className="panel-card"><div className="panel-heading"><p className="eyebrow">Household visibility</p><h2>Shared with the teen</h2></div><div className="toggle-list">{household.householdCategories.map((category) => <div key={category.name}><div><strong>{category.name}</strong><span>{formatMoney(category.weeklyBudget)} / week</span></div><button aria-pressed={category.visibleToTeen} className={category.visibleToTeen ? 'is-on' : ''} type="button" onClick={() => toggleVisibility(category)}><span /></button></div>)}</div></section></div></section>
      )}

      {activeTab === 'settings' && (
        <section className="dashboard-section"><header className="dashboard-title-row"><div><p className="eyebrow">Household settings</p><h1>Private by default.</h1><p>Manage the learning environment without turning it into financial surveillance.</p></div></header><div className="settings-grid"><form className="form-card" onSubmit={saveMoneySettings}><div className="panel-heading"><p className="eyebrow">Money rhythm</p><h2>Weekly money and savings</h2><p>These commitments drive the teen’s server-calculated money picture.</p></div><div className="form-grid"><label>Deposit amount<input min="0" type="number" value={moneySettings.weeklyDeposit} onChange={(event) => setMoneySettings({ ...moneySettings, weeklyDeposit: event.target.value })} required /></label><label>Frequency<select value={moneySettings.depositFrequency} onChange={(event) => setMoneySettings({ ...moneySettings, depositFrequency: event.target.value })}><option value="weekly">Weekly</option><option value="fortnightly">Fortnightly</option><option value="monthly">Monthly</option></select></label><label>Protected savings<input min="0" type="number" value={moneySettings.savingsCommitment} onChange={(event) => setMoneySettings({ ...moneySettings, savingsCommitment: event.target.value })} required /></label></div><button className="button button--dark" type="submit">Save money settings</button></form><section className="invite-card"><span>Household invite code</span><strong>{household.inviteCode}</strong><p>Use this code only to join {household.name}. It does not expose a database ID.</p></section><section className="panel-card"><div className="panel-heading"><p className="eyebrow">MVP boundary</p><h2>Simulated banking only</h2><p>This version does not connect to bank accounts, hold money, process transfers, or provide credit.</p></div></section><section className="panel-card"><div className="panel-heading"><p className="eyebrow">Privacy rule</p><h2>Categories over merchants</h2><p>Parent endpoints receive aggregate teen spending categories. Personal merchant detail stays in the teen’s own view.</p></div></section></div></section>
      )}

      <p className="dashboard-footnote">Financial Habits Scores reflect positive behaviours—not income, wealth, or absolute savings.</p>
    </DashboardLayout>
  )
}

function LinkLikeJoin() {
  return <p className="empty-household__hint">The teen can join from the “Join a household” page.</p>
}

export default ParentDashboard
