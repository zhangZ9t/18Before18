import { Link } from 'react-router-dom'

function Logo({ compact = false }) {
  return (
    <Link className={`brand${compact ? ' brand--compact' : ''}`} to="/">
      <span className="brand__mark">18</span>
      {!compact && (
        <span className="brand__name">
          Before <strong>18</strong>
        </span>
      )}
    </Link>
  )
}

export default Logo
