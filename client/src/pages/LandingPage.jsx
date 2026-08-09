import { useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

function MoneyPreview() {
  return (
    <div className="hero-product-card">
      <div className="hero-product-card__top">
        <span>My money now</span>
        <span className="mini-avatar">A</span>
      </div>
      <p className="hero-product-card__label">Safe to spend</p>
      <strong className="hero-product-card__amount">$95</strong>
      <div className="mini-balance-bar">
        <span className="mini-balance-bar__safe" />
        <span className="mini-balance-bar__bills" />
        <span className="mini-balance-bar__saving" />
      </div>
      <div className="hero-product-card__legend">
        <span><i className="dot dot--lime" />Yours to use <strong>$95</strong></span>
        <span><i className="dot dot--coral" />Bills <strong>$55</strong></span>
        <span><i className="dot dot--violet" />Savings <strong>$30</strong></span>
      </div>
      <div className="hero-product-card__prompt">
        <span>✦</span>
        <p><strong>Money in your account</strong> isn’t always money available to spend.</p>
      </div>
    </div>
  )
}

function DemoPanel({ view }) {
  if (view === 'parent') {
    return (
      <div className="demo-window">
        <div className="demo-window__header"><span>Parent overview</span><strong>Taylor Family</strong></div>
        <div className="demo-stats">
          <article><span>Weekly deposit</span><strong>$100</strong></article>
          <article><span>Safe to spend</span><strong>$95</strong></article>
          <article><span>Bills</span><strong>2 due</strong></article>
        </div>
        <div className="demo-prompt">
          <span>Worth discussing</span>
          <h3>One useful conversation—not a surveillance feed.</h3>
          <p>“If an unexpected expense came up tomorrow, what would you change?”</p>
        </div>
        <p className="privacy-note">Spending is shown by category. Merchant details stay private.</p>
      </div>
    )
  }

  return (
    <div className="demo-window">
      <div className="demo-window__header"><span>Teen dashboard</span><strong>Alex</strong></div>
      <div className="demo-safe-row">
        <div><span>Balance</span><strong>$180</strong></div><b>−</b>
        <div><span>Bills</span><strong>$55</strong></div><b>−</b>
        <div><span>Savings</span><strong>$30</strong></div><b>=</b>
        <div className="is-safe"><span>Safe to spend</span><strong>$95</strong></div>
      </div>
      <div className="demo-goal">
        <div><span>Headphones goal</span><strong>60%</strong></div>
        <div className="progress-track"><span style={{ width: '60%' }} /></div>
        <p>Spend $25 today → estimated goal delay: 1–2 weeks</p>
      </div>
    </div>
  )
}

function LandingPage() {
  const [demoView, setDemoView] = useState('teen')

  return (
    <div className="landing-page">
      <header className="landing-header">
        <Logo />
        <nav aria-label="Landing navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#different">Why it’s different</a>
          <Link to="/teen">Teen demo</Link>
          <Link className="button button--dark button--small" to="/parent">Parent demo</Link>
        </nav>
      </header>

      <main>
        <section className="hero-section">
          <div className="hero-section__copy">
            <p className="eyebrow">Money practice for real life</p>
            <h1>Practice money before money gets serious.</h1>
            <p className="hero-section__lede">
              Help teenagers build financial judgement using realistic decisions,
              future consequences, and better family conversations.
            </p>
            <div className="hero-actions">
              <Link className="button button--dark" to="/parent">Start parent demo <span>→</span></Link>
              <Link className="button button--ghost" to="/teen">Open teen demo</Link>
              <a className="button button--ghost" href="#product-demo">See how it works</a>
            </div>
            <p className="trust-line"><span>✓</span> Shared Life Mode: Parent starts the week → Teen manages money → Parent gets the coaching alert.</p>
          </div>
          <div className="hero-section__visual">
            <div className="orbit orbit--one" />
            <div className="orbit orbit--two" />
            <MoneyPreview />
            <div className="floating-pill floating-pill--top"><span>Goal impact</span><strong>−1 week</strong></div>
            <div className="floating-pill floating-pill--bottom"><span>Independence</span><strong>Level 2</strong></div>
          </div>
        </section>

        <section className="problem-strip">
          <p>Expense apps tell families <strong>what happened.</strong></p>
          <p>18 Before 18 helps them understand <strong>what it means next.</strong></p>
        </section>

        <section className="landing-section demo-section" id="product-demo">
          <div className="section-heading section-heading--center">
            <p className="eyebrow">Two views, one conversation</p>
            <h2>Independence for teens. Context for parents.</h2>
            <p>Enough shared understanding to learn together, without turning money into surveillance.</p>
          </div>
          <div className="segmented-control" aria-label="Choose demo view">
            <button className={demoView === 'teen' ? 'is-active' : ''} onClick={() => setDemoView('teen')} type="button">Teen view</button>
            <button className={demoView === 'parent' ? 'is-active' : ''} onClick={() => setDemoView('parent')} type="button">Parent view</button>
          </div>
          <DemoPanel view={demoView} />
        </section>

        <section className="landing-section" id="how-it-works">
          <div className="section-heading">
            <p className="eyebrow">The learning loop</p>
            <h2>Turn everyday choices into better judgement.</h2>
          </div>
          <div className="steps-grid">
            {[
              ['01', 'Understand', 'See what is truly available after bills, savings, and future commitments.'],
              ['02', 'Simulate', 'Test a purchase before making it and see the impact on future weeks.'],
              ['03', 'Discuss', 'Use one relevant, non-judgemental prompt to start a family conversation.'],
              ['04', 'Improve', 'Reflect, build reliable habits, and gradually take on more responsibility.'],
            ].map(([number, title, copy]) => (
              <article className="step-card" key={number}>
                <span>{number}</span><h3>{title}</h3><p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section difference-section" id="different">
          <div className="section-heading section-heading--light">
            <p className="eyebrow">Why it’s different</p>
            <h2>Built for judgement, not monitoring.</h2>
          </div>
          <div className="difference-grid">
            {[
              ['Safe-to-spend', 'Know what can be used after responsibilities—not just the account balance.'],
              ['Future consequences', 'Turn “Can I buy this?” into a clear view of what changes afterward.'],
              ['Graduated independence', 'Responsibility grows as judgement and follow-through develop.'],
              ['Privacy by design', 'Parents see learning patterns and categories, not private merchant details.'],
            ].map(([title, copy], index) => (
              <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>
            ))}
          </div>
        </section>

        <section className="landing-section conversation-section">
          <div>
            <p className="eyebrow">Conversation over control</p>
            <h2>The goal is a teenager who eventually needs less help.</h2>
          </div>
          <blockquote>
            “What would you do differently if an unexpected expense came up tomorrow?”
            <span>One useful question at a time.</span>
          </blockquote>
        </section>

        <section className="final-cta">
          <p className="eyebrow">Start learning together</p>
          <h2>Give money decisions room to be practised.</h2>
          <div className="hero-actions">
            <Link className="button button--lime" to="/parent">Open parent Life Mode <span>→</span></Link>
            <Link className="button button--ghost" to="/teen">Open teen Life Mode</Link>
            <Link className="button button--light" to="/join">Join with an invite code</Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <Logo />
        <p>Realistic financial learning. Simulated banking and credit only.</p>
        <span>Hackathon MVP · 2026</span>
      </footer>
    </div>
  )
}

export default LandingPage
