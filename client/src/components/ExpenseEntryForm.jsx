import { useState } from 'react'

const emptyExpense = () => ({
  amount: '',
  category: 'Food',
  description: '',
})

function ExpenseEntryForm({ description, noteLabel, onSubmit, title }) {
  const [expense, setExpense] = useState(emptyExpense)
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)

    const saved = await onSubmit({
      amount: Number(expense.amount),
      type: 'expense',
      category: expense.category,
      description: expense.description.trim() || undefined,
    })

    if (saved) setExpense(emptyExpense())
    setIsSaving(false)
  }

  return (
    <form className="form-card expense-entry-form" onSubmit={handleSubmit}>
      <div className="panel-heading">
        <p className="eyebrow">Money activity</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <div className="form-grid expense-entry-grid">
        <label>
          Amount
          <input min="0.01" required step="0.01" type="number" value={expense.amount} onChange={(event) => setExpense({ ...expense, amount: event.target.value })} />
        </label>
        <label>
          Category
          <select value={expense.category} onChange={(event) => setExpense({ ...expense, category: event.target.value })}>
            <option>Food</option>
            <option>Transport</option>
            <option>Entertainment</option>
            <option>Subscriptions</option>
            <option>Other</option>
          </select>
        </label>
        <label>
          {noteLabel}
          <input maxLength="240" placeholder="What was this for?" value={expense.description} onChange={(event) => setExpense({ ...expense, description: event.target.value })} />
        </label>
      </div>
      <button className="button button--dark" disabled={isSaving} type="submit">
        {isSaving ? 'Recording…' : 'Record expense'}
      </button>
    </form>
  )
}

export default ExpenseEntryForm
