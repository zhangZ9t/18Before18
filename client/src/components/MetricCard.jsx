function MetricCard({ label, value, detail, tone = 'plain', badge }) {
  return (
    <article className={`metric-tile metric-tile--${tone}`}>
      <div className="metric-tile__top">
        <span className="metric-tile__symbol" aria-hidden="true" />
        {badge && <span className="metric-tile__badge">{badge}</span>}
      </div>
      <div><p>{label}</p><strong>{value}</strong></div>
      <small>{detail}</small>
    </article>
  )
}

export default MetricCard
