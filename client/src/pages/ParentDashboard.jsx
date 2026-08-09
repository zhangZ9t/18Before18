import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import DashboardLayout from '../components/DashboardLayout'
import MetricCard from '../components/MetricCard'
import ReportView from '../components/ReportView'
import StatusState from '../components/StatusState'
import LifeModeParentPanel from '../lifeMode/LifeModeParentPanel'
import { formatDate, formatMoney } from '../utils/formatters'

const navItems = [
  { id: 'life', label: 'Life Mode' },
  { id: 'overview', label: 'Overview' },
  { id: 'responsibilities', label: 'Responsibilities' },
  { id: 'reports', label: 'Reports' },
  { id: 'household', label: 'Household' },
  { id: 'settings', label: 'Settings' },
]

const DEMO_PARENT_OVERVIEW = {
  household: {
    name: 'Demo Family',
    inviteCode: 'LIFE18',
    independenceLevel: 2,
    weeklyDeposit: 200,
    savingsCommitment: 30,
    depositFrequency: 'weekly',
    householdCategories: [
      { name: 'Groceries', weeklyBudget: 120, visibleToTeen: true },
      { name: 'Transport', weeklyBudget: 40, visibleToTeen: true },
    ],
    independenceRequest: null,
  },
  teen: { id: 'demo-teen', name: 'Jamie' },
  weeklyOverview: {
    weeklyDeposit: 200,
    safeToSpend: 85,
    billsPaid: 1,
    billsDue: 4,
    savingsGoal: { name: 'Headphones', progressPercentage: 40 },
    habits: { score: 72 },
    independenceLevel: 2,
  },
  spendingByCategory: [
    { category: 'Food', amount: 48 },
    { category: 'Entertainment', amount: 30 },
  ],
  responsibilities: [
    { id: '1', name: 'Rent', amount: 40, dueDate: new Date().toISOString(), status: 'due' },
    { id: '2', name: 'Groceries', amount: 25, dueDate: new Date().toISOString(), status: 'paid' },
  ],
  pendingAdvances: [],
  conversationPrompt: null,
}

function ParentDashboard() {
  const [activeTab, setActiveTab] = useState('life')
  const [overview, setOverview] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [report, setReport] = useState(undefined)
  const [advice, setAdvice] = useState(null)
  const [adviceStatus, setAdviceStatus] = useState('idle')
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
    } catch {
      setOverview(DEMO_PARENT_OVERVIEW)
      setMoneySettings({
        weeklyDeposit: DEMO_PARENT_OVERVIEW.household.weeklyDeposit,
        savingsCommitment: DEMO_PARENT_OVERVIEW.household.savingsCommitment,
        depositFrequency: DEMO_PARENT_OVERVIEW.household.depositFrequency,
      })
      setStatus('success')
      setNotice('Demo mode — Life Mode is live. Other tabs use sample data until you sign in.')
    }
  }, [])

  const loadAdvice = useCallback(async () => {
    setAdviceStatus('loading')
    try {
      const data = await api.post('/ai/spending-discussion')
      setAdvice(data.discussion)
      setAdviceStatus('success')
      // The server stores this wording on the prompt, so mirror it without another round trip.
      if (data.discussion.mode !== 'fallback') {
        setOverview((current) => (current?.conversationPrompt ? { ...current, conversationPrompt: { ...current.conversationPrompt, insight: data.discussion.summary, suggestedQuestion: data.discussion.suggestedQuestion || current.conversationPrompt.suggestedQuestion, mode: data.discussion.mode } } : current))
      }
    } catch (requestError) {
      // Don't spam the dashboard banner for coach rate-limits / offline AI.
      setAdviceStatus('error')
      setAdvice({
        mode: 'fallback',
        summary: 'Coach is taking a short break.',
        discussion:
          'Use Life Mode → End week for a live parent coaching alert (what / why / how). Or tap Analyse spending again in a minute.',
        suggestedQuestion: 'What got in the way of paying bills before free spending this week?',
        analysis: { total: 0, categoryCount: 0 },
      })
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
      .catch(() => {
        // Hackathon demo: keep Life Mode + illustrative sections without forcing login.
        setOverview(DEMO_PARENT_OVERVIEW)
        setMoneySettings({
          weeklyDeposit: DEMO_PARENT_OVERVIEW.household.weeklyDeposit,
          savingsCommitment: DEMO_PARENT_OVERVIEW.household.savingsCommitment,
          depositFrequency: DEMO_PARENT_OVERVIEW.household.depositFrequency,
        })
        setStatus('success')
        setNotice('Demo mode — Life Mode is live. Other tabs use sample data until you sign in.')
      })
  }, [])

  useEffect(() => {
    if (activeTab === 'reports' && report === undefined) {
      api
        .get('/reports/current')
        .then((data) => setReport(data.report))
        .catch(() => setReport(null))
    }
  }, [activeTab, report])

  const updatePrompt = async (promptStatus) => {
    if (!overview?.conversationPrompt?.id || String(overview.conversationPrompt.id).startsWith('demo')) {
      setNotice('Demo mode — use Life Mode End week for a live coaching alert.')
      return
    }
    await api.patch(`/prompts/${overview.conversationPrompt.id}`, { status: promptStatus })
    setNotice(promptStatus === 'discussed' ? 'Conversation marked as discussed.' : 'Prompt dismissed. The next pattern will take its place.')
    setAdvice(null)
    setAdviceStatus('idle')
    await loadOverview()
  }

  const updateHousehold = async (changes, successMessage) => {
    try {
      await api.patch('/household', changes)
      setNotice(successMessage)
      await loadOverview()
    } catch {
      setNotice('Demo mode — change weekly rules inside Life Mode.')
    }
  }

  const toggleVisibility = async (category) => {
    try {
      await api.patch('/household/visibility', {
        categories: [{ name: category.name, visibleToTeen: !category.visibleToTeen }],
      })
      setNotice(`${category.name} visibility updated.`)
      await loadOverview()
    } catch {
      setNotice('Demo mode — visibility toggles are illustrative here.')
    }
  }

  const decideIndependence = async (decision) => {
    try {
      await api.patch('/household/independence/decision', { decision })
      setNotice(`Responsibility request ${decision}.`)
      await loadOverview()
    } catch {
      setNotice('Demo mode — independence requests need a signed-in household.')
    }
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
    } catch {
      setNotice('Demo mode — add bills from Life Mode weekly rules instead.')
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
    try {
      await api.patch(`/advances/${id}/${decision}`)
      setNotice(`Family Advance ${decision === 'approve' ? 'approved' : 'declined'}.`)
      await loadOverview()
    } catch {
      setNotice('Demo mode — try a loan inside Life Mode instead.')
    }
  }

  if (activeTab !== 'life') {
    if (status === 'loading') {
      return <main className="centered-page"><StatusState title="Preparing the family overview" message="Looking for one useful learning picture…" /></main>
    }
    if (status === 'error') {
      return <main className="centered-page"><StatusState type="error" title="We couldn’t open the parent dashboard" message={error} action={<button className="button button--dark" type="button" onClick={loadOverview}>Try again</button>} /></main>
    }
  }

  if (activeTab !== 'life' && overview && !overview.teen) {
    return (
      <DashboardLayout role="parent" navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
        <section className="empty-household"><p className="eyebrow">Household ready</p><h1>Invite your teenager.</h1><p>Share this private code. It joins their account to {overview.household.name} without exposing database details.</p><strong>{overview.household.inviteCode}</strong><LinkLikeJoin /></section>
      </DashboardLayout>
    )
  }

  const household = overview?.household
  const teen = overview?.teen
  const weekly = overview?.weeklyOverview
  const maxCategory = overview ? Math.max(1, ...overview.spendingByCategory.map(({ amount }) => amount)) : 1

  return (
    <DashboardLayout role="parent" navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab}>
      {notice && <div className="notice-banner" role="status"><span>✓</span>{notice}<button aria-label="Dismiss message" type="button" onClick={() => setNotice('')}>×</button></div>}
      {error && status !== 'error' && <div className="notice-banner notice-banner--error" role="alert"><span>!</span>{error}<button aria-label="Dismiss error" type="button" onClick={() => setError('')}>×</button></div>}

      {activeTab === 'life' && (
        <LifeModeParentPanel parentName="Alex" teenName={teen?.name || 'Jamie'} />
      )}

      {activeTab === 'overview' && overview && (
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

              {overview.conversationPrompt && <><h2>{overview.conversationPrompt.insight}</h2><span className="conversation-card__try">Try asking</span><blockquote>“{overview.conversationPrompt.suggestedQuestion}”</blockquote></>}

              {!overview.conversationPrompt && <h2>{advice ? advice.summary : adviceStatus === 'loading' ? 'Reading this week’s spending…' : 'No conversation prompt this week.'}</h2>}

              {advice && (
                <div className="conversation-card__analysis">
                  {overview.conversationPrompt && advice.summary !== overview.conversationPrompt.insight && <><span className="conversation-card__try">Spending pattern</span><p className="conversation-card__summary">{advice.summary}</p></>}
                  {advice.analysis.total > 0 && (
                    <div className="conversation-card__facts">
                      <span>{formatMoney(advice.analysis.total)} spent</span>
                      {advice.analysis.topCategory && <span>{advice.analysis.topCategory} · {advice.analysis.topShare}%</span>}
                      <span>{advice.analysis.categoryCount} categor{advice.analysis.categoryCount === 1 ? 'y' : 'ies'}</span>
                      {advice.analysis.windowDays && <span>last {advice.analysis.windowDays} days</span>}
                    </div>
                  )}
                  <p>{advice.discussion}</p>
                </div>
              )}

              {!overview.conversationPrompt && !advice && <p className="conversation-card__analysis">{adviceStatus === 'loading' ? 'The coach is checking category patterns for one thing worth raising.' : 'Everything looks steady. Ask the coach to read this week’s spending for a starting point.'}</p>}

              {!overview.conversationPrompt && advice?.suggestedQuestion && <><span className="conversation-card__try">Try asking</span><blockquote>“{advice.suggestedQuestion}”</blockquote></>}

              <div>
                {overview.conversationPrompt && <><button className="button button--lime button--small" type="button" onClick={() => updatePrompt('discussed')}>Mark as discussed</button><button className="text-button" type="button" onClick={() => updatePrompt('dismissed')}>Dismiss</button></>}
                <button className="text-button" disabled={adviceStatus === 'loading'} type="button" onClick={loadAdvice}>{adviceStatus === 'loading' ? 'Analysing…' : advice ? 'Refresh analysis' : 'Analyse spending'}</button>
                {advice && <span className="conversation-card__mode">{advice.mode === 'fallback' ? 'Offline summary' : 'AI summary'}</span>}
              </div>
            </section>

            <section className="panel-card"><div className="panel-heading panel-heading--split"><div><p className="eyebrow">Privacy-aware spending</p><h2>By category</h2></div><span className="privacy-badge">No merchants</span></div>{overview.spendingByCategory.length === 0 ? <div className="empty-card"><h3>No spending yet</h3><p>Category patterns will appear after transactions are recorded.</p></div> : <div className="spending-bars">{overview.spendingByCategory.map(({ category, amount }) => <div key={category}><span>{category}</span><div><i style={{ width: `${(amount / maxCategory) * 100}%` }} /></div><strong>{formatMoney(amount)}</strong></div>)}</div>}<p className="privacy-note">Merchant and product details are deliberately excluded from this view.</p></section>
          </div>

          {household.independenceRequest?.status === 'pending' && <section className="request-banner"><div><p className="eyebrow">Responsibility request</p><h2>{teen.name.split(' ')[0]} is asking to move to Level {household.independenceRequest.requestedLevel}.</h2><p>Use the request to discuss readiness, not just to approve a setting.</p></div><div><button className="button button--dark button--small" type="button" onClick={() => decideIndependence('approved')}>Approve</button><button className="button button--ghost button--small" type="button" onClick={() => decideIndependence('declined')}>Decline</button></div></section>}

          {overview.pendingAdvances.length > 0 && <section className="panel-card"><div className="panel-heading"><p className="eyebrow">Family Advance requests</p><h2>Future weekly money</h2></div><div className="advance-request-list">{overview.pendingAdvances.map((advance) => <article key={advance._id}><div><strong>{advance.itemName}</strong><span>{formatMoney(advance.amountAdvanced)} · {formatMoney(advance.installmentAmount)} × {advance.installmentCount} weeks</span></div><p>This commits future money; it does not reduce the cost.</p><div><button className="button button--dark button--small" type="button" onClick={() => decideAdvance(advance._id, 'approve')}>Approve</button><button className="text-button" type="button" onClick={() => decideAdvance(advance._id, 'decline')}>Decline</button></div></article>)}</div></section>}
        </>
      )}

      {activeTab === 'responsibilities' && overview && (
        <section className="dashboard-section"><header className="dashboard-title-row"><div><p className="eyebrow">Responsibilities</p><h1>Hand over real responsibility gradually.</h1><p>Assigned bills become visible commitments, with consequences explained before they are missed.</p></div></header><div className="two-column-grid"><section className="panel-card"><div className="panel-heading"><p className="eyebrow">Assigned to {teen.name.split(' ')[0]}</p><h2>Current responsibilities</h2></div><div className="parent-responsibility-list">{overview.responsibilities.map((item) => <article key={item.id}><span className={`status-dot status-dot--${item.status}`} /><div><strong>{item.name}</strong><span>{formatMoney(item.amount)} · {formatDate(item.dueDate)}</span></div><span className={`status-pill status-pill--${item.status}`}>{item.status}</span></article>)}</div></section><form className="form-card" onSubmit={addResponsibility}><div className="panel-heading"><p className="eyebrow">Add one commitment</p><h2>Create a learning opportunity</h2></div><div className="form-grid"><label>Name<input value={responsibilityForm.name} onChange={(event) => setResponsibilityForm({ ...responsibilityForm, name: event.target.value })} required /></label><label>Category<input value={responsibilityForm.category} onChange={(event) => setResponsibilityForm({ ...responsibilityForm, category: event.target.value })} required /></label><label>Amount<input min="1" type="number" value={responsibilityForm.amount} onChange={(event) => setResponsibilityForm({ ...responsibilityForm, amount: event.target.value })} required /></label><label>Due date<input type="date" value={responsibilityForm.dueDate} onChange={(event) => setResponsibilityForm({ ...responsibilityForm, dueDate: event.target.value })} required /></label></div><button className="button button--dark" type="submit">Add responsibility</button></form></div></section>
      )}

      {activeTab === 'reports' && overview && (
        <section className="dashboard-section"><header className="dashboard-title-row"><div><p className="eyebrow">Weekly report</p><h1>A conversation starter, not a scorecard.</h1><p>Patterns are framed around behaviour, follow-through, and improvement.</p></div></header>{report === undefined ? <StatusState title="Loading this week’s report" /> : <ReportView report={report} role="parent" />}</section>
      )}

      {activeTab === 'household' && overview && (
        <section className="dashboard-section"><header className="dashboard-title-row"><div><p className="eyebrow">Household controls</p><h1>Choose what supports learning.</h1><p>Share useful categories without exposing salary, mortgage details, balances, or sensitive transactions.</p></div></header><div className="two-column-grid"><section className="panel-card"><div className="panel-heading"><p className="eyebrow">Graduated independence</p><h2>Current level: {household.independenceLevel}</h2></div><div className="level-selector">{[['1','Starter','Pocket money, savings, entertainment'],['2','Explorer','Phone, transport, lunch'],['3','Independent','Subscriptions, groceries, larger budget'],['4','Ready','Minimal parental intervention']].map(([level, label, copy]) => <button className={household.independenceLevel === Number(level) ? 'is-active' : ''} key={level} type="button" onClick={() => updateHousehold({ independenceLevel: Number(level) }, `Independence updated to Level ${level}.`)}><span>{level}</span><div><strong>{label}</strong><small>{copy}</small></div></button>)}</div></section><section className="panel-card"><div className="panel-heading"><p className="eyebrow">Household visibility</p><h2>Shared with the teen</h2></div><div className="toggle-list">{household.householdCategories.map((category) => <div key={category.name}><div><strong>{category.name}</strong><span>{formatMoney(category.weeklyBudget)} / week</span></div><button aria-pressed={category.visibleToTeen} className={category.visibleToTeen ? 'is-on' : ''} type="button" onClick={() => toggleVisibility(category)}><span /></button></div>)}</div></section></div></section>
      )}

      {activeTab === 'settings' && overview && (
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
