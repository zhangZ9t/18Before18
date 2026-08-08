import './SafeToSpendCard.css'

const formatMoney = (amount) =>
  new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0,
  }).format(amount)

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.75c.75 5.22 4.03 8.5 9.25 9.25-5.22.75-8.5 4.03-9.25 9.25C11.25 16.03 7.97 12.75 2.75 12 7.97 11.25 11.25 7.97 12 2.75Z" />
    </svg>
  )
}

function SafeToSpendCard({ safeToSpend }) {
  return (
    <article className="safe-to-spend-card">
      <div className="safe-to-spend-card__topline">
        <span className="safe-to-spend-card__icon">
          <SparkIcon />
        </span>
        <span className="safe-to-spend-card__badge">Yours to use</span>
      </div>

      <div>
        <p className="safe-to-spend-card__label">Safe to spend</p>
        <p className="safe-to-spend-card__amount">
          {formatMoney(safeToSpend)}
        </p>
      </div>

      <p className="safe-to-spend-card__detail">
        Available after commitments
      </p>
    </article>
  )
}

export default SafeToSpendCard
