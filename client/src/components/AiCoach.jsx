import { useState } from 'react'
import { api } from '../api/client'

const suggestions = {
  teen: [
    'Why is my safe-to-spend lower than my balance?',
    'How long until I reach my goal?',
    'What does a Family Advance mean?',
  ],
  parent: [
    'What should we discuss this week?',
    'Why did safe-to-spend decrease?',
    'How should I think about the next level?',
  ],
}

const localAnswers = {
  teen: {
    'Why is my safe-to-spend lower than my balance?':
      'Balance is what’s in the account. Safe-to-spend is what’s left after bills and savings you already promised. Protect commitments first — then enjoy what’s free.',
    'How long until I reach my goal?':
      'Divide what’s left to save by your weekly contribution. Life Mode also shows how a loan or early spend can push that date out.',
    'What does a Family Advance mean?':
      'It’s practice credit from your parent — money now, paid back from future paydays. Not a discount. In Life Mode, apply for a loan to feel that trade-off.',
  },
  parent: {
    'What should we discuss this week?':
      'Start from one concrete moment: unpaid bills, a loan, or early card spend. Life Mode → End week gives you What / Why / How for that conversation.',
    'Why did safe-to-spend decrease?':
      'Usually new commitments (bills, savings, or a loan repayment) claimed money that looked free. Ask what they thought was “extra” vs already spoken for.',
    'How should I think about the next level?':
      'Add responsibility when they can name the trade-off — not when the balance looks big. One new bill after a strong week beats three at once.',
  },
}

function fallbackAnswer(role, question) {
  const map = localAnswers[role] || {}
  if (map[question]) return map[question]
  return role === 'parent'
    ? 'Try Life Mode: Start week → switch to Teen → End week. You’ll get a coaching brief with what happened, why it matters, and how to talk about it.'
    : 'Your balance isn’t the same as spendable money. Pay bills first in Life Mode — unpaid amounts come out of next payday.'
}

function AiCoach({ role }) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState('idle')

  const ask = async (event, suggestedQuestion) => {
    event?.preventDefault()
    const nextQuestion = suggestedQuestion || question
    if (!nextQuestion.trim()) return

    setQuestion(nextQuestion)
    setStatus('loading')
    try {
      const data = await api.post('/ai/chat', { question: nextQuestion })
      setAnswer(data.answer.text)
      setStatus('success')
    } catch {
      setAnswer(fallbackAnswer(role, nextQuestion))
      setStatus('success')
    }
  }

  return (
    <>
      {open && (
        <section className="coach-panel" aria-label="AI financial coach">
          <div className="coach-panel__header">
            <div>
              <span className="coach-panel__eyebrow">Educational coach</span>
              <h2>Ask about the trade-offs</h2>
            </div>
            <button aria-label="Close coach" type="button" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          {!answer && (
            <div className="coach-suggestions">
              {suggestions[role].map((suggestion) => (
                <button key={suggestion} type="button" onClick={(event) => ask(event, suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          {answer && (
            <div className={`coach-answer coach-answer--${status}`}>
              {status === 'loading' ? 'Thinking through the trade-offs…' : answer}
            </div>
          )}

          <form className="coach-form" onSubmit={ask}>
            <label htmlFor="coach-question">Your question</label>
            <div>
              <input
                id="coach-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Can I afford this?"
              />
              <button disabled={status === 'loading'} type="submit">Ask</button>
            </div>
          </form>
          <p className="coach-disclosure">Educational guidance, not financial advice.</p>
        </section>
      )}
      <button className="coach-bubble" type="button" onClick={() => setOpen((value) => !value)}>
        <span aria-hidden="true">✦</span>
        Ask coach
      </button>
    </>
  )
}

export default AiCoach
