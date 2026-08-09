import { ConversationPrompt } from '../../models/ConversationPrompt.js'
import { detectSpendingSignals } from './spendingSignals.js'

const plural = (count, singular, pluralForm = `${singular}s`) =>
  count === 1 ? singular : pluralForm

/** Deterministic wording for every signal, used until the coach rewrites it. */
export function describeSignal(signal, firstName) {
  const facts = signal.evidence

  switch (signal.type) {
    case 'category_dominant':
      return {
        insight: `${signal.category} took ${facts.share}% of what ${firstName} spent in the last ${facts.windowDays} days: $${facts.amount} across ${facts.transactionCount} ${plural(facts.transactionCount, 'purchase')}.`,
        suggestedQuestion: `What did spending $${facts.amount} on ${signal.category} mean you skipped?`,
      }
    case 'category_surge':
      return {
        insight: `${signal.category} spending jumped to $${facts.amount} in the last ${facts.windowDays} days, up from $${facts.previousAmount} the ${facts.windowDays} days before.`,
        suggestedQuestion: `What changed about ${signal.category} recently?`,
      }
    case 'outspent_income':
      return {
        insight: `${firstName} spent $${facts.windowSpend} against $${facts.income} coming in over the last ${facts.windowDays} days.`,
        suggestedQuestion: 'Which of those choices would you still make if the money had to last?',
      }
    case 'savings_paused':
      return {
        insight: `Nothing moved into savings in the last ${facts.windowDays} days while $${facts.windowSpend} went out.`,
        suggestedQuestion: 'What would make it easier to put something aside this week?',
      }
    case 'single_purchase':
      return {
        insight: `One $${facts.amount} ${signal.category} purchase was ${facts.share}% of everything ${firstName} spent in the last ${facts.windowDays} days.`,
        suggestedQuestion: `Looking back at that $${facts.amount}, was it worth what it cost elsewhere?`,
      }
    case 'subscription_stack':
      return {
        insight: `${facts.transactionCount} ${plural(facts.transactionCount, 'subscription')} took $${facts.amount} in the last ${facts.windowDays} days, ${facts.share}% of ${firstName}'s spending.`,
        suggestedQuestion: 'Which subscriptions do you still actually use?',
      }
    case 'steady':
      return {
        insight: `${firstName} spread $${facts.windowSpend} across ${facts.categoryCount} categories, with ${facts.topCategory} highest at ${facts.topShare}%.`,
        suggestedQuestion: 'Which of those felt planned, and which just happened?',
      }
    default:
      return {
        insight: `No spending recorded in the last ${facts.windowDays} days.`,
        suggestedQuestion: 'What are you planning to spend on next?',
      }
  }
}

export function serializeConversationPrompt(prompt) {
  if (!prompt) return null

  return {
    id: prompt.id,
    insight: prompt.insight,
    suggestedQuestion: prompt.suggestedQuestion,
    status: prompt.status,
    signalType: prompt.signalType,
    category: prompt.category,
    evidence: prompt.evidence,
    mode: prompt.mode,
    detectedAt: prompt.detectedAt,
  }
}

/**
 * Recomputes the household's prompt from the teen's actual transactions.
 *
 * The stored prompt is keyed by pattern, so it changes the moment spending changes shape
 * rather than on a weekly cycle: same pattern refreshes its numbers in place, a different
 * pattern supersedes it, and a pattern the parent already handled steps aside for the next one.
 */
export async function refreshConversationPrompt({
  householdId,
  teenId,
  teenName,
  transactions,
  now = new Date(),
}) {
  const detection = detectSpendingSignals(transactions, { now })
  const firstName = teenName?.split(' ')[0] ?? 'Your teen'

  const [handled, active] = await Promise.all([
    ConversationPrompt.find({
      householdId,
      teenId,
      status: { $in: ['discussed', 'dismissed'] },
    }),
    ConversationPrompt.findOne({ householdId, teenId, status: 'active' }).sort({
      detectedAt: -1,
    }),
  ])

  const signal = detection.signals.find(
    (candidate) =>
      !handled.some(
        (prompt) => prompt.signalKey === candidate.key && prompt.bucket === candidate.bucket,
      ),
  )

  if (!signal) {
    if (active) {
      active.status = 'superseded'
      await active.save()
    }
    return { prompt: null, detection }
  }

  if (active?.signalKey === signal.key && active.bucket === signal.bucket) {
    // Same pattern: keep any coach wording, but never show stale numbers.
    active.evidence = signal.evidence
    if (active.mode === 'fallback') {
      Object.assign(active, describeSignal(signal, firstName))
    }
    await active.save()
    return { prompt: active, detection }
  }

  if (active) {
    active.status = 'superseded'
    await active.save()
  }

  const prompt = await ConversationPrompt.create({
    householdId,
    teenId,
    signalKey: signal.key,
    signalType: signal.type,
    category: signal.category,
    bucket: signal.bucket,
    evidence: signal.evidence,
    mode: 'fallback',
    detectedAt: now,
    status: 'active',
    ...describeSignal(signal, firstName),
  })

  return { prompt, detection }
}

/** Persists coach wording onto the active prompt so it is written once per pattern. */
export async function applyPromptWording({
  householdId,
  teenId,
  insight,
  suggestedQuestion,
  mode,
}) {
  if (!insight || mode === 'fallback') return null

  return ConversationPrompt.findOneAndUpdate(
    { householdId, teenId, status: 'active' },
    {
      insight,
      ...(suggestedQuestion ? { suggestedQuestion } : {}),
      mode,
    },
    { returnDocument: 'after', sort: { detectedAt: -1 } },
  )
}
