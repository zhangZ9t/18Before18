export const formatMoney = (amount, options = {}) =>
  new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: options.cents ? 2 : 0,
  }).format(Number(amount) || 0)

export const formatDate = (date) =>
  new Intl.DateTimeFormat('en-NZ', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(date))
