import { ConversationPrompt } from '../models/ConversationPrompt.js'
import { AppError } from '../utils/AppError.js'
import { sendSuccess } from '../utils/http.js'

export async function listPrompts(request, response) {
  const prompts = await ConversationPrompt.find({
    householdId: request.user.householdId,
  }).sort({ detectedAt: -1 })
  return sendSuccess(response, { prompts })
}

export async function updatePrompt(request, response) {
  const prompt = await ConversationPrompt.findOneAndUpdate(
    {
      _id: request.validated.params.id,
      householdId: request.user.householdId,
    },
    { status: request.validated.body.status },
    { returnDocument: 'after', runValidators: true },
  )

  if (!prompt) {
    throw new AppError('Conversation prompt not found', 404, 'PROMPT_NOT_FOUND')
  }
  return sendSuccess(response, { prompt })
}
