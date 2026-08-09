import { useState } from 'react'
import {
  BalanceCard,
  DemoFlowStrip,
  Ledger,
  LifeToast,
  LoanApplyModal,
  WeekControls,
  WeekProgress,
} from './components'
import {
  BILL_META,
  MERCHANTS,
  enabledBillKeys,
  isEnabled,
  loanRemaining,
  loanWeeksLeft,
  money,
  safeToSpend,
  savingsTarget,
  teenCoachMessage,
  unpaidTotal,
} from './engine'
import './lifeMode.css'
import { useLifeMode } from './useLifeMode'

function LifeModeTeenPanel({ parentName = 'Alex', teenName = 'Jamie' }) {
  const [merchant, setMerchant] = useState(MERCHANTS[0].value)
  const [spendAmount, setSpendAmount] = useState(28)
  const [loanOpen, setLoanOpen] = useState(false)
  const life = useLifeMode({ parentName, teenName })
  const { state } = life
  const unpaid = unpaidTotal(state)
  const safe = safeToSpend(state)
  const save = savingsTarget(state)
  const remainingLoan = loanRemaining(state)
  const bills = enabledBillKeys(state)
  const loansAllowed = isEnabled(state, 'loans')
  const weekLive = state.phase === 'active'
  const balanceRows = [
    ['Unpaid bills', money(unpaid)],
    ...(isEnabled(state, 'save') ? [['Savings target', money(save)]] : []),
    ...(remainingLoan > 0 ? [['Loan still owed', money(remainingLoan)]] : []),
    ['Safe to spend', money(Math.max(0, safe))],
  ]

  return (
    <>
      <div className="life-shell">
        <header className="life-hero">
          <div>
            <span className="life-badge">Teen · Life Mode</span>
            <h1>Your week, for real.</h1>
            <p>
              Same shared demo as Parent. Pay bills back to {state.parentName.split(' ')[0]}, spend with the
              card, or apply for a loan — unpaid bills and repayments hit the next payday.
            </p>
          </div>
          <WeekControls
            role="teen"
            state={state}
            onStart={life.startWeek}
            onEnd={life.endWeek}
            onReset={life.reset}
          />
        </header>

        <DemoFlowStrip state={state} role="teen" />
        <WeekProgress state={state} />

        <div className="life-grid">
          <section className="life-panel">
            <div className="life-profile">
              <div className="life-avatar">🧑‍🚀</div>
              <div>
                <h2>{state.teenName.split(' ')[0]}</h2>
                <small>
                  {weekLive
                    ? 'Week is live — only what your parent enabled shows here.'
                    : state.phase === 'ended'
                      ? 'Week closed. Download your summary or wait for the next deposit.'
                      : 'Waiting for your parent to start the week.'}
                </small>
              </div>
            </div>

            <BalanceCard
              label="Real account balance"
              amount={state.teenBalance}
              flashKey={`${state.teenBalance}-${state.teenTx.length}`}
              rows={balanceRows}
            />

            <div className="life-section-title">Bills → back to parent</div>
            {bills.length === 0 ? (
              <div className="life-empty">No bills assigned. Parent can enable them before Start week.</div>
            ) : (
              <div className="life-bills">
                {bills.map((key) => {
                  const paid = state.paid[key]
                  const amount = state.rules[key]
                  const meta = BILL_META[key]
                  return (
                    <div className="life-bill" key={key}>
                      <div className="life-bill__left">
                        <div className="life-bill__icon">{meta.icon}</div>
                        <div>
                          <strong>{meta.name}</strong>
                          <small>{paid ? 'Returned to parent' : 'Due · pays parent'}</small>
                        </div>
                      </div>
                      <div className="life-bill__right">
                        <strong>{money(amount)}</strong>
                        {paid ? (
                          <span className="life-status life-status--paid">Paid</span>
                        ) : weekLive ? (
                          <button className="life-pay" type="button" onClick={() => life.payBill(key)}>
                            Pay
                          </button>
                        ) : (
                          <span className="life-status life-status--due">Due</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className={`life-spend ${weekLive ? '' : 'is-dimmed'}`}>
              <strong style={{ fontSize: 12 }}>Card spend</strong>
              <select
                value={merchant}
                disabled={!weekLive}
                onChange={(event) => setMerchant(event.target.value)}
              >
                {MERCHANTS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <div className="life-spend__row">
                <input
                  type="number"
                  min="1"
                  disabled={!weekLive}
                  value={spendAmount}
                  onChange={(event) => setSpendAmount(event.target.value)}
                />
                <button
                  className="life-btn life-btn--dark"
                  disabled={!weekLive}
                  type="button"
                  onClick={() => life.cardSpend(merchant, spendAmount)}
                >
                  Pay with card
                </button>
              </div>
              <p className="life-hint" style={{ margin: 0 }}>
                Blow the bill money → next deposit arrives short. Parent gets a teaching push.
              </p>
            </div>

            <div className="life-section-title">Loan</div>
            {state.activeLoan ? (
              <div className="life-loan-active">
                <div className="life-loan-active__icon">💸</div>
                <div>
                  <strong>{state.activeLoan.purpose}</strong>
                  <small>
                    {money(state.activeLoan.weekly)} / week · ~{loanWeeksLeft(state.activeLoan)} week
                    {loanWeeksLeft(state.activeLoan) === 1 ? '' : 's'} left · {money(remainingLoan)} still
                    owed
                  </small>
                </div>
              </div>
            ) : loansAllowed ? (
              <div className={`life-loan-cta ${weekLive ? '' : 'is-dimmed'}`}>
                <div>
                  <strong>Need money for something bigger?</strong>
                  <small>
                    Your parent allowed loans. Say what it’s for and how much you’ll pay each week — then the
                    money lands for real in this demo.
                  </small>
                </div>
                <button
                  className="life-btn life-btn--dark"
                  type="button"
                  disabled={!weekLive}
                  onClick={() => setLoanOpen(true)}
                >
                  Apply for a loan
                </button>
              </div>
            ) : (
              <div className="life-empty">Loans are off. Ask your parent to allow them before Start week.</div>
            )}

            <div className="life-ai">
              <small>AI COACH</small>
              {teenCoachMessage(state)}
            </div>
          </section>

          <aside className="life-side">
            <div className="life-section-title" style={{ marginTop: 0 }}>
              Live bank extract
            </div>
            <Ledger txs={state.teenTx} empty="No movements yet — waiting for deposit." />
            <div style={{ marginTop: 14 }}>
              <button
                className="life-btn life-btn--ghost"
                style={{ width: '100%' }}
                disabled={state.weekHistory.length === 0}
                type="button"
                onClick={life.downloadSummary}
              >
                Download weekly summary
              </button>
            </div>
          </aside>
        </div>
      </div>
      <LifeToast message={state.toast} />
      <LoanApplyModal
        open={loanOpen}
        onCancel={() => {
          setLoanOpen(false)
          life.declineLoan()
        }}
        onConfirm={(payload) => {
          life.applyLoan(payload)
          setLoanOpen(false)
        }}
      />
    </>
  )
}

export default LifeModeTeenPanel
