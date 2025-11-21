import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, Loader2, Trash2, MessageSquare } from 'lucide-react'
import { DiagramType, AIProvider, ChatMessage } from '@/types/diagram'
import { useChatStore } from '@/stores/chatStore'
import { useConfigStore } from '@/stores/configStore'
import apiClient from '@/services/api'

interface AIChatPanelProps {
  onGenerate: (code: string) => void
  onGeneratingChange: (generating: boolean) => void
}

const diagramTypes = [
  { value: DiagramType.FLOWCHART, label: '流程图' },
  { value: DiagramType.ARCHITECTURE, label: '系统架构图' },
  { value: DiagramType.SEQUENCE, label: '时序图' },
  { value: DiagramType.CLASS, label: '类图' },
  { value: DiagramType.ER, label: 'ER图' },
  { value: DiagramType.GANTT, label: '甘特图' },
  { value: DiagramType.SWIMLANE, label: '泳道图' },
  { value: DiagramType.STATE, label: '状态图' },
]

const aiProviders = [
  { value: AIProvider.CLAUDE, label: 'Claude 3.5 Sonnet' },
  { value: AIProvider.OPENAI, label: 'GPT-4' },
  { value: AIProvider.DEEPSEEK, label: 'DeepSeek R1' },
]

function AIChatPanel({ onGenerate, onGeneratingChange }: AIChatPanelProps) {
  const [input, setInput] = useState('')
  const [diagramType, setDiagramType] = useState<DiagramType>(DiagramType.FLOWCHART)
  const [aiProvider, setAIProvider] = useState<AIProvider>(AIProvider.CLAUDE)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const {
    createConversation,
    addMessage,
    updateMessage,
    clearConversation,
    getCurrentConversation,
    currentConversationId,
  } = useChatStore()

  const { getAPIKey, getAPIBaseUrl } = useConfigStore()

  const currentConversation = getCurrentConversation()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation?.messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const extractDiagramCode = (text: string): string | null => {
    // Try to extract Draw.io XML
    const xmlMatch = text.match(/<\?xml[\s\S]*?<\/mxfile>/i)
    if (xmlMatch) {
      return xmlMatch[0]
    }

    // Try to extract from code blocks
    const codeBlockMatch = text.match(/```(?:xml|drawio)?\s*([\s\S]*?)```/i)
    if (codeBlockMatch && codeBlockMatch[1].includes('<mxfile')) {
      return codeBlockMatch[1].trim()
    }

    return null
  }

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    }

    let conversationId = currentConversationId
    if (!conversationId) {
      conversationId = createConversation(diagramType, aiProvider)
    }

    addMessage(conversationId, userMessage)
    setInput('')
    setError(null)
    setIsStreaming(true)
    onGeneratingChange(true)

    const assistantMessageId = `msg-${Date.now() + 1}`
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    }

    addMessage(conversationId, assistantMessage)

    try {
      abortControllerRef.current = new AbortController()

      const conversation = getCurrentConversation()
      if (!conversation) throw new Error('No active conversation')

      const messages = conversation.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }))

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      const anthropicKey = getAPIKey('anthropicKey')
      const openaiKey = getAPIKey('openaiKey')
      const deepseekKey = getAPIKey('deepseekKey')
      const anthropicBaseUrl = getAPIBaseUrl('anthropicBaseUrl')
      const openaiBaseUrl = getAPIBaseUrl('openaiBaseUrl')
      const deepseekBaseUrl = getAPIBaseUrl('deepseekBaseUrl')

      if (anthropicKey) headers['X-Anthropic-Key'] = anthropicKey
      if (openaiKey) headers['X-OpenAI-Key'] = openaiKey
      if (deepseekKey) headers['X-DeepSeek-Key'] = deepseekKey
      if (anthropicBaseUrl) headers['X-Anthropic-Base-Url'] = anthropicBaseUrl
      if (openaiBaseUrl) headers['X-OpenAI-Base-Url'] = openaiBaseUrl
      if (deepseekBaseUrl) headers['X-DeepSeek-Base-Url'] = deepseekBaseUrl

      const response = await fetch(`${apiClient.defaults.baseURL}/ai/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages,
          diagramType,
          format: 'drawio',
          aiProvider,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('Stream request failed')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            try {
              const parsed = JSON.parse(data)
              
              if (parsed.type === 'chunk' && parsed.content) {
                accumulatedContent += parsed.content
                updateMessage(conversationId!, assistantMessageId, {
                  content: accumulatedContent,
                })
              } else if (parsed.type === 'done') {
                updateMessage(conversationId!, assistantMessageId, {
                  isStreaming: false,
                })
                
                // Extract and render diagram if present
                const diagramCode = extractDiagramCode(accumulatedContent)
                if (diagramCode) {
                  onGenerate(diagramCode)
                }
              } else if (parsed.type === 'error') {
                throw new Error(parsed.message || 'Streaming error')
              }
            } catch (e) {
              console.error('Failed to parse stream data:', e)
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      const errorMessage = err instanceof Error ? err.message : '生成失败，请重试'
      setError(errorMessage)
      updateMessage(conversationId!, assistantMessageId, {
        content: `错误: ${errorMessage}`,
        isStreaming: false,
      })
    } finally {
      setIsStreaming(false)
      onGeneratingChange(false)
      abortControllerRef.current = null
    }
  }

  const handleClearChat = () => {
    if (currentConversationId && confirm('确定要清空对话历史吗？')) {
      clearConversation(currentConversationId)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare size={20} className="text-blue-500" />
            AI 对话生成
          </h2>
          {currentConversation && currentConversation.messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              title="清空对话"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        <div className="space-y-2">
          <select
            value={diagramType}
            onChange={(e) => setDiagramType(e.target.value as DiagramType)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={isStreaming}
          >
            {diagramTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <select
            value={aiProvider}
            onChange={(e) => setAIProvider(e.target.value as AIProvider)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={isStreaming}
          >
            {aiProviders.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!currentConversation || currentConversation.messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div className="max-w-md space-y-3">
              <Sparkles size={48} className="mx-auto text-blue-500 opacity-50" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                开始与 AI 对话，描述你想要的图表
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                AI 会在对话中理解你的需求，并在回复完成后自动渲染图表
              </p>
            </div>
          </div>
        ) : (
          <>
            {currentConversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words text-sm">
                    {message.content}
                    {message.isStreaming && (
                      <span className="inline-block ml-1 w-2 h-4 bg-current animate-pulse" />
                    )}
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="描述你想要的图表... (Shift+Enter 换行)"
            rows={3}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isStreaming}
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
          >
            {isStreaming ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          💡 对话内容会被保留，AI 会理解上下文并持续优化图表
        </p>
      </div>
    </div>
  )
}

export default AIChatPanel
