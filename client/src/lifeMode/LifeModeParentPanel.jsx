import {
  BalanceCard,
  CoachingAlert,
  DemoFlowStrip,
  Ledger,
  LifeToast,
  PushBanner,
  PushInbox,
  WeekControls,
} from './components'
import { RULE_FIELDS, loanRemaining, money, unpaidTotal, weekMilestones } from './engine'
import './lifeMode.css'
import { useLifeMode } from './useLifeMode'

function LifeModeParentPanel({ parentName = 'Alex', teenName = 'Jamie' }) {
  const life = useLifeMode({ parentName, teenName, isParentView: true })
  const { state } = life
  const unpaid = unpaidTotal(state)
  const remainingLoan = loanRemaining(state)
  const milestones = weekMilestones(state)

  return (
    <>
      <div className="life-shell life-shell--parent">
        <header className="life-hero">
          <div>
            <span className="life-badge">Parent · Life Mode</span>
            <h1>Live money loop for {state.teenName.split(' ')[0]}.</h1>
            <p>
              You set the world. {state.teenName.split(' ')[0]} lives it on Teen. Same shared state — Start week
              here, watch bills / spends / loans land, End week for a coaching alert.
            </p>
          </div>
          <WeekControls
            role="parent"
            state={state}
            onStart={life.startWeek}
            onEnd={life.endWeek}
            onReset={life.reset}
          />
        </header>

        <DemoFlowStrip state={state} role="parent" />
        <PushBanner banner={state.banner} onOpen={life.openBannerPush} />

        <div className="life-parent-status">
          <div>
            <span>Teen week pulse</span>
            <strong>
              {state.phase === 'idle'
                ? 'Not started'
                : state.phase === 'active'
                  ? `${milestones.progress}% · live`
                  : 'Closed'}
            </strong>
          </div>
          <div>
            <span>Bills returned</span>
            <strong>
              {milestones.paidCount}/{milestones.billTotal || 0}
            </strong>
          </div>
          <div>
            <span>Card spend</span>
            <strong>{money(state.funSpend)}</strong>
          </div>
          <div>
            <span>Loan outstanding</span>
            <strong>{remainingLoan > 0 ? money(remainingLoan) : '—'}</strong>
          </div>
        </div>

        <div className="life-grid">
          <section className="life-panel">
            <div className="life-profile">
              <div className="life-avatar">👪</div>
              <div>
                <h2>{state.parentName.split(' ')[0]}</h2>
                <small>
                  {state.phase === 'active'
                    ? 'Rules locked while the week runs — switch to Teen to see their choices.'
                    : 'Set deposit, bills, and loans — then Start week.'}
                </small>
              </div>
            </div>

            <BalanceCard
              tone="ink"
              label="Linked bank balance (simulated)"
              amount={state.parentBalance}
              flashKey={`${state.parentBalance}-${state.parentTx.length}`}
              rows={[
                ['Weekly deposit', money(state.rules.income)],
                ['Bills returned this week', money(state.returnedThisWeek)],
                ['Next debt recovery', money(state.phase === 'active' ? unpaid : state.carryDebt)],
                ...(state.activeLoan
                  ? [
                      [
                        `Loan · ${state.activeLoan.purpose}`,
                        `${money(remainingLoan)} left · ${money(state.activeLoan.weekly)}/wk`,
                      ],
                    ]
                  : []),
              ]}
            />

            <div className="life-section-title">Weekly rules · toggle what the teen sees</div>
            <div className="life-config">
              {RULE_FIELDS.map(({ key, label, alwaysOn, toggleOnly }) => {
                const on = alwaysOn || Boolean(state.enabled?.[key])
                return (
                  <div
                    className={`life-rule ${on ? 'is-on' : 'is-off'}${toggleOnly ? ' life-rule--toggle' : ''}`}
                    key={key}
                  >
                    <div className="life-rule__head">
                      <label htmlFor={toggleOnly ? undefined : `parent-life-${key}`}>{label}</label>
                      {alwaysOn ? (
                        <span className="life-rule__locked">Always on</span>
                      ) : (
                        <button
                          aria-pressed={on}
                          className={`life-toggle ${on ? 'is-on' : ''}`}
                          disabled={state.phase === 'active'}
                          type="button"
                          onClick={() => life.toggleEnabled(key)}
                        >
                          <span />
                          {on ? (key === 'loans' ? 'Allowed' : 'On teen') : key === 'loans' ? 'Off' : 'Hidden'}
                        </button>
                      )}
                    </div>
                    {toggleOnly ? (
                      <p className="life-rule__note">
                        {on
                          ? 'Teen can apply: purpose + weekly repayment. Money moves parent → teen for real in the demo.'
                          : 'Teen won’t see loan applications until you allow them.'}
                      </p>
                    ) : (
                      <input
                        id={`parent-life-${key}`}
                        type="number"
                        min="0"
                        disabled={state.phase === 'active' || (!alwaysOn && !on)}
                        value={state.rules[key]}
                        onChange={(event) => life.setRules({ [key]: event.target.value })}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            <div className="life-section-title">Live bank extract</div>
            <Ledger txs={state.parentTx} />
          </section>

          <aside className="life-side">
            <div className="life-section-title" style={{ marginTop: 0 }}>
              Push inbox · coaching
            </div>
            <p className="life-hint" style={{ marginTop: 0 }}>
              Mid-week risk and End week both land here. Open a card for What happened · Why talk · How to say
              it — then switch to Teen for the next payday.
            </p>
            <PushInbox pushes={state.pushes} onToggle={life.togglePush} />
          </aside>
        </div>
      </div>
      <LifeToast message={state.toast} />
      <CoachingAlert alert={state.coachAlert} onClose={life.dismissCoachAlert} />
    </>
  )
}

export default LifeModeParentPanel
