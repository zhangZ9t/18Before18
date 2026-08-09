import crypto from 'node:crypto'
import { env } from '../../config/env.js'
import { getParentOverview, getTeenOverview } from '../overview/overviewService.js'
import { createGeminiProvider } from './providers/geminiProvider.js'

const COACH_GUARDRAILS = `You are an educational family financial coach for 18 Before 18.
Explain concepts and trade-offs using only the supplied permitted context.
Do not shame spending or present one decision as morally correct.
Do not act as a regulated financial adviser.
Do not tell minors to take out real loans, credit, or restricted financial products.
Clearly distinguish simulated Family Advances from real BNPL or credit.
Encourage discussion with a parent for significant decisions.
Never infer, request, or expose information outside the current user's permissions.`

export const COACH_INSTRUCTIONS = `${COACH_GUARDRAILS}

Answer format, which matters as much as the content:
Reply with at most two short sentences and no more than 40 words in total.
Lead with the number or the direct answer, then at most one sentence explaining why it matters.
Write plain conversational text only. Never use markdown, asterisks, underscores, backticks, headings, bullet points, numbered lists, or emoji.
Never restate the question, greet the user, or add a sign-off.`

export const SPENDING_DISCUSSION_INSTRUCTIONS = `${COACH_GUARDRAILS}

You are given the teenager's recent category-level spending, a precomputed analysis, and the one pattern that was detected as most worth discussing.
Write about that detected pattern; do not pick a different angle.
Merchant and product detail is deliberately withheld, so never guess or invent specific purchases.
Use the supplied percentages, totals, and time window exactly as given; do not recalculate or round them differently.

Reply with exactly these three labelled lines and nothing else:
SUMMARY: one sentence naming the clearest habit, including the percentage and category when one stands out.
DISCUSS: two sentences telling the parent what to raise with their child, framed as curiosity about trade-offs rather than blame or correction.
ASK: one short question the parent can ask out loud, with no quotation marks.

Write plain text only. Never use markdown, asterisks, underscores, backticks, headings, bullet points, or emoji.`

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

// Sentence boundaries only, so money amounts such as $12.50 are never split.
function splitSentences(text) {
  return text.split(/(?<=[.!?])\s+(?=["'“(\d$A-Z])/)
}

function clampSentences(text, maxSentences, maxCharacters) {
  let clamped = ''

  for (const sentence of splitSentences(text).slice(0, maxSentences)) {
    const next = clamped ? `${clamped} ${sentence}` : sentence
    if (clamped && next.length > maxCharacters) break
    clamped = next
  }

  if (clamped.length <= maxCharacters) return clamped

  const truncated = clamped.slice(0, maxCharacters)
  const lastSpace = truncated.lastIndexOf(' ')
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : maxCharacters).replace(/[,;:]$/, '')}…`
}

// Models drift towards long markdown replies, so the coach panel gets a short plain-text answer.
export function condenseAnswer(
  text,
  { maxSentences = MAX_SENTENCES, maxCharacters = MAX_CHARACTERS } = {},
) {
  const plain = stripMarkdown(String(text ?? ''))
    .replace(/\s+/g, ' ')
    .trim()

  return plain ? clampSentences(plain, maxSentences, maxCharacters) : ''
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

// Deterministic maths first: the model is asked to phrase these numbers, never to derive them.
export function summariseSpending(spendingByCategory = []) {
  const categories = [...spendingByCategory]
    .filter((entry) => entry?.amount > 0)
    .sort((left, right) => right.amount - left.amount)
  const total =
    Math.round(categories.reduce((sum, entry) => sum + entry.amount, 0) * 100) / 100
  const [top] = categories
  const share = total > 0 && top ? Math.round((top.amount / total) * 100) : 0

  return {
    total,
    categoryCount: categories.length,
    topCategory: top?.category ?? null,
    topAmount: top?.amount ?? 0,
    topShare: share,
    // One category taking most of the week is the pattern parents most often want to talk about.
    isConcentrated: share >= 60 && categories.length > 1,
    categories: categories.map(({ category, amount }) => ({
      category,
      amount,
      share: total > 0 ? Math.round((amount / total) * 100) : 0,
    })),
  }
}

function fallbackSpendingDiscussion(context, analysis) {
  const firstName = context.teen?.name?.split(' ')[0] ?? 'Your teen'

  if (analysis.total === 0) {
    return {
      summary: `No spending recorded for ${firstName} yet.`,
      discussion: `Ask what ${firstName} is planning to spend on this week and how that fits the weekly deposit. Agreeing the plan before the money moves makes the next review a comparison rather than a verdict.`,
      suggestedQuestion: 'What are you planning to spend on this week?',
    }
  }

  if (analysis.isConcentrated) {
    return {
      summary: `${analysis.topShare}% of ${firstName}’s $${analysis.total} went to ${analysis.topCategory}.`,
      discussion: `That is worth a curious question rather than a correction: ask what ${firstName} gets out of ${analysis.topCategory} and what got squeezed out to pay for it. Then agree together on a share that still leaves room for bills and the savings goal.`,
      suggestedQuestion: `What did spending that much on ${analysis.topCategory} mean you skipped?`,
    }
  }

  return {
    summary: `${firstName} spent $${analysis.total} across ${analysis.categoryCount} categories, led by ${analysis.topCategory} at ${analysis.topShare}%.`,
    discussion: `Spending is spread out, so the useful conversation is about intent rather than limits: ask which of those categories felt planned and which felt automatic. Naming the automatic ones is usually where the next habit change comes from.`,
    suggestedQuestion: 'Which of these felt planned, and which just happened?',
  }
}

function readLabelledLine(lines, label) {
  const prefix = `${label}:`
  const line = lines.find((entry) => entry.toLowerCase().startsWith(prefix))
  return line ? line.slice(prefix.length).trim() : ''
}

function parseSpendingDiscussion(text) {
  const lines = stripMarkdown(String(text ?? ''))
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return null

  const summary = condenseAnswer(readLabelledLine(lines, 'summary'), {
    maxSentences: 1,
    maxCharacters: 150,
  })
  const discussion = condenseAnswer(readLabelledLine(lines, 'discuss'), {
    maxSentences: 2,
    maxCharacters: 300,
  })
  const suggestedQuestion = condenseAnswer(readLabelledLine(lines, 'ask'), {
    maxSentences: 1,
    maxCharacters: 120,
  }).replace(/^["'“]|["'”]$/g, '')

  if (summary && discussion) return { summary, discussion, suggestedQuestion }

  // The model ignored the labels, so fall back to reading it as prose.
  const [first, ...rest] = splitSentences(
    condenseAnswer(lines.join(' '), { maxSentences: 4, maxCharacters: 450 }),
  )
  if (!first || rest.length === 0) return null

  return {
    summary: condenseAnswer(first, { maxSentences: 1, maxCharacters: 150 }),
    discussion: condenseAnswer(rest.join(' '), { maxSentences: 2, maxCharacters: 300 }),
    suggestedQuestion: '',
  }
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

  async function generateSpendingDiscussion(user) {
    const context = await contextLoader(user)
    const signal = context.spendingSignal ?? null
    // Prefer the detector's window so the wording and the numbers describe the same period.
    const analysis = {
      ...summariseSpending(signal?.categories ?? context.spendingByCategory),
      windowDays: signal?.window?.days ?? null,
    }

    if (!context.teen) {
      return {
        summary: 'No teenager has joined this household yet.',
        discussion:
          'Share the household invite code to start seeing category-level spending. Patterns worth discussing appear once the first transactions are recorded.',
        suggestedQuestion: '',
        analysis,
        teenId: null,
        mode: 'fallback',
      }
    }

    const input = `User role: ${user.role}
Permitted financial context: ${JSON.stringify(context)}
Precomputed spending analysis: ${JSON.stringify(analysis)}
Detected pattern to write about: ${JSON.stringify(signal?.top ?? null)}
Task: summarise how the teenager is spending and what the parent should discuss with them now.`

    for (const provider of providers) {
      try {
        const parsed = parseSpendingDiscussion(
          await provider.generate({
            instructions: SPENDING_DISCUSSION_INSTRUCTIONS,
            input,
            safetyIdentifier: safetyIdentifier(user.id),
          }),
        )

        if (parsed) {
          return { ...parsed, analysis, teenId: context.teen.id, mode: provider.name }
        }
      } catch {
        // Try the next configured provider before using the deterministic fallback.
      }
    }

    return {
      ...fallbackSpendingDiscussion(context, analysis),
      analysis,
      teenId: context.teen.id,
      mode: 'fallback',
    }
  }

  return { answerFinancialQuestion, generateInsight, generateSpendingDiscussion }
}

const defaultAiService = createAiService({
  geminiProvider: createGeminiProvider({
    apiKey: env.GEMINI_API_KEY,
    model: env.GEMINI_MODEL,
  }),
})

export const answerFinancialQuestion = defaultAiService.answerFinancialQuestion
export const generateInsight = defaultAiService.generateInsight
export const generateSpendingDiscussion = defaultAiService.generateSpendingDiscussion
