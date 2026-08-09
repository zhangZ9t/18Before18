import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from './Logo'
import AiCoach from './AiCoach'

function DashboardLayout({ role, navItems, activeTab, onTabChange, children, showCoach = true }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const displayName = user?.name || (role === 'parent' ? 'Alex' : 'Jamie')

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      /* demo / already logged out */
    }
    navigate('/')
  }

  return (
    <div className="product-shell">
      <header className="product-header">
        <Logo />
        <nav className="desktop-nav" aria-label={`${role} dashboard sections`}>
          {navItems.map((item) => (
            <button
              className={activeTab === item.id ? 'is-active' : ''}
              key={item.id}
              onClick={() => onTabChange(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="profile-menu">
          <div className="demo-role-switch" aria-label="Switch profile">
            <Link className={role === 'parent' ? 'is-active' : ''} to="/parent">
              Parent
            </Link>
            <Link className={role === 'teen' ? 'is-active' : ''} to="/teen">
              Teen
            </Link>
          </div>
          <span className="profile-menu__copy">
            <small>{user ? (role === 'parent' ? 'Parent account' : 'Teen account') : 'Hackathon demo'}</small>
            <strong>{displayName}</strong>
          </span>
          <span className="profile-menu__avatar" aria-hidden="true">
            {displayName.charAt(0)}
          </span>
          {user ? (
            <button className="text-button" type="button" onClick={handleLogout}>
              Log out
            </button>
          ) : (
            <Link className="text-button" to="/">
              Home
            </Link>
          )}
        </div>
      </header>

      <nav className="mobile-nav" aria-label={`${role} dashboard sections`}>
        {navItems.map((item) => (
          <button
            className={activeTab === item.id ? 'is-active' : ''}
            key={item.id}
            onClick={() => onTabChange(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="demo-role-switch demo-role-switch--mobile" aria-label="Switch profile">
        <Link className={role === 'parent' ? 'is-active' : ''} to="/parent">
          Parent
        </Link>
        <Link className={role === 'teen' ? 'is-active' : ''} to="/teen">
          Teen
        </Link>
      </div>

      <main className="product-main">{children}</main>
      {showCoach ? <AiCoach role={role} /> : null}
    </div>
  )
}

export default DashboardLayout
