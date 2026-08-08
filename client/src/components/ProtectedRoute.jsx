import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import StatusState from './StatusState'

function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <main className="centered-page">
        <StatusState title="Opening your household" message="Getting the right view ready…" />
      </main>
    )
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (user.role !== role) {
    return <Navigate to={user.role === 'parent' ? '/parent' : '/teen'} replace />
  }

  return children
}

export default ProtectedRoute
