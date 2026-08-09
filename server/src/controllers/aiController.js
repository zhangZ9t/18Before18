import {
  answerFinancialQuestion,
  generateInsight,
  generateSpendingDiscussion,
} from '../services/ai/aiService.js'
import { applyPromptWording } from '../services/insights/conversationPromptService.js'
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

export async function spendingDiscussion(request, response) {
  const discussion = await generateSpendingDiscussion(request.user)

  // Written back so the card keeps the coach's wording until the spending pattern itself changes.
  if (discussion.teenId) {
    await applyPromptWording({
      householdId: request.user.householdId,
      teenId: discussion.teenId,
      insight: discussion.summary,
      suggestedQuestion: discussion.suggestedQuestion,
      mode: discussion.mode,
    })
  }

  return sendSuccess(response, {
    discussion,
    disclosure:
      'Category patterns only. Merchant detail stays in the teen’s own view.',
  })
}
