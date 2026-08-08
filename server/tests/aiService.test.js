import { describe, expect, it, vi } from 'vitest'
import {
  COACH_INSTRUCTIONS,
  createAiService,
  selectAiProviders,
} from '../src/services/ai/aiService.js'
import { createGeminiProvider } from '../src/services/ai/providers/geminiProvider.js'
import { createOpenAiProvider } from '../src/services/ai/providers/openAiProvider.js'

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

  it('keeps OpenAI storage disabled and sends the hashed safety identifier', async () => {
    const create = vi.fn().mockResolvedValue({ output_text: ' OpenAI response ' })
    const provider = createOpenAiProvider({
      model: 'openai-test-model',
      client: { responses: { create } },
    })

    await expect(
      provider.generate({
        instructions: 'Shared guardrails',
        input: 'Context',
        safetyIdentifier: 'hashed-user-id',
      }),
    ).resolves.toBe('OpenAI response')
    expect(create).toHaveBeenCalledWith({
      model: 'openai-test-model',
      instructions: 'Shared guardrails',
      input: 'Context',
      safety_identifier: 'hashed-user-id',
      store: false,
    })
  })
})
