import {
  answerFinancialQuestion,
  generateInsight,
} from '../services/ai/aiService.js'
import { sendSuccess } from '../utils/http.js'

export async function chat(request, response) {
  const answer = await answerFinancialQuestion(
    request.user,
    request.validated.body.question,
  )
  return sendSuccess(response, {
    answer,
    disclosure:
      'This coach explains educational trade-offs. It is not financial advice.',
  })
}

export async function insight(request, response) {
  return sendSuccess(response, {
    insight: await generateInsight(request.user),
    disclosure:
      'This coach explains educational trade-offs. It is not financial advice.',
  })
}
