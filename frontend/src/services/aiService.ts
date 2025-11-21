import apiClient from './api'
import type {
  GenerateDiagramRequest,
  GenerateDiagramResponse,
} from '@/types/diagram'

export const aiService = {
  /**
   * Generate diagram code using AI
   */
  async generateDiagram(
    request: GenerateDiagramRequest
  ): Promise<GenerateDiagramResponse> {
    const response = await apiClient.post('/ai/generate', request)
    return response.data
  },

  /**
   * Refine existing diagram with natural language instruction
   */
  async refineDiagram(
    code: string,
    instruction: string,
    aiProvider: string
  ): Promise<GenerateDiagramResponse> {
    const response = await apiClient.post('/ai/refine', {
      code,
      instruction,
      aiProvider,
    })
    return response.data
  },

  /**
   * Explain diagram in natural language
   */
  async explainDiagram(
    code: string,
    aiProvider: string
  ): Promise<{ explanation: string }> {
    const response = await apiClient.post('/ai/explain', {
      code,
      aiProvider,
    })
    return response.data
  },

  /**
   * Generate with streaming response
   */
  async generateDiagramStream(
    request: GenerateDiagramRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const response = await fetch(
      `${apiClient.defaults.baseURL}/ai/generate-stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    )

    if (!response.ok) {
      throw new Error('Stream request failed')
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) return

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          onChunk(data)
        }
      }
    }
  },
}

export default aiService