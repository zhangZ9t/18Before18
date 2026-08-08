import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

function NotFoundPage() {
  return (
    <main className="not-found-page">
      <Logo />
      <p className="eyebrow">404</p>
      <h1>That page isn’t part of the plan.</h1>
      <p>Head back to the starting point and choose the right household view.</p>
      <Link className="button button--dark" to="/">Return home</Link>
    </main>
  )
}

export default NotFoundPage
