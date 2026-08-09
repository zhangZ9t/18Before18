import { describe, expect, it, vi } from 'vitest'
import {
  COACH_INSTRUCTIONS,
  SPENDING_DISCUSSION_INSTRUCTIONS,
  condenseAnswer,
  createAiService,
  selectAiProviders,
  summariseSpending,
} from '../src/services/ai/aiService.js'
import { createGeminiProvider } from '../src/services/ai/providers/geminiProvider.js'

const teenUser = { id: 'teen-user-id', role: 'teen' }
const teenContext = {
  money: {
    balance: 180,
    upcomingBills: 40,
    savingsCommitment: 20,
    activeAdvancePayments: 20,
    safeToSpend: 100,
  },
  savingsGoal: null,
  household: {
    visibleCategories: [{ name: 'Food', weeklyBudget: 180 }],
  },
}

function mockProvider(name, implementation) {
  return { name, generate: vi.fn(implementation) }
}

describe('AI provider selection', () => {
  it('orders OpenAI before Gemini and removes unconfigured providers', () => {
    const openAiProvider = mockProvider('openai', async () => 'OpenAI')
    const geminiProvider = mockProvider('gemini', async () => 'Gemini')

    expect(selectAiProviders({ openAiProvider, geminiProvider })).toEqual([
      openAiProvider,
      geminiProvider,
    ])
    expect(
      selectAiProviders({ openAiProvider: null, geminiProvider }),
    ).toEqual([geminiProvider])
  })

  it('uses OpenAI first when both providers are configured', async () => {
    const openAiProvider = mockProvider('openai', async () => 'OpenAI answer')
    const geminiProvider = mockProvider('gemini', async () => 'Gemini answer')
    const service = createAiService({
      contextLoader: async () => teenContext,
      openAiProvider,
      geminiProvider,
    })

    const answer = await service.answerFinancialQuestion(
      teenUser,
      'Why is my safe-to-spend lower?',
    )

    expect(answer).toEqual({ text: 'OpenAI answer', mode: 'openai' })
    expect(geminiProvider.generate).not.toHaveBeenCalled()

    const request = openAiProvider.generate.mock.calls[0][0]
    expect(request.instructions).toBe(COACH_INSTRUCTIONS)
    expect(request.input).toContain(JSON.stringify(teenContext))
    expect(request.safetyIdentifier).not.toBe(teenUser.id)
    expect(request.safetyIdentifier).toMatch(/^[a-f\d]{64}$/)
  })

  it('uses Gemini when OpenAI is not configured', async () => {
    const geminiProvider = mockProvider('gemini', async () => 'Gemini answer')
    const service = createAiService({
      contextLoader: async () => teenContext,
      geminiProvider,
    })

    await expect(
      service.answerFinancialQuestion(teenUser, 'Can I afford this?'),
    ).resolves.toEqual({ text: 'Gemini answer', mode: 'gemini' })
  })

  it('fails over from OpenAI to Gemini when OpenAI errors', async () => {
    const openAiProvider = mockProvider('openai', async () => {
      throw new Error('OpenAI unavailable')
    })
    const geminiProvider = mockProvider('gemini', async () => 'Gemini answer')
    const service = createAiService({
      contextLoader: async () => teenContext,
      openAiProvider,
      geminiProvider,
    })

    await expect(
      service.answerFinancialQuestion(teenUser, 'Can I afford this?'),
    ).resolves.toEqual({ text: 'Gemini answer', mode: 'gemini' })
  })

  it('uses the deterministic fallback when providers are absent or fail', async () => {
    const openAiProvider = mockProvider('openai', async () => '')
    const geminiProvider = mockProvider('gemini', async () => {
      throw new Error('Gemini unavailable')
    })
    const service = createAiService({
      contextLoader: async () => teenContext,
      openAiProvider,
      geminiProvider,
    })

    const answer = await service.answerFinancialQuestion(
      teenUser,
      'Why is my safe-to-spend lower?',
    )

    expect(answer.mode).toBe('fallback')
    expect(answer.text).toContain('$100 safe to spend')

    const serviceWithoutProviders = createAiService({
      contextLoader: async () => teenContext,
    })
    await expect(
      serviceWithoutProviders.answerFinancialQuestion(
        teenUser,
        'Why is my safe-to-spend lower?',
      ),
    ).resolves.toMatchObject({ mode: 'fallback' })
  })
})

describe('AI provider adapters', () => {
  it('maps shared guardrails and permitted context to Gemini', async () => {
    const generateContent = vi
      .fn()
      .mockResolvedValue({ text: '  Gemini response  ' })
    const provider = createGeminiProvider({
      model: 'gemini-test-model',
      client: { models: { generateContent } },
    })

    await expect(
      provider.generate({ instructions: 'Shared guardrails', input: 'Context' }),
    ).resolves.toBe('Gemini response')
    expect(generateContent).toHaveBeenCalledWith({
      model: 'gemini-test-model',
      contents: 'Context',
      config: { systemInstruction: 'Shared guardrails' },
    })
  })

  it('returns no provider when Gemini is not configured', () => {
    expect(createGeminiProvider({ apiKey: '  ' })).toBeNull()
    expect(selectAiProviders({ openAiProvider: null, geminiProvider: null })).toEqual([])
  })
})

const parentUser = { id: 'parent-user-id', role: 'parent' }
const parentContext = {
  teen: { id: 'teen-user-id', name: 'Maya Chen' },
  weeklyOverview: { safeToSpend: 100, independenceLevel: 2, habits: { score: 72 } },
  spendingByCategory: [
    { category: 'Entertainment', amount: 90 },
    { category: 'Food', amount: 10 },
  ],
  conversationPrompt: null,
}

describe('Spending discussion', () => {
  it('computes the category concentration without the model', () => {
    const analysis = summariseSpending(parentContext.spendingByCategory)

    expect(analysis).toMatchObject({
      total: 100,
      categoryCount: 2,
      topCategory: 'Entertainment',
      topShare: 90,
      isConcentrated: true,
    })
    expect(summariseSpending([])).toMatchObject({ total: 0, topCategory: null, isConcentrated: false })
    expect(summariseSpending([{ category: 'Food', amount: 12 }]).isConcentrated).toBe(false)
  })

  it('parses the labelled model reply and keeps each part short', async () => {
    const geminiProvider = mockProvider(
      'gemini',
      async () =>
        'SUMMARY: **90%** of Maya’s $100 went to Entertainment.\nDISCUSS: Ask what she gets out of it. Then agree a share that protects the goal.\nASK: “What did that spending mean you skipped?”',
    )
    const service = createAiService({
      contextLoader: async () => parentContext,
      geminiProvider,
    })

    const discussion = await service.generateSpendingDiscussion(parentUser)

    expect(discussion.mode).toBe('gemini')
    expect(discussion.summary).toBe('90% of Maya’s $100 went to Entertainment.')
    expect(discussion.discussion).toBe(
      'Ask what she gets out of it. Then agree a share that protects the goal.',
    )
    expect(discussion.suggestedQuestion).toBe('What did that spending mean you skipped?')
    expect(discussion.analysis.topShare).toBe(90)

    const request = geminiProvider.generate.mock.calls[0][0]
    expect(request.instructions).toBe(SPENDING_DISCUSSION_INSTRUCTIONS)
    expect(request.input).toContain('"topShare":90')
  })

  it('falls back to a deterministic concentration summary', async () => {
    const service = createAiService({ contextLoader: async () => parentContext })
    const discussion = await service.generateSpendingDiscussion(parentUser)

    expect(discussion.mode).toBe('fallback')
    expect(discussion.summary).toBe('90% of Maya’s $100 went to Entertainment.')
    expect(discussion.discussion).toContain('Entertainment')
    expect(discussion.suggestedQuestion).toBeTruthy()
  })

  it('handles a household with no spending and no teen', async () => {
    const noSpending = createAiService({
      contextLoader: async () => ({ ...parentContext, spendingByCategory: [] }),
    })
    await expect(noSpending.generateSpendingDiscussion(parentUser)).resolves.toMatchObject({
      summary: 'No spending recorded for Maya yet.',
      mode: 'fallback',
    })

    const geminiProvider = mockProvider('gemini', async () => 'should not be called')
    const noTeen = createAiService({
      contextLoader: async () => ({ teen: null, spendingByCategory: [] }),
      geminiProvider,
    })
    await expect(noTeen.generateSpendingDiscussion(parentUser)).resolves.toMatchObject({
      summary: 'No teenager has joined this household yet.',
    })
    expect(geminiProvider.generate).not.toHaveBeenCalled()
  })
})

describe('Coach answer formatting', () => {
  it('strips markdown artifacts from provider answers', async () => {
    const geminiProvider = mockProvider(
      'gemini',
      async () =>
        '## Safe to spend\n\n**$100** is safe to spend.\n\n- Bills take _$40_\n- Savings take `$20`',
    )
    const service = createAiService({
      contextLoader: async () => teenContext,
      geminiProvider,
    })

    const answer = await service.answerFinancialQuestion(teenUser, 'Why?')

    expect(answer.text).not.toMatch(/[*`#]/)
    expect(answer.text).toBe('Safe to spend $100 is safe to spend. Bills take $40 Savings take $20')
  })

  it('keeps answers short and never splits money amounts', () => {
    const long = Array.from(
      { length: 6 },
      (_, index) => `Sentence number ${index} explains one more trade-off in detail.`,
    ).join(' ')

    expect(condenseAnswer(long).length).toBeLessThanOrEqual(240)
    expect(condenseAnswer(long).split(/(?<=[.!?])\s+/)).toHaveLength(3)
    expect(condenseAnswer('You have $12.50 left. Spend it well. Then review. And again.')).toBe(
      'You have $12.50 left. Spend it well. Then review.',
    )
  })

  it('condenses the deterministic fallback too', async () => {
    const service = createAiService({ contextLoader: async () => teenContext })
    const answer = await service.answerFinancialQuestion(teenUser, 'Why is safe-to-spend lower?')

    expect(answer.text.length).toBeLessThanOrEqual(240)
    expect(answer.text).toContain('$100 safe to spend')
  })
})
