import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import './landing.css'

function PhonePreview() {
  return (
    <div className="phone" aria-hidden="true">
      <div className="phone-inner">
        <div className="phone-top">
          <div>
            <strong>Life Mode</strong>
            <div className="phone-sub">Week 7 · Age 16</div>
          </div>
          <div className="phone-avatar">🧑‍🚀</div>
        </div>

        <div className="phone-balance">
          <div className="phone-balance__label">Real account balance</div>
          <div className="phone-balance__amount">$200</div>
          <div className="phone-money-row">
            <span>Committed to bills</span>
            <strong>$85</strong>
          </div>
          <div className="phone-money-row">
            <span>Savings target</span>
            <strong>$30</strong>
          </div>
          <div className="phone-money-row">
            <span>Actually safe to spend</span>
            <strong>$85</strong>
          </div>
        </div>

        <div className="phone-bill">
          <div className="phone-bill__left">
            <div className="phone-icon">🏠</div>
            <div>
              <strong>Rent</strong>
              <small>Due Sunday · $40</small>
            </div>
          </div>
          <span className="phone-status phone-status--due">Due</span>
        </div>
        <div className="phone-bill">
          <div className="phone-bill__left">
            <div className="phone-icon">🛒</div>
            <div>
              <strong>Groceries</strong>
              <small>Your share · $25</small>
            </div>
          </div>
          <span className="phone-status phone-status--paid">Paid</span>
        </div>
        <div className="phone-bill">
          <div className="phone-bill__left">
            <div className="phone-icon">⚡</div>
            <div>
              <strong>Power</strong>
              <small>Your share · $10</small>
            </div>
          </div>
          <span className="phone-status phone-status--due">Due</span>
        </div>

        <div className="phone-ai">
          <small>AI COACH</small>
          <p>
            You have $200 in your account, but only <b>$85 is actually free to spend</b>. Rent and
            power are still due this week.
          </p>
        </div>
      </div>
    </div>
  )
}

function LandingPage() {
  return (
    <div className="landing-page landing-page--demo4">
      <header className="landing-nav">
        <Logo />
        <nav aria-label="Landing navigation">
          <a href="#how">How it works</a>
          <a href="#parents">For parents</a>
          <Link className="button button--primary-monster" to="/parent">
            Start Life Mode
          </Link>
        </nav>
      </header>

      <main>
        <header className="mast" aria-label="18 Before 18 masthead">
          <img
            src="/landing-mast.jpg"
            alt="A smiling teenage girl sitting with the Happy Monster in a lush green meadow at sunrise."
          />
          <div className="mast-stickers" aria-hidden="true">
            <span className="mast-sticker">18 = new level unlocked ✨</span>
            <span className="mast-sticker">real choices · safe consequences</span>
            <span className="mast-sticker">money confidence, minus the lecture</span>
          </div>
          <div className="mast-copy">
            <span className="mast-kicker">18 Before 18 · Life Mode</span>
            <p className="mast-title">
              Big life energy.
              <br />
              Before the bills get real.
            </p>
            <p className="mast-sub">
              A real-money training ground that makes adulting feel less like a lecture and more
              like a level you can actually learn to beat.
            </p>
          </div>
        </header>

        <section className="hero-section hero-section--demo4">
          <div className="hero-section__copy">
            <div className="eyebrow eyebrow--sky">💸 Real money. Safe consequences. Better judgement.</div>
            <h1>Practice adulthood before adulthood gets expensive.</h1>
            <p className="hero-section__lede">
              Parents deposit real weekly money, set real-life obligations like rent, groceries and
              power, and let their teenager manage what’s left. If they spend too much, the
              consequence carries into the next payday — just like real life.
            </p>
            <div className="hero-actions">
              <Link className="button button--primary-monster" to="/parent">
                Try the live demo
              </Link>
              <a className="button button--secondary-monster" href="#how">
                See the system
              </a>
            </div>
            <p className="micro">
              The goal isn’t to stop bad purchases. It’s to build adults who understand obligations
              before spending.
            </p>
          </div>
          <div className="hero-section__visual">
            <PhonePreview />
          </div>
        </section>

        <div className="stats">
          <div className="stat">
            <div className="num">85%</div>
            <p>of surveyed parents said they should have more conversations about good money habits.</p>
          </div>
          <div className="stat">
            <div className="num">65%</div>
            <p>found it difficult to step back and let their child make their own money mistakes.</p>
          </div>
          <div className="stat">
            <div className="num">51%</div>
            <p>struggled to explain money in a way their child could understand.</p>
          </div>
        </div>

        <section className="landing-section" id="how">
          <div className="section-heading">
            <h2>A real-money training ground for adulthood.</h2>
            <p className="section-heading__lede">
              The parent creates a simplified version of adult life. The teen gets real money, real
              obligations and real consequences — without credit-card debt, late fees or financial
              disaster.
            </p>
          </div>
          <div className="steps">
            <article className="step">
              <div className="n">1</div>
              <h3>Parent sets the world</h3>
              <p>Deposit $200 a week. Add rent, groceries, power, gas, phone or any custom household contribution.</p>
            </article>
            <article className="step">
              <div className="n">2</div>
              <h3>Teen pays their life</h3>
              <p>Bills become weekly or monthly tasks. The teenager chooses when to pay them from their real balance.</p>
            </article>
            <article className="step">
              <div className="n">3</div>
              <h3>Mistakes have consequences</h3>
              <p>If they spend the rent money, the unpaid amount rolls forward and comes out of the next allowance.</p>
            </article>
            <article className="step">
              <div className="n">4</div>
              <h3>AI turns behaviour into judgement</h3>
              <p>Teen gets context. Parent gets one useful conversation. Both see progress without turning the app into surveillance.</p>
            </article>
          </div>
          <div className="loop-cta">
            <Link className="button button--primary-monster" to="/parent">
              Open Life Mode as parent <span>→</span>
            </Link>
            <p>Then switch to Teen in the header — same shared week.</p>
          </div>
        </section>

        <section className="landing-section" id="parents">
          <div className="parents-visual">
            <img
              src="/landing-parents.jpg"
              alt="A grown-up version of the teen sitting with the Happy Monster at sunset."
            />
            <div className="parents-visual-label">
              <strong>The long view — confidence that grows up with them</strong>
            </div>
          </div>

          <div className="quote">
            <div>
              <h2>
                Your balance tells you how much money you have. We teach you how much of it is
                actually yours to spend.
              </h2>
            </div>
            <div>
              <p>
                18 Before 18 is not a parental-control app. It is a handover system: parents create
                responsibility, teenagers practise managing it, and AI helps both sides learn from
                what actually happened.
              </p>
              <div className="chips">
                <span className="chip">Real balance</span>
                <span className="chip">Custom family bills</span>
                <span className="chip">Debt carry-over</span>
                <span className="chip">Savings targets</span>
                <span className="chip">AI weekly reports</span>
                <span className="chip">Parent conversation prompts</span>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="section-heading">
            <h2>Not a budgeting app. A responsibility engine.</h2>
            <p className="section-heading__lede">
              The product teaches a sequence most adults only learn after leaving home.
            </p>
          </div>
          <div className="compare">
            <div className="compare-card">
              <h3>Typical teen banking</h3>
              <div className="compare-row">👁️ <span>Parent sees transactions</span></div>
              <div className="compare-row">🚫 <span>Parent blocks categories</span></div>
              <div className="compare-row">💳 <span>Teen gets a card</span></div>
              <div className="compare-row">📚 <span>Generic financial education</span></div>
            </div>
            <div className="compare-card compare-card--accent">
              <h3>18 Before 18</h3>
              <div className="compare-row">🏠 <span>Teen has obligations before discretionary spend</span></div>
              <div className="compare-row">↪️ <span>Missed bills carry into the next payday</span></div>
              <div className="compare-row">🎯 <span>Saving competes with real spending decisions</span></div>
              <div className="compare-row">🧠 <span>AI interprets behaviour and guides the next conversation</span></div>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="section-heading">
            <h2>The AI layer is where the learning compounds.</h2>
            <p className="section-heading__lede">
              The AI isn’t there to say “spending bad”. It observes patterns and turns them into
              useful feedback.
            </p>
          </div>
          <div className="steps">
            <article className="step">
              <div className="n">AI</div>
              <h3>For the teen</h3>
              <p>
                “You paid every bill, but 70% of fun spending happened in the first two days. Next
                week, try pacing it.”
              </p>
            </article>
            <article className="step">
              <div className="n">👪</div>
              <h3>For the parent</h3>
              <p>
                “They missed groceries twice after spending early. Ask how they would protect that
                money next payday.”
              </p>
            </article>
            <article className="step">
              <div className="n">✓</div>
              <h3>Positive reinforcement</h3>
              <p>
                “Four weeks hitting the saving goal. Consider giving them responsibility for another
                bill.”
              </p>
            </article>
            <article className="step">
              <div className="n">↗</div>
              <h3>Graduated independence</h3>
              <p>
                As judgement improves, parental control reduces. Success means the system becomes
                less necessary.
              </p>
            </article>
          </div>
        </section>

        <section className="final-cta final-cta--demo4">
          <h2>Let them learn to run out of money before running out of money becomes serious.</h2>
          <p>
            Real decisions. Real responsibility. Safe consequences. A financial training ground for
            the years before adulthood.
          </p>
          <div className="hero-actions">
            <Link className="button button--primary-monster" to="/parent">
              Try Life Mode
            </Link>
            <Link className="button button--secondary-monster" to="/teen">
              Open teen view
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-footer landing-footer--demo4">
        <span>18 Before 18 · AI Hackathon concept</span>
        <span>Prototype only — banking and money movement are simulated.</span>
      </footer>
    </div>
  )
}

export default LandingPage
