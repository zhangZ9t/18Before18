import { formatMoney } from '../utils/formatters'

function ReportView({ report, role }) {
  if (!report) {
    return <div className="empty-card"><h3>No weekly report yet</h3><p>Your first summary will appear as financial activity is recorded.</p></div>
  }

  const categories = role === 'parent' ? report.spendingByCategory : report.ownSpendingByCategory
  return (
    <div className="report-layout">
      <section className="score-card">
        <p className="eyebrow">Financial Habits Score</p>
        <div className="score-card__score"><strong>{report.habits.score}</strong><span>/ 100</span></div>
        <p>Behaviour and improvement—not income, wealth, or account balance.</p>
        <div className="score-breakdown">
          {Object.entries(report.habits.breakdown).map(([label, score]) => (
            <div key={label}><span>{label.replace(/([A-Z])/g, ' $1')}</span><div><i style={{ width: `${(score / 20) * 100}%` }} /></div><strong>{score}/20</strong></div>
          ))}
        </div>
      </section>
      <section className="report-summary-card">
        <p className="eyebrow">This week</p><h2>Learning summary</h2><p>{report.summary}</p>
        <div className="report-mini-grid">
          <article><span>Saved</span><strong>{formatMoney(report.savingsAdded)}</strong></article>
          <article><span>Bills paid</span><strong>{report.billsPaid}</strong></article>
          <article><span>Bills missed</span><strong>{report.billsMissed}</strong></article>
          <article><span>Goal progress</span><strong>{report.goalProgress}%</strong></article>
        </div>
        <div className="category-list category-list--compact">
          {Object.entries(categories || {}).map(([category, amount]) => <div key={category}><span>{category}</span><strong>{formatMoney(amount)}</strong></div>)}
        </div>
        {role === 'teen' && Object.keys(report.sharedHouseholdCategories || {}).length > 0 && <><p className="eyebrow">Household categories shared with you</p><div className="category-list category-list--compact">{Object.entries(report.sharedHouseholdCategories).map(([category, amount]) => <div key={category}><span>{category}</span><strong>{formatMoney(amount)} / week</strong></div>)}</div></>}
      </section>
    </div>
  )
}

export default ReportView
