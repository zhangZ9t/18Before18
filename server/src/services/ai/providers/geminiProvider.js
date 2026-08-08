import { GoogleGenAI } from '@google/genai'

export function createGeminiProvider({ apiKey, model, client } = {}) {
  const normalizedApiKey = apiKey?.trim()
  if (!normalizedApiKey && !client) return null

  const gemini = client ?? new GoogleGenAI({ apiKey: normalizedApiKey })

  return {
    name: 'gemini',
    async generate({ instructions, input }) {
      const response = await gemini.models.generateContent({
        model,
        contents: input,
        config: {
          systemInstruction: instructions,
        },
      })

      return response.text?.trim() ?? ''
    },
  }
}
