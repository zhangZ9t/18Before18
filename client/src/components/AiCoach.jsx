import { useEffect, useState } from 'react'
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
  'teen-life': [
    'Should I pay bills before I spend?',
    'What happens if I leave a bill unpaid?',
    'Is taking a loan a bad idea this week?',
  ],
  'parent-life': [
    'What should we discuss after this Life Mode week?',
    'How do I talk about unpaid bills without shaming?',
    'When is a loan worth discussing?',
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
    'Should I pay bills before I spend?':
      'Yes — that’s the whole skill. Money in the account isn’t free until obligations and savings are covered. Pay bills first, then spend what’s left.',
    'What happens if I leave a bill unpaid?':
      'It doesn’t vanish. Next payday arrives short by that amount — same as adulthood, with safer consequences here.',
    'Is taking a loan a bad idea this week?':
      'Not automatically. Ask whether you can still cover bills after the weekly repayment leaves. If not, the loan is eating next week’s freedom.',
  },
  parent: {
    'What should we discuss this week?':
      'Start from one concrete moment: unpaid bills, a loan, or early card spend. Life Mode → End week gives you What / Why / How for that conversation.',
    'Why did safe-to-spend decrease?':
      'Usually new commitments (bills, savings, or a loan repayment) claimed money that looked free. Ask what they thought was “extra” vs already spoken for.',
    'How should I think about the next level?':
      'Add responsibility when they can name the trade-off — not when the balance looks big. One new bill after a strong week beats three at once.',
    'What should we discuss after this Life Mode week?':
      'End week for the AI brief, then use the suggested question out loud. One calm conversation beats reviewing every tap.',
    'How do I talk about unpaid bills without shaming?':
      'Lead with curiosity: “What got in the way of covering that?” Help them invent one rule for next payday — don’t confiscate the lesson.',
    'When is a loan worth discussing?':
      'When the repayment would squeeze bills or savings. Ask what it’s for, what waits, and what’s left after each payday deduction.',
  },
}

function fallbackAnswer(role, question) {
  const map = localAnswers[role] || {}
  if (map[question]) return map[question]
  return role === 'parent'
    ? 'Try Life Mode: Start week → switch to Teen → End week. You’ll get a coaching brief with what happened, why it matters, and how to talk about it.'
    : 'Your balance isn’t the same as spendable money. Pay bills first in Life Mode — unpaid amounts come out of next payday.'
}

function AiCoach({ role, context = 'default' }) {
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState('idle')
  const suggestionKey = context === 'life' ? `${role}-life` : role
  const activeSuggestions = suggestions[suggestionKey] || suggestions[role]

  useEffect(() => {
    setAnswer('')
    setQuestion('')
    setStatus('idle')
  }, [context, role])

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
              <span className="coach-panel__eyebrow">
                {context === 'life' ? 'Life Mode coach' : 'Educational coach'}
              </span>
              <h2>Ask about the trade-offs</h2>
            </div>
            <button aria-label="Close coach" type="button" onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          {!answer && (
            <div className="coach-suggestions">
              {activeSuggestions.map((suggestion) => (
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
