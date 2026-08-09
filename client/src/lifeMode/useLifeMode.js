import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchLifeModeCoaching } from './coachApi'
import {
  STORAGE_KEY,
  applyCoachEnrichment,
  applyLoan,
  buildWeekCoachContext,
  cardSpend,
  clearBanner,
  clearToast,
  createInitialState,
  declineLoan,
  dismissCoachAlert,
  downloadWeeklySummary,
  endWeek,
  loadStoredState,
  markCoachAnalysing,
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
  const enrichInFlight = useRef(null)
  const stateRef = useRef(state)
  stateRef.current = state

  const enrichCoachWithAi = useCallback(async (alertId, { force = false } = {}) => {
    if (!alertId) return
    if (!force && enrichInFlight.current === alertId) return
    enrichInFlight.current = alertId

    const snapshot = stateRef.current
    setState((current) => markCoachAnalysing(current, alertId))

    try {
      const moment =
        snapshot.coachAlert?.id === alertId
          ? snapshot.coachAlert
          : snapshot.pushes?.find((item) => item.id === alertId)
      const coaching = await fetchLifeModeCoaching(buildWeekCoachContext(snapshot, moment))
      setState((current) => applyCoachEnrichment(current, coaching, alertId))
    } catch {
      setState((current) => {
        const existing =
          current.coachAlert?.id === alertId
            ? current.coachAlert
            : current.pushes.find((item) => item.id === alertId)
        return applyCoachEnrichment(
          current,
          {
            mode: 'fallback',
            title: existing?.title,
            preview: existing?.preview,
            what: existing?.what,
            why: existing?.why,
            how: existing?.how,
            summary: existing?.preview || existing?.what,
            discussion: existing?.why,
            suggestedQuestion: '',
          },
          alertId,
        )
      })
    } finally {
      if (enrichInFlight.current === alertId) enrichInFlight.current = null
    }
  }, [])

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

  // Upgrade template coaching with live AI wording (same idea as Overview analyse).
  useEffect(() => {
    const alert = state.coachAlert
    if (!alert?.id) return
    if (alert.aiStatus === 'ready') return
    if (alert.aiStatus === 'loading' && enrichInFlight.current === alert.id) return
    enrichCoachWithAi(alert.id)
  }, [state.coachAlert?.id, state.coachAlert?.aiStatus, enrichCoachWithAi])

  const apply = useCallback((updater) => {
    setState((current) => updater(current))
  }, [])

  const refreshCoachAi = useCallback(() => {
    const alertId = state.coachAlert?.id || state.pushes.find((item) => item.open)?.id
    if (!alertId) return
    enrichCoachWithAi(alertId, { force: true })
  }, [enrichCoachWithAi, state.coachAlert?.id, state.pushes])

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
    refreshCoachAi,
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
