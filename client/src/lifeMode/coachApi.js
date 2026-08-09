import { api } from '../api/client'

const COACH_TIMEOUT_MS = 25000

export async function fetchLifeModeCoaching(week) {
  const timeout = new Promise((_, reject) => {
    window.setTimeout(() => {
      reject(new Error('Life Mode coaching timed out'))
    }, COACH_TIMEOUT_MS)
  })

  const data = await Promise.race([
    api.post('/ai/life-mode-coaching', { week }),
    timeout,
  ])
  return data.coaching
}
