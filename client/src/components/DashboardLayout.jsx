import { Link } from 'react-router-dom'
import Logo from './Logo'

function DashboardLayout({ role, navItems, activeTab, onTabChange, children, showCoach = true }) {
  const displayName = role === 'parent' ? 'Alex' : 'Jamie'
  const otherRole = role === 'parent' ? 'teen' : 'parent'
  const otherLabel = role === 'parent' ? 'Teen' : 'Parent'

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
          <div className="demo-role-switch" aria-label="Switch demo profile">
            <Link className={role === 'parent' ? 'is-active' : ''} to="/parent">
              Parent
            </Link>
            <Link className={role === 'teen' ? 'is-active' : ''} to="/teen">
              Teen
            </Link>
          </div>
          <span className="profile-menu__copy">
            <small>Shared Life Mode demo</small>
            <strong>
              {displayName} · switch to {otherLabel}
            </strong>
          </span>
          <span className="profile-menu__avatar" aria-hidden="true">
            {displayName.charAt(0)}
          </span>
          <Link className="text-button" to={`/${otherRole}`}>
            → {otherLabel}
          </Link>
          <Link className="text-button" to="/">
            Home
          </Link>
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

      <div className="demo-role-switch demo-role-switch--mobile" aria-label="Switch demo profile">
        <Link className={role === 'parent' ? 'is-active' : ''} to="/parent">
          Parent
        </Link>
        <Link className={role === 'teen' ? 'is-active' : ''} to="/teen">
          Teen
        </Link>
      </div>

      <main className="product-main">{children}</main>
    </div>
  )
}

export default DashboardLayout
