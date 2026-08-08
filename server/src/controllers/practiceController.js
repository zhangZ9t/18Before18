import { Household } from '../models/Household.js'
import { PracticeScenario } from '../models/PracticeScenario.js'
import { sendSuccess } from '../utils/http.js'

export async function listPracticeScenarios(request, response) {
  const household = await Household.findById(request.user.householdId)
  const scenarios = await PracticeScenario.find({
    minimumIndependenceLevel: { $lte: household.independenceLevel },
  }).sort({ minimumIndependenceLevel: 1, createdAt: 1 })

  return sendSuccess(response, {
    label: 'Practice Scenario',
    scenarios,
  })
}
