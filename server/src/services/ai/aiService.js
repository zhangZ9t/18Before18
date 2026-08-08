import crypto from 'node:crypto'
import { env } from '../../config/env.js'
import { getParentOverview, getTeenOverview } from '../overview/overviewService.js'
import { createGeminiProvider } from './providers/geminiProvider.js'

export const COACH_INSTRUCTIONS = `You are an educational family financial coach for 18 Before 18.
Explain concepts and trade-offs using only the supplied permitted context.
Do not shame spending or present one decision as morally correct.
Do not act as a regulated financial adviser.
Do not tell minors to take out real loans, credit, or restricted financial products.
Clearly distinguish simulated Family Advances from real BNPL or credit.
Encourage discussion with a parent for significant decisions.
Never infer, request, or expose information outside the current user's permissions.

Answer format, which matters as much as the content:
Reply with at most two short sentences and no more than 40 words in total.
Lead with the number or the direct answer, then at most one sentence explaining why it matters.
Write plain conversational text only. Never use markdown, asterisks, underscores, backticks, headings, bullet points, numbered lists, or emoji.
Never restate the question, greet the user, or add a sign-off.`

const MAX_SENTENCES = 3
const MAX_CHARACTERS = 240

function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^\s*(?:[-*+•]|\d+[.)])\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/gs, '$2')
    .replace(/\*+/g, '')
    .replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?;:]|$)/g, '$1$2')
}

function clampSentences(text) {
  const sentences = text.split(/(?<=[.!?])\s+(?=["'“(\d$A-Z])/)
  let clamped = ''

  for (const sentence of sentences.slice(0, MAX_SENTENCES)) {
    const next = clamped ? `${clamped} ${sentence}` : sentence
    if (clamped && next.length > MAX_CHARACTERS) break
    clamped = next
  }

  if (clamped.length <= MAX_CHARACTERS) return clamped

  const truncated = clamped.slice(0, MAX_CHARACTERS)
  const lastSpace = truncated.lastIndexOf(' ')
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : MAX_CHARACTERS).replace(/[,;:]$/, '')}…`
}

// Models drift towards long markdown replies, so the coach panel gets a short plain-text answer.
export function condenseAnswer(text) {
  const plain = stripMarkdown(String(text ?? ''))
    .replace(/\s+/g, ' ')
    .trim()

  return plain ? clampSentences(plain) : ''
}

function safetyIdentifier(userId) {
  return crypto.createHash('sha256').update(String(userId)).digest('hex')
}

function fallbackTeenAnswer(context, question) {
  const normalized = question.toLowerCase()
  const { money, savingsGoal } = context

  if (normalized.includes('safe') || normalized.includes('why')) {
    return `Bills ($${money.upcomingBills}), savings ($${money.savingsCommitment}), and advances ($${money.activeAdvancePayments}) are held back from your $${money.balance} balance, leaving $${money.safeToSpend} safe to spend.`
  }

  if (normalized.includes('goal') || normalized.includes('how long')) {
    if (!savingsGoal) {
      return 'No savings goal yet. Setting one links today’s choices to something you want later.'
    }
    return `You have saved $${savingsGoal.currentAmount} of $${savingsGoal.targetAmount}, about ${savingsGoal.projection.estimatedWeeks} weeks to go at $${savingsGoal.weeklyContribution} per week.`
  }

  if (normalized.includes('bnpl') || normalized.includes('advance')) {
    return 'A Family Advance is a simulation with your parent, not real credit. It does not lower the price, it commits part of your future weekly money.'
  }

  return `You have $${money.safeToSpend} safe to spend. Ask me to compare a purchase against your bills, goal, or coming weeks.`
}

function fallbackParentAnswer(context, question) {
  const normalized = question.toLowerCase()
  const prompt = context.conversationPrompt

  if (normalized.includes('discuss') || normalized.includes('conversation')) {
    return prompt
      ? `${prompt.insight} Try asking: “${prompt.suggestedQuestion}”`
      : 'No urgent prompt this week. A useful check-in is: “What money choice felt easiest or hardest this week?”'
  }

  if (normalized.includes('safe')) {
    return `${context.teen.name} has $${context.weeklyOverview.safeToSpend} safe to spend after commitments. Keep it about the trade-offs, not individual merchants.`
  }

  if (normalized.includes('level') || normalized.includes('independence')) {
    return `The household is at independence level ${context.weeklyOverview.independenceLevel}. Look at bill follow-through and planning before moving up.`
  }

  return `The Financial Habits Score is ${context.weeklyOverview.habits.score}/100. Treat it as a conversation starter about behaviour, not wealth.`
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

        const condensed = condenseAnswer(text)
        if (condensed) {
          return { text: condensed, mode: provider.name }
        }
      } catch {
        // Try the next configured provider before using the deterministic fallback.
      }
    }

    return { text: condenseAnswer(fallback), mode: 'fallback' }
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
  geminiProvider: createGeminiProvider({
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL,
  }),
})

export const answerFinancialQuestion = defaultAiService.answerFinancialQuestion
export const generateInsight = defaultAiService.generateInsight
