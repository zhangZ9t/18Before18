import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { useAuth } from '../hooks/useAuth'

const copy = {
  login: {
    eyebrow: 'Welcome back',
    title: 'Continue the conversation.',
    description: 'Sign in to open the right household view for your role.',
    submit: 'Sign in',
  },
  parent: {
    eyebrow: 'For parents',
    title: 'Create a household.',
    description: 'Set up a private place for realistic money practice and shared learning.',
    submit: 'Create household',
  },
  teen: {
    eyebrow: 'For teenagers',
    title: 'Join your household.',
    description: 'Use the invite code from your parent. You won’t create a separate household.',
    submit: 'Join household',
  },
}

function AuthPage({ mode }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const pageCopy = copy[mode]
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    householdName: '',
    householdInviteCode: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (auth.user) navigate(auth.user.role === 'parent' ? '/parent' : '/teen', { replace: true })
  }, [auth.user, navigate])

  const alternative = useMemo(() => {
    if (mode === 'login') return <><span>New here?</span> <Link to="/signup">Create a household</Link> or <Link to="/join">join one</Link>.</>
    return <><span>Already have an account?</span> <Link to="/login">Sign in</Link>.</>
  }, [mode])

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      let data
      if (mode === 'login') {
        data = await auth.login({ email: form.email, password: form.password })
      } else if (mode === 'parent') {
        data = await auth.registerParent({
          name: form.name,
          email: form.email,
          password: form.password,
          householdName: form.householdName || undefined,
        })
      } else {
        data = await auth.registerTeen({
          name: form.name,
          email: form.email,
          password: form.password,
          householdInviteCode: form.householdInviteCode,
        })
      }

      const requestedPath = location.state?.from?.pathname
      navigate(requestedPath || (data.user.role === 'parent' ? '/parent' : '/teen'), {
        replace: true,
      })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const fillDemoCredentials = (role) => {
    setForm((current) => ({
      ...current,
      email: role === 'parent' ? 'parent@example.com' : 'teen@example.com',
      password: role === 'parent' ? 'DemoParent123!' : 'DemoTeen123!',
    }))
  }

  return (
    <div className="auth-page">
      <header className="auth-header"><Logo /><Link to="/">Back to home</Link></header>
      <main className="auth-layout">
        <section className="auth-story">
          <p className="eyebrow">Understand · Practise · Improve</p>
          <h2>Better money habits grow through experience.</h2>
          <div className="auth-story__card">
            <span>Safe to spend</span><strong>$95</strong>
            <p>after $55 in bills and $30 protected for savings</p>
          </div>
          <p className="auth-story__note">Your account balance is only the beginning of the story.</p>
        </section>

        <section className="auth-card">
          <div className="auth-card__heading">
            <p className="eyebrow">{pageCopy.eyebrow}</p>
            <h1>{pageCopy.title}</h1>
            <p>{pageCopy.description}</p>
          </div>

          {mode === 'login' && (
            <div className="demo-login-box">
              <span>Demo accounts</span>
              <div>
                <button type="button" onClick={() => fillDemoCredentials('parent')}>Use parent demo</button>
                <button type="button" onClick={() => fillDemoCredentials('teen')}>Use teen demo</button>
              </div>
            </div>
          )}

          <form className="auth-form" onSubmit={submit}>
            {mode !== 'login' && (
              <label>
                Your name
                <input name="name" value={form.name} onChange={updateField} autoComplete="name" required />
              </label>
            )}
            {mode === 'parent' && (
              <label>
                Household name <small>Optional</small>
                <input name="householdName" value={form.householdName} onChange={updateField} placeholder="The Taylor Family" />
              </label>
            )}
            {mode === 'teen' && (
              <label>
                Household invite code
                <input name="householdInviteCode" value={form.householdInviteCode} onChange={updateField} placeholder="FAMILY-7K4P" required />
              </label>
            )}
            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required />
            </label>
            <label>
              Password
              <input name="password" type="password" minLength="8" value={form.password} onChange={updateField} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
            </label>

            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button--dark auth-submit" disabled={submitting} type="submit">
              {submitting ? 'One moment…' : pageCopy.submit} <span>→</span>
            </button>
          </form>
          <p className="auth-alternative">{alternative}</p>
        </section>
      </main>
    </div>
  )
}

export default AuthPage
