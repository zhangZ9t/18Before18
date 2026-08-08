import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Logo from './Logo'
import AiCoach from './AiCoach'

function DashboardLayout({ role, navItems, activeTab, onTabChange, children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
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
          <span className="profile-menu__copy">
            <small>{role === 'parent' ? 'Parent account' : 'Teen account'}</small>
            <strong>{user.name}</strong>
          </span>
          <span className="profile-menu__avatar" aria-hidden="true">
            {user.name.charAt(0)}
          </span>
          <button className="text-button" type="button" onClick={handleLogout}>
            Log out
          </button>
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

      <main className="product-main">{children}</main>
      <AiCoach role={role} />
    </div>
  )
}

export default DashboardLayout
