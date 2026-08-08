function StatusState({ type = 'loading', title, message, action }) {
  return (
    <div className={`status-state status-state--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span className="status-state__mark" aria-hidden="true">
        {type === 'loading' ? '···' : type === 'error' ? '!' : '○'}
      </span>
      <div>
        <h2>{title}</h2>
        {message && <p>{message}</p>}
        {action}
      </div>
    </div>
  )
}

export default StatusState
