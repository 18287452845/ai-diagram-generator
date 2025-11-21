import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface APIKeys {
  anthropicKey: string
  openaiKey: string
  deepseekKey: string
}

export interface APIBaseUrls {
  anthropicBaseUrl: string
  openaiBaseUrl: string
  deepseekBaseUrl: string
}

export interface ConfigState {
  apiKeys: APIKeys
  apiBaseUrls: APIBaseUrls
  useServerKeys: boolean
  setAPIKey: (provider: keyof APIKeys, key: string) => void
  setAPIBaseUrl: (provider: keyof APIBaseUrls, baseUrl: string) => void
  setUseServerKeys: (use: boolean) => void
  clearAPIKeys: () => void
  clearAPIBaseUrls: () => void
  getAPIKey: (provider: keyof APIKeys) => string
  getAPIBaseUrl: (provider: keyof APIBaseUrls) => string
  hasAPIKey: (provider: keyof APIKeys) => boolean
}

const initialAPIKeys: APIKeys = {
  anthropicKey: '',
  openaiKey: '',
  deepseekKey: '',
}

const initialAPIBaseUrls: APIBaseUrls = {
  anthropicBaseUrl: 'https://api.anthropic.com',
  openaiBaseUrl: 'https://api.openai.com',
  deepseekBaseUrl: 'https://api.deepseek.com',
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      apiKeys: initialAPIKeys,
      apiBaseUrls: initialAPIBaseUrls,
      useServerKeys: true, // Default to using server-side keys

      setAPIKey: (provider, key) =>
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [provider]: key,
          },
        })),

      setAPIBaseUrl: (provider, baseUrl) =>
        set((state) => ({
          apiBaseUrls: {
            ...state.apiBaseUrls,
            [provider]: baseUrl,
          },
        })),

      setUseServerKeys: (use) =>
        set({ useServerKeys: use }),

      clearAPIKeys: () =>
        set({ apiKeys: initialAPIKeys }),

      clearAPIBaseUrls: () =>
        set({ apiBaseUrls: initialAPIBaseUrls }),

      getAPIKey: (provider) => {
        const state = get()
        return state.useServerKeys ? '' : state.apiKeys[provider]
      },

      getAPIBaseUrl: (provider) => {
        const state = get()
        return state.useServerKeys ? '' : state.apiBaseUrls[provider]
      },

      hasAPIKey: (provider) => {
        const state = get()
        if (state.useServerKeys) return true // Assume server has keys
        return state.apiKeys[provider].length > 0
      },
    }),
    {
      name: 'ai-diagram-config', // localStorage key
      // Only persist API keys and base URLs if not using server keys
      partialize: (state) => ({
        apiKeys: state.useServerKeys ? initialAPIKeys : state.apiKeys,
        apiBaseUrls: state.useServerKeys ? initialAPIBaseUrls : state.apiBaseUrls,
        useServerKeys: state.useServerKeys,
      }),
    }
  )
)

export default useConfigStore
