import crypto from 'node:crypto'

const inviteAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateInviteCode() {
  const suffix = Array.from({ length: 4 }, () => {
    const index = crypto.randomInt(0, inviteAlphabet.length)
    return inviteAlphabet[index]
  }).join('')

  return `FAMILY-${suffix}`
}
