import OpenAI from 'openai'

export function createOpenAiProvider({ apiKey, model, client } = {}) {
  const normalizedApiKey = apiKey?.trim()
  if (!normalizedApiKey && !client) return null

  const openai = client ?? new OpenAI({ apiKey: normalizedApiKey })

  return {
    name: 'openai',
    async generate({ instructions, input, safetyIdentifier }) {
      const response = await openai.responses.create({
        model,
        instructions,
        input,
        safety_identifier: safetyIdentifier,
        store: false,
      })

      return response.output_text?.trim() ?? ''
    },
  }
}
