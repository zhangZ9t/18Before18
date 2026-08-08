import { useState } from 'react'
import { api } from '../api/client'
import { formatMoney } from '../utils/formatters'

function WhatIfSimulator({ onDataChanged }) {
  const [form, setForm] = useState({ purchaseAmount: 80, category: 'Entertainment', paymentMethod: 'money-now' })
  const [simulation, setSimulation] = useState(null)
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const simulate = async (event) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')
    try {
      const data = await api.post('/simulations/purchase', {
        ...form,
        purchaseAmount: Number(form.purchaseAmount),
      })
      setSimulation(data.simulation)
      setStatus('success')
    } catch (error) {
      setMessage(error.message)
      setStatus('error')
    }
  }

  const requestAdvance = async () => {
    setStatus('loading')
    try {
      await api.post('/advances/request', {
        itemName: `${form.category} purchase`,
        amount: Number(form.purchaseAmount),
        installmentCount: 4,
      })
      setMessage('Request sent. Your parent can review the future weekly impact.')
      setStatus('success')
      await onDataChanged?.()
    } catch (error) {
      setMessage(error.message)
      setStatus('error')
    }
  }

  const recordPurchase = async () => {
    setStatus('loading')
    setMessage('')
    try {
      await api.post('/transactions', {
        amount: Number(form.purchaseAmount),
        type: 'expense',
        category: form.category,
        description: 'Decision recorded from the What-If Simulator',
      })
      setMessage('Purchase recorded in your mock money history. Your balance has been refreshed.')
      setStatus('success')
      setSimulation(null)
      await onDataChanged?.()
    } catch (error) {
      setMessage(error.message)
      setStatus('error')
    }
  }

  return (
    <section className="simulator-card" id="what-if-simulator" aria-labelledby="simulator-title">
      <div className="panel-heading panel-heading--split">
        <div><p className="eyebrow">What-if simulator</p><h2 id="simulator-title">Try the decision before making it.</h2></div>
        <span className="simulation-label">Read-only simulation</span>
      </div>
      <form className="simulator-form" onSubmit={simulate}>
        <label>Purchase amount<div className="money-input"><span>$</span><input min="1" name="purchaseAmount" onChange={updateField} type="number" value={form.purchaseAmount} /></div></label>
        <label>Category<select name="category" onChange={updateField} value={form.category}><option>Entertainment</option><option>Food</option><option>Transport</option><option>Subscriptions</option><option>Other</option></select></label>
        <label>Explore as<select name="paymentMethod" onChange={updateField} value={form.paymentMethod}><option value="money-now">Buy now</option><option value="wait">Don’t buy</option><option value="save-first">Save first</option><option value="family-advance">Family Advance</option></select></label>
        <button className="button button--lime" disabled={status === 'loading'} type="submit">{status === 'loading' ? 'Calculating…' : 'Show the impact'}</button>
      </form>

      {status === 'error' && <p className="form-error" role="alert">{message}</p>}
      {simulation && (
        <div className="simulation-result">
          <div className="simulation-result__numbers">
            <article><span>Balance after</span><strong>{formatMoney(simulation.newBalance)}</strong></article>
            <article className={simulation.newSafeToSpend < 0 ? 'has-pressure' : ''}><span>Safe to spend after</span><strong>{formatMoney(simulation.newSafeToSpend)}</strong></article>
            <article><span>Bills still due</span><strong>{formatMoney(simulation.billsStillDue)}</strong></article>
            <article><span>{simulation.paymentMethod === 'save-first' ? 'Estimated wait' : 'Estimated goal delay'}</span><strong>{simulation.paymentMethod === 'save-first' ? simulation.saveFirstWeeks ?? '—' : simulation.goalDelayWeeks ?? 0} {simulation.paymentMethod === 'save-first' || simulation.goalDelayWeeks ? 'weeks' : ''}</strong></article>
          </div>
          <p className="simulation-result__explanation">{simulation.explanation}</p>
          <div className="weekly-projection">
            <span>Future weekly money</span>
            <div>{simulation.weeklyProjection.slice(0, 4).map((week) => <article key={week.week}><small>Week {week.week}</small><strong>{formatMoney(week.availableAfterAdvances)}</strong></article>)}</div>
          </div>
          <div className="simulation-actions">
            <button className="button button--dark button--small" type="button" onClick={() => { setSimulation(null); setMessage('') }}>Keep thinking</button>
            {simulation.paymentMethod === 'money-now' && <button className="button button--ghost button--small" type="button" onClick={recordPurchase}>Record this mock purchase</button>}
            {simulation.paymentMethod === 'family-advance' && <button className="button button--ghost button--small" type="button" onClick={requestAdvance}>Ask parent for a Family Advance</button>}
          </div>
        </div>
      )}
      {message && status === 'success' && <p className="success-message" role="status">{message}</p>}
    </section>
  )
}

export default WhatIfSimulator
