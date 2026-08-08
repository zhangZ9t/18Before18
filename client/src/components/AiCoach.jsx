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
    } catch (error) {
      setAnswer(error.message)
      setStatus('error')
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
