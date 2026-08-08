import crypto from 'node:crypto'
import { env } from '../../config/env.js'
import { getParentOverview, getTeenOverview } from '../overview/overviewService.js'
import { createGeminiProvider } from './providers/geminiProvider.js'
import { createOpenAiProvider } from './providers/openAiProvider.js'

export const COACH_INSTRUCTIONS = `You are an educational family financial coach for 18 Before 18.
Explain concepts and trade-offs using only the supplied permitted context.
Do not shame spending or present one decision as morally correct.
Do not act as a regulated financial adviser.
Do not tell minors to take out real loans, credit, or restricted financial products.
Clearly distinguish simulated Family Advances from real BNPL or credit.
Use concise, age-appropriate language.
Encourage discussion with a parent for significant decisions.
Never infer, request, or expose information outside the current user's permissions.`

function safetyIdentifier(userId) {
  return crypto.createHash('sha256').update(String(userId)).digest('hex')
}

function fallbackTeenAnswer(context, question) {
  const normalized = question.toLowerCase()
  const { money, savingsGoal } = context

  if (normalized.includes('safe') || normalized.includes('why')) {
    return `You have $${money.balance} in your account, but $${money.upcomingBills} is set aside for bills, $${money.savingsCommitment} for savings, and $${money.activeAdvancePayments} for Family Advance payments. That leaves $${money.safeToSpend} safe to spend.`
  }

  if (normalized.includes('goal') || normalized.includes('how long')) {
    if (!savingsGoal) {
      return 'You do not have an active savings goal yet. Creating one can help connect today’s choices with something you want later.'
    }
    return `You have saved $${savingsGoal.currentAmount} of $${savingsGoal.targetAmount}. At $${savingsGoal.weeklyContribution} per week, the estimate is about ${savingsGoal.projection.estimatedWeeks} weeks.`
  }

  if (normalized.includes('bnpl') || normalized.includes('advance')) {
    return 'A Family Advance is only a learning simulation with your parent. It does not make an item cheaper—it commits part of your future weekly money.'
  }

  return `Your current safe-to-spend amount is $${money.safeToSpend}. I can help you compare a purchase with your bills, savings goal, and future weekly money.`
}

function fallbackParentAnswer(context, question) {
  const normalized = question.toLowerCase()
  const prompt = context.conversationPrompt

  if (normalized.includes('discuss') || normalized.includes('conversation')) {
    return prompt
      ? `${prompt.insight} Try asking: “${prompt.suggestedQuestion}”`
      : 'There is no urgent prompt this week. A useful check-in is: “What money choice felt easiest or hardest this week?”'
  }

  if (normalized.includes('safe')) {
    return `${context.teen.name} currently has $${context.weeklyOverview.safeToSpend} safe to spend after assigned commitments. Keep the conversation focused on the trade-offs, not individual merchants.`
  }

  if (normalized.includes('level') || normalized.includes('independence')) {
    return `The household is at independence level ${context.weeklyOverview.independenceLevel}. Consider bill follow-through, planning, and how much support is still needed before changing responsibility.`
  }

  return `The current Financial Habits Score is ${context.weeklyOverview.habits.score}/100. Use it as a conversation starter about behaviours, not as a judgement of wealth.`
}

async function permittedContext(user) {
  return user.role === 'parent'
    ? getParentOverview(user)
    : getTeenOverview(user)
}

export function selectAiProviders({ openAiProvider, geminiProvider }) {
  return [openAiProvider, geminiProvider].filter(Boolean)
}

export function createAiService({
  contextLoader = permittedContext,
  openAiProvider = null,
  geminiProvider = null,
} = {}) {
  const providers = selectAiProviders({ openAiProvider, geminiProvider })

  async function answerFinancialQuestion(user, question) {
    const context = await contextLoader(user)
    const fallback =
      user.role === 'parent'
        ? fallbackParentAnswer(context, question)
        : fallbackTeenAnswer(context, question)
    const input = `User role: ${user.role}\nPermitted financial context: ${JSON.stringify(
      context,
    )}\nQuestion: ${question}`

    for (const provider of providers) {
      try {
        const text = await provider.generate({
          instructions: COACH_INSTRUCTIONS,
          input,
          safetyIdentifier: safetyIdentifier(user.id),
        })

        if (text?.trim()) {
          return { text: text.trim(), mode: provider.name }
        }
      } catch {
        // Try the next configured provider before using the deterministic fallback.
      }
    }

    return { text: fallback, mode: 'fallback' }
  }

  async function generateInsight(user) {
    const question =
      user.role === 'parent'
        ? 'What is the one most useful, non-judgemental conversation to have this week?'
        : 'What is the one most useful thing to understand about my money this week?'

    return answerFinancialQuestion(user, question)
  }

  return { answerFinancialQuestion, generateInsight }
}

const defaultAiService = createAiService({
  openAiProvider: createOpenAiProvider({
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL,
  }),
  geminiProvider: createGeminiProvider({
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL,
  }),
})

export const answerFinancialQuestion = defaultAiService.answerFinancialQuestion
export const generateInsight = defaultAiService.generateInsight
