import { simulatePurchase } from '../services/simulation/simulationEngine.js'
import { getTeenOverview } from '../services/overview/overviewService.js'
import { calculateAdvanceImpact } from '../services/financial/financialCalculations.js'
import { sendSuccess } from '../utils/http.js'

function simulationExplanation(paymentMethod, simulation, saveFirstWeeks) {
  if (paymentMethod === 'wait') {
    return 'Choosing not to buy keeps your current balance, bills, savings, and future weekly money unchanged.'
  }

  if (paymentMethod === 'save-first') {
    return `Saving first protects today’s commitments. At your current saving rate, setting aside this amount would take about ${saveFirstWeeks ?? 'an unknown number of'} weeks.`
  }

  if (paymentMethod === 'family-advance') {
    return 'A Family Advance does not make the purchase cheaper. It keeps the cost out of today’s balance but commits part of the next four weeks of money.'
  }

  return simulation.newSafeToSpend < 0
    ? 'This choice would use money already set aside for commitments. You can compare waiting, saving first, or discussing a Family Advance.'
    : `After this choice, you would have $${simulation.newSafeToSpend} safe to spend. Your bills and savings remain visible in the calculation.`
}

export async function purchaseSimulation(request, response) {
  const overview = await getTeenOverview(request.user)
  const { purchaseAmount, category, paymentMethod } = request.validated.body
  const saveFirstWeeks = overview.savingsGoal?.weeklyContribution
    ? Math.ceil(purchaseAmount / overview.savingsGoal.weeklyContribution)
    : null
  const hypotheticalAdvance =
    paymentMethod === 'family-advance'
      ? calculateAdvanceImpact({
          amount: purchaseAmount,
          installmentCount: 4,
          weeklySafeToSpend: overview.money.safeToSpend,
        })
      : null
  const advances = hypotheticalAdvance
    ? [
        ...overview.advances,
        {
          installmentAmount: hypotheticalAdvance.installmentAmount,
          installmentsRemaining: hypotheticalAdvance.installmentCount,
        },
      ]
    : overview.advances
  const simulation = simulatePurchase({
    balance: overview.money.balance,
    purchase: paymentMethod === 'money-now' ? purchaseAmount : 0,
    bills: overview.money.upcomingBills,
    savings: overview.money.savingsCommitment,
    advances,
    weeklyIncome: overview.household.weeklyDeposit,
    goal: overview.savingsGoal
      ? {
          targetAmount: overview.savingsGoal.targetAmount,
          currentAmount: overview.savingsGoal.currentAmount,
          weeklyContribution: overview.savingsGoal.weeklyContribution,
        }
      : null,
  })

  return sendSuccess(response, {
    simulation: {
      ...simulation,
      purchaseAmount,
      category: category ?? 'Other',
      paymentMethod,
      saveFirstWeeks,
      explanation: simulationExplanation(
        paymentMethod,
        simulation,
        saveFirstWeeks,
      ),
    },
  })
}
