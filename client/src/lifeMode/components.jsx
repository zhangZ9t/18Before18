import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  demoFlowCopy,
  loanRemaining,
  money,
  safeToSpend,
  unpaidTotal,
  weekMilestones,
} from './engine'

export function LifeToast({ message }) {
  if (!message) return null
  return <div className={`life-toast ${message ? 'is-show' : ''}`}>{message}</div>
}

export function Ledger({ txs, empty = 'No movements yet' }) {
  if (!txs.length) return <div className="life-empty">{empty}</div>
  return (
    <div className="life-ledger">
      <div className="life-ledger__head"><span>Date</span><span>Description</span><span>Amount</span></div>
      {txs.slice(0, 12).map((tx, index) => (
        <div className="life-ledger__row" key={`${tx.desc}-${tx.date}-${index}`}>
          <span className="life-ledger__date">{tx.date}</span>
          <div>
            <strong>{tx.desc}</strong>
            {tx.meta ? <small>{tx.meta}</small> : null}
          </div>
          <span className={tx.type === 'credit' ? 'is-credit' : 'is-debit'}>
            {tx.type === 'credit' ? '+' : '−'}{money(Math.abs(tx.amount))}
          </span>
        </div>
      ))}
    </div>
  )
}

export function WeekControls({ state, onStart, onEnd, onReset, role = 'parent' }) {
  const label =
    state.phase === 'idle' ? 'Waiting for parent' : state.phase === 'active' ? 'In progress' : 'Closed — review'
  const parentLabel =
    state.phase === 'idle' ? 'Ready to start' : state.phase === 'active' ? 'In progress' : 'Closed — review'
  const canStart = role === 'parent'
  const canReset = role === 'parent'

  return (
    <div className="life-week-bar">
      <div className="life-week-pill">
        Week <strong>{state.week}</strong>
        <span>· {role === 'parent' ? parentLabel : label}</span>
      </div>
      <div className="life-week-actions">
        {canStart ? (
          <button className="life-btn life-btn--accent" disabled={state.phase === 'active'} type="button" onClick={onStart}>
            Start week
          </button>
        ) : (
          <span className="life-week-note">
            {state.phase === 'idle' || state.phase === 'ended'
              ? 'Only your parent can start the week'
              : 'Week running'}
          </span>
        )}
        <button className="life-btn life-btn--dark" disabled={state.phase !== 'active'} type="button" onClick={onEnd}>
          End week
        </button>
        {canReset ? (
          <button className="life-btn life-btn--ghost" type="button" onClick={onReset}>
            Reset
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function DemoFlowStrip({ state, role }) {
  const flow = demoFlowCopy(state, role)
  return (
    <div className={`life-flow ${role === 'parent' ? 'life-flow--parent' : ''}`}>
      <div className="life-flow__step">{flow.step}</div>
      <div className="life-flow__copy">
        <strong>{flow.title}</strong>
        <p>{flow.body}</p>
      </div>
      {flow.href ? (
        <Link className="life-flow__cta" to={flow.href}>
          {flow.cta}
        </Link>
      ) : null}
    </div>
  )
}

export function WeekProgress({ state }) {
  const milestones = weekMilestones(state)
  return (
    <section className="life-progress" aria-label={`Week ${milestones.week} progress`}>
      <div className="life-progress__head">
        <div>
          <span className="life-progress__eyebrow">Week {milestones.week}</span>
          <h3>
            {state.phase === 'idle'
              ? 'Waiting for your deposit'
              : state.phase === 'ended'
                ? 'Week closed — nice work reviewing'
                : 'Your week in motion'}
          </h3>
        </div>
        <div className="life-progress__pct" aria-hidden="true">
          <strong>{milestones.progress}%</strong>
          <span>complete</span>
        </div>
      </div>

      <div className="life-progress__track" role="progressbar" aria-valuenow={milestones.progress} aria-valuemin={0} aria-valuemax={100}>
        <span className="life-progress__fill" style={{ width: `${milestones.progress}%` }} />
        <span className="life-progress__glow" style={{ left: `${milestones.progress}%` }} />
      </div>

      <ol className="life-progress__steps">
        {milestones.steps.map((step, index) => (
          <li
            key={step.id}
            className={[
              'life-progress__step',
              step.done ? 'is-done' : '',
              step.current ? 'is-current' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span className="life-progress__dot" aria-hidden="true">
              {step.done ? '✓' : index + 1}
            </span>
            <div>
              <strong>{step.label}</strong>
              <small>{step.detail}</small>
            </div>
          </li>
        ))}
      </ol>

      <div className="life-progress__chips">
        <span className="life-chip">{money(state.teenBalance)} balance</span>
        <span className="life-chip life-chip--coral">{money(unpaidTotal(state))} bills due</span>
        <span className="life-chip life-chip--lime">{money(Math.max(0, safeToSpend(state)))} safe</span>
        {state.activeLoan ? (
          <span className="life-chip life-chip--gold">
            Loan {money(loanRemaining(state))} left
          </span>
        ) : null}
        {state.carryDebt > 0 && state.phase === 'idle' ? (
          <span className="life-chip life-chip--warn">{money(state.carryDebt)} debt next payday</span>
        ) : null}
      </div>
    </section>
  )
}

export function BalanceCard({ label, amount, rows, tone = 'violet', flashKey }) {
  return (
    <div className={`life-balance life-balance--${tone}`} key={flashKey}>
      <div className="life-balance__label">{label}</div>
      <div className="life-balance__amount">{money(amount)}</div>
      {rows.map(([left, right]) => (
        <div className="life-balance__row" key={left}>
          <span>{left}</span>
          <strong>{right}</strong>
        </div>
      ))}
    </div>
  )
}

export function PushBanner({ banner, onOpen }) {
  if (!banner) return null
  return (
    <button className="life-push-banner is-show" type="button" onClick={onOpen}>
      <div className="life-push-banner__top">
        <span className="life-push-banner__icon">18</span>
        <span className="life-push-banner__app">18 Before 18</span>
        <span className="life-push-banner__time">now</span>
      </div>
      <strong>{banner.title}</strong>
      <p>{banner.preview}</p>
      <small>Tap to open coaching brief</small>
    </button>
  )
}

export function PushInbox({ pushes, onToggle }) {
  if (!pushes.length) {
    return (
      <div className="life-empty">
        No teaching moments yet. Close a week after the teen makes choices — or when bill money is at risk mid-week.
      </div>
    )
  }
  return (
    <div className="life-push-inbox">
      {pushes.map((item, index) => (
        <button
          className={`life-push-card ${item.open ? 'is-open' : ''}`}
          key={item.id}
          type="button"
          onClick={() => onToggle(index)}
        >
          <div className="life-push-card__top">
            <span className="life-push-banner__icon">18</span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.preview}</p>
            </div>
            <span className="life-push-card__time">{item.time}</span>
          </div>
          {item.open ? (
            <div className="life-push-card__detail">
              {item.mode ? (
                <span className="life-coach-modal__mode life-coach-modal__mode--inline">
                  {item.aiStatus === 'loading'
                    ? 'Analysing…'
                    : item.mode === 'fallback'
                      ? 'Offline summary'
                      : 'AI summary'}
                </span>
              ) : null}
              <span>What happened</span>
              <p>{item.what}</p>
              <span>Why talk about it</span>
              <p>{item.discussion || item.why}</p>
              <span>How to talk about it</span>
              <p>{item.how}</p>
              {item.suggestedQuestion ? (
                <>
                  <span>Try asking</span>
                  <p>“{item.suggestedQuestion}”</p>
                </>
              ) : null}
            </div>
          ) : null}
        </button>
      ))}
    </div>
  )
}

export function CoachingAlert({ alert, onClose, onRefresh, analysing = false }) {
  if (!alert) return null
  const loading = analysing || alert.aiStatus === 'loading'
  const mode = alert.mode
  return (
    <div className="life-coach-overlay" role="dialog" aria-modal="true" aria-labelledby="life-coach-title">
      <div className="life-coach-modal">
        <div className="life-coach-modal__flag-row">
          <div className="life-coach-modal__flag">AI parent prompt</div>
          <span className="life-coach-modal__mode">
            {loading ? 'Analysing…' : mode === 'gemini' || mode === 'openai' ? 'AI summary' : mode === 'fallback' ? 'Offline summary' : 'Ready'}
          </span>
        </div>
        <h2 id="life-coach-title">{alert.summary || alert.title}</h2>
        {loading ? (
          <p className="life-coach-modal__loading">Reading this week’s Life Mode choices…</p>
        ) : null}
        <div className="life-coach-modal__block">
          <span>What happened</span>
          <p>{alert.what}</p>
        </div>
        <div className="life-coach-modal__block">
          <span>Why talk about it</span>
          <p>{alert.discussion || alert.why}</p>
        </div>
        <div className="life-coach-modal__block">
          <span>How to talk about it</span>
          <p>{alert.how}</p>
        </div>
        {alert.suggestedQuestion ? (
          <div className="life-coach-modal__ask">
            <span>Try asking</span>
            <blockquote>“{alert.suggestedQuestion}”</blockquote>
          </div>
        ) : null}
        <div className="life-coach-modal__actions">
          <button className="life-btn life-btn--accent" type="button" onClick={onClose} disabled={loading}>
            Got it — I’ll talk with them
          </button>
          {onRefresh ? (
            <button className="life-btn life-btn--ghost" disabled={loading} type="button" onClick={onRefresh}>
              {loading ? 'Analysing…' : 'Refresh analysis'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function LoanApplyModal({ open, onConfirm, onCancel }) {
  const bodyRef = useRef(null)
  const [unlocked, setUnlocked] = useState(false)
  const [purpose, setPurpose] = useState('Sneakers')
  const [amount, setAmount] = useState(120)
  const [weekly, setWeekly] = useState(30)

  useEffect(() => {
    if (!open) return undefined
    setUnlocked(false)
    setPurpose('Sneakers')
    setAmount(120)
    setWeekly(30)
    const frame = window.requestAnimationFrame(() => {
      const el = bodyRef.current
      if (!el) return
      el.scrollTop = 0
      if (el.scrollHeight <= el.clientHeight + 8) setUnlocked(true)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  if (!open) return null

  const total = Math.max(0, Math.round(Number(amount) || 0))
  const weeklyPay = Math.max(0, Math.round(Number(weekly) || 0))
  const weeks = weeklyPay > 0 ? Math.ceil(total / weeklyPay) : 0
  const formOk = purpose.trim().length > 0 && total >= 20 && weeklyPay >= 5 && weeklyPay <= total

  const onScroll = () => {
    const el = bodyRef.current
    if (!el || unlocked) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setUnlocked(true)
  }

  return (
    <div
      className="life-loan-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="life-loan-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <div className="life-loan-modal">
        <div className="life-loan-modal__head">
          <span className="life-loan-modal__flag">Before you borrow</span>
          <h2 id="life-loan-title">This is a loan — future money, today.</h2>
          <p>
            Your parent allowed loans in Life Mode. Read what that means, say what the money is for, and
            choose how much you’ll pay back each week.
          </p>
        </div>
        <div className="life-loan-modal__body" ref={bodyRef} onScroll={onScroll}>
          <h3>What a loan actually is</h3>
          <p>
            You get money in your account now. You don’t “own” that money free and clear — you owe it back,
            on a schedule, from future paydays. Miss bills because of it and next week arrives shorter.
          </p>

          <h3>What you’ll feel later</h3>
          <p>
            Every payday, your weekly repayment comes out before free spending. The sneakers / bike / whatever
            already happened. The payment is still coming.
          </p>

          <div className="life-loan-warn">
            <strong>Pause here.</strong> If you can’t explain why you need it and how you’ll still cover bills,
            walking away is the win.
          </div>

          <h3>Your application</h3>
          <label className="life-loan-field">
            <span>What do you want the money for?</span>
            <input
              type="text"
              maxLength={48}
              value={purpose}
              onChange={(event) => setPurpose(event.target.value)}
              placeholder="e.g. Sneakers, bike, headphones"
            />
          </label>
          <div className="life-loan-chips">
            {['Sneakers', 'City bike', 'Headphones', 'Concert tickets'].map((chip) => (
              <button key={chip} type="button" onClick={() => setPurpose(chip)}>
                {chip}
              </button>
            ))}
          </div>

          <div className="life-loan-fields">
            <label className="life-loan-field">
              <span>How much do you need?</span>
              <input
                type="number"
                min="20"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            <label className="life-loan-field">
              <span>Pay back per week</span>
              <input
                type="number"
                min="5"
                value={weekly}
                onChange={(event) => setWeekly(event.target.value)}
              />
            </label>
          </div>

          <div className="life-loan-summary">
            <div className="life-loan-line">
              <span>Lands in your account today</span>
              <strong>{money(total)}</strong>
            </div>
            <div className="life-loan-line">
              <span>Weekly repayment</span>
              <strong>{money(weeklyPay)}</strong>
            </div>
            <div className="life-loan-line">
              <span>About how long</span>
              <strong>{weeks > 0 ? `~${weeks} week${weeks === 1 ? '' : 's'}` : '—'}</strong>
            </div>
          </div>
        </div>
        <div className="life-loan-modal__foot">
          <div className={`life-loan-scroll-hint ${unlocked ? 'is-hidden' : ''}`}>
            ↓ Scroll to finish reading and fill your application
          </div>
          <button
            className="life-btn life-btn--accent"
            style={{ width: '100%' }}
            disabled={!unlocked || !formOk}
            type="button"
            onClick={() =>
              onConfirm({
                purpose: purpose.trim(),
                amount: total,
                weekly: weeklyPay,
              })
            }
          >
            Accept loan — money becomes real
          </button>
          <button className="life-loan-cancel" type="button" onClick={onCancel}>
            Never mind, go back
          </button>
        </div>
      </div>
    </div>
  )
}
