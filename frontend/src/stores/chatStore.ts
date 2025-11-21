import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatConversation, ChatMessage, DiagramType, AIProvider } from '@/types/diagram'

interface ChatStore {
  conversations: ChatConversation[]
  currentConversationId: string | null
  
  createConversation: (diagramType: DiagramType, aiProvider: AIProvider) => string
  addMessage: (conversationId: string, message: ChatMessage) => void
  updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => void
  clearConversation: (conversationId: string) => void
  deleteConversation: (conversationId: string) => void
  setCurrentConversation: (conversationId: string | null) => void
  getCurrentConversation: () => ChatConversation | null
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,

      createConversation: (diagramType, aiProvider) => {
        const id = `conv-${Date.now()}`
        const now = new Date().toISOString()
        const newConversation: ChatConversation = {
          id,
          messages: [],
          diagramType,
          aiProvider,
          createdAt: now,
          updatedAt: now,
        }
        
        set((state) => ({
          conversations: [...state.conversations, newConversation],
          currentConversationId: id,
        }))
        
        return id
      },

      addMessage: (conversationId, message) => {
        const now = new Date().toISOString()
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, message],
                  updatedAt: now,
                }
              : conv
          ),
        }))
      },

      updateMessage: (conversationId, messageId, updates) => {
        const now = new Date().toISOString()
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, ...updates } : msg
                  ),
                  updatedAt: now,
                }
              : conv
          ),
        }))
      },

      clearConversation: (conversationId) => {
        const now = new Date().toISOString()
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: [],
                  updatedAt: now,
                }
              : conv
          ),
        }))
      },

      deleteConversation: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.filter((conv) => conv.id !== conversationId),
          currentConversationId:
            state.currentConversationId === conversationId
              ? null
              : state.currentConversationId,
        }))
      },

      setCurrentConversation: (conversationId) => {
        set({ currentConversationId: conversationId })
      },

      getCurrentConversation: () => {
        const state = get()
        if (!state.currentConversationId) return null
        return (
          state.conversations.find((conv) => conv.id === state.currentConversationId) || null
        )
      },
    }),
    {
      name: 'ai-diagram-chat',
      partialize: (state) => ({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
      }),
    }
  )
)

export default useChatStore
