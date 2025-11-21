import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, Loader2, Trash2, MessageSquare, Copy, RotateCw, ChevronDown, ChevronUp, Brain } from 'lucide-react'
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
  const [thoughtsExpanded, setThoughtsExpanded] = useState<Record<string, boolean>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const {
    createConversation,
    addMessage,
    updateMessage,
    deleteMessage,
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

  const sendPrompt = async (prompt: string, options: { preserveInput?: boolean } = {}) => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || isStreaming) return

    if (!options.preserveInput) {
      setInput('')
    }

    const timestamp = Date.now()
    const userMessage: ChatMessage = {
      id: `msg-${timestamp}`,
      role: 'user',
      content: trimmedPrompt,
      timestamp: new Date().toISOString(),
    }

    let conversationId = currentConversationId
    if (!conversationId) {
      conversationId = createConversation(diagramType, aiProvider)
    }
    const activeConversationId = conversationId

    addMessage(activeConversationId, userMessage)
    setError(null)
    setIsStreaming(true)
    onGeneratingChange(true)

    const assistantMessageId = `msg-${timestamp + 1}`
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    }

    addMessage(activeConversationId, assistantMessage)

    try {
      abortControllerRef.current = new AbortController()

      const conversation = getCurrentConversation()
      if (!conversation) throw new Error('No active conversation')

      const targetDiagramType = conversation.diagramType ?? diagramType
      const targetAIProvider = conversation.aiProvider ?? aiProvider

      const messages = conversation.messages
        .filter((msg) => !msg.isStreaming && Boolean(msg.content.trim()))
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }))

      if (messages.length === 0) {
        throw new Error('No valid chat messages to send')
      }

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
          diagramType: targetDiagramType,
          format: 'drawio',
          aiProvider: targetAIProvider,
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
      let accumulatedReasoning = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const rawLine of lines) {
          const line = rawLine.trim()
          if (!line.startsWith('data:')) continue

          const data = line.slice(5).trim()
          if (!data) continue

          try {
            const parsed = JSON.parse(data)

            if (parsed.type === 'reasoning' && parsed.content) {
              accumulatedReasoning += parsed.content
              updateMessage(activeConversationId, assistantMessageId, {
                reasoning: accumulatedReasoning,
              })
            } else if ((parsed.type === 'chunk' || parsed.type === 'content') && parsed.content) {
              accumulatedContent += parsed.content
              updateMessage(activeConversationId, assistantMessageId, {
                content: accumulatedContent,
              })
            } else if (parsed.type === 'done') {
              updateMessage(activeConversationId, assistantMessageId, {
                isStreaming: false,
              })

              const diagramCode = extractDiagramCode(accumulatedContent)
              if (diagramCode) {
                onGenerate(diagramCode)
              }
            } else if (parsed.type === 'error') {
              throw new Error(parsed.message || 'Streaming error')
            }
          } catch (e) {
            console.error('Failed to parse stream data:', e, 'Data:', data)
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      const errorMessage = err instanceof Error ? err.message : '生成失败，请重试'
      setError(errorMessage)
      updateMessage(activeConversationId, assistantMessageId, {
        content: `错误: ${errorMessage}`,
        isStreaming: false,
      })
    } finally {
      setIsStreaming(false)
      onGeneratingChange(false)
      abortControllerRef.current = null
    }
  }

  const handleSend = () => {
    void sendPrompt(input)
  }

  const handleClearChat = () => {
    if (!currentConversationId || !currentConversation?.messages.length) return
    if (!confirm('确定要清空对话历史吗？')) return

    if (isStreaming) {
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
      setIsStreaming(false)
      onGeneratingChange(false)
    }

    clearConversation(currentConversationId)
    setThoughtsExpanded({})
    setError(null)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopyMessage = async (message: ChatMessage) => {
    try {
      let textToCopy = message.content
      if (message.reasoning) {
        textToCopy = `${textToCopy}\n\n[思考过程]\n${message.reasoning}`
      }
      await navigator.clipboard.writeText(textToCopy)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDeleteMessage = (message: ChatMessage) => {
    if (!currentConversationId) return

    if (message.isStreaming) {
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
      setIsStreaming(false)
      onGeneratingChange(false)
    }

    deleteMessage(currentConversationId, message.id)
    setThoughtsExpanded((prev) => {
      if (!prev[message.id]) return prev
      const next = { ...prev }
      delete next[message.id]
      return next
    })
  }

  const handleResendMessage = (message: ChatMessage) => {
    if (isStreaming) return

    if (message.role === 'user') {
      void sendPrompt(message.content, { preserveInput: true })
      return
    }

    const conversation = getCurrentConversation()
    if (!conversation) return

    const currentIndex = conversation.messages.findIndex((msg) => msg.id === message.id)
    if (currentIndex <= 0) return

    const previousUserMessage = [...conversation.messages]
      .slice(0, currentIndex)
      .reverse()
      .find((msg) => msg.role === 'user')

    if (!previousUserMessage) return

    void sendPrompt(previousUserMessage.content, { preserveInput: true })
  }

  const toggleThoughts = (messageId: string) => {
    setThoughtsExpanded((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }))
  }

  const getActionButtonClass = (role: 'user' | 'assistant') =>
    `flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
      role === 'user'
        ? 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
        : 'bg-white text-gray-600 hover:bg-gray-200 dark:bg-gray-600/60 dark:text-gray-100 dark:hover:bg-gray-500'
    }`

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
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {/* DeepSeek R1 思考过程 */}
                  {message.reasoning && message.role === 'assistant' && (
                    <div className="mb-3 border-l-2 border-purple-500 pl-3">
                      <button
                        onClick={() => toggleThoughts(message.id)}
                        className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium mb-1"
                      >
                        <Brain size={16} />
                        <span>思考过程</span>
                        {thoughtsExpanded[message.id] ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                      {thoughtsExpanded[message.id] && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                          {message.reasoning}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 消息内容 */}
                  <div className="whitespace-pre-wrap break-words text-sm">
                    {message.content}
                    {message.isStreaming && (
                      <span className="inline-block ml-1 w-2 h-4 bg-current animate-pulse" />
                    )}
                  </div>

                  {/* 时间戳 */}
                  <div className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>

                  {/* 消息操作按钮 */}
                  <div
                    className={`flex flex-wrap items-center gap-2 mt-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <button
                      onClick={() => handleResendMessage(message)}
                      className={getActionButtonClass(message.role)}
                      disabled={isStreaming}
                    >
                      <RotateCw size={14} />
                      <span>重发</span>
                    </button>
                    <button
                      onClick={() => handleCopyMessage(message)}
                      className={getActionButtonClass(message.role)}
                      disabled={!message.content}
                    >
                      <Copy size={14} />
                      <span>复制</span>
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(message)}
                      className={getActionButtonClass(message.role)}
                    >
                      <Trash2 size={14} />
                      <span>删除</span>
                    </button>
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
