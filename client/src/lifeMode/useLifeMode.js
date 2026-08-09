import { useCallback, useEffect, useRef, useState } from 'react'
import {
  STORAGE_KEY,
  applyLoan,
  cardSpend,
  clearBanner,
  clearToast,
  createInitialState,
  declineLoan,
  dismissCoachAlert,
  downloadWeeklySummary,
  endWeek,
  loadStoredState,
  payBill,
  persistState,
  resetLifeMode,
  startWeek,
  togglePush,
  toggleRuleEnabled,
  updateRules,
} from './engine'

function notifyParent(moment) {
  if (typeof window === 'undefined' || !moment) return
  if (!('Notification' in window)) return
  const body = `${moment.preview}\n\nOpen Parent → Life Mode for the full AI coaching brief.`
  if (Notification.permission === 'granted') {
    new Notification('18 Before 18 · Talk with your teen', { body, tag: moment.id })
    return
  }
  if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification('18 Before 18 · Talk with your teen', { body, tag: moment.id })
      }
    })
  }
}

export function useLifeMode({ parentName, teenName, isParentView = false } = {}) {
  const [state, setState] = useState(() => {
    const stored = loadStoredState()
    const names = {
      parentName: parentName || stored?.parentName || 'Alex',
      teenName: teenName || stored?.teenName || 'Jamie',
    }
    if (stored) {
      return {
        ...stored,
        ...names,
      }
    }
    return createInitialState(names)
  })
  const lastAlertId = useRef(state.coachAlert?.id || null)

  useEffect(() => {
    persistState(state)
  }, [state])

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return
      try {
        const next = JSON.parse(event.newValue)
        setState((current) => {
          const incomingAlert = next.coachAlert
          const isNewAlert = incomingAlert && incomingAlert.id !== current.coachAlert?.id
          return {
            ...current,
            ...next,
            toast: current.toast,
            banner: isNewAlert ? incomingAlert : current.banner,
            coachAlert: incomingAlert || null,
          }
        })
      } catch {
        /* ignore bad payload */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (!state.toast) return undefined
    const timer = window.setTimeout(() => {
      setState((current) => clearToast(current))
    }, 2800)
    return () => window.clearTimeout(timer)
  }, [state.toast])

  useEffect(() => {
    if (!state.banner) return undefined
    const timer = window.setTimeout(() => {
      setState((current) => clearBanner(current))
    }, 5200)
    return () => window.clearTimeout(timer)
  }, [state.banner])

  useEffect(() => {
    if (!isParentView || !state.coachAlert) return
    if (state.coachAlert.id === lastAlertId.current) return
    lastAlertId.current = state.coachAlert.id
    notifyParent(state.coachAlert)
  }, [isParentView, state.coachAlert])

  const apply = useCallback((updater) => {
    setState((current) => updater(current))
  }, [])

  return {
    state,
    setRules: (partial) => apply((current) => updateRules(current, partial)),
    toggleEnabled: (key) => apply((current) => toggleRuleEnabled(current, key)),
    startWeek: () => apply(startWeek),
    endWeek: () => apply(endWeek),
    payBill: (key) => apply((current) => payBill(current, key)),
    cardSpend: (merchant, amount) => apply((current) => cardSpend(current, merchant, amount)),
    applyLoan: (payload) => apply((current) => applyLoan(current, payload)),
    declineLoan: () => apply(declineLoan),
    togglePush: (index) => apply((current) => togglePush(current, index)),
    dismissBanner: () => apply(clearBanner),
    dismissCoachAlert: () => apply(dismissCoachAlert),
    openBannerPush: () =>
      apply((current) => {
        if (!current.banner && !current.coachAlert) return current
        const target = current.banner || current.coachAlert
        const index = current.pushes.findIndex((item) => item.id === target.id)
        if (index < 0) return dismissCoachAlert(current)
        return { ...togglePush(current, index), banner: null }
      }),
    downloadSummary: () =>
      apply((current) => {
        const result = downloadWeeklySummary(current)
        return { ...current, toast: result.toast }
      }),
    reset: () =>
      setState(
        resetLifeMode({
          parentName: parentName || state.parentName,
          teenName: teenName || state.teenName,
        }),
      ),
  }
}
