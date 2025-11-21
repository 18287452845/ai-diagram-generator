import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface APIKeys {
  anthropicKey: string
  openaiKey: string
  deepseekKey: string
}

export interface ConfigState {
  apiKeys: APIKeys
  useServerKeys: boolean
  setAPIKey: (provider: keyof APIKeys, key: string) => void
  setUseServerKeys: (use: boolean) => void
  clearAPIKeys: () => void
  getAPIKey: (provider: keyof APIKeys) => string
  hasAPIKey: (provider: keyof APIKeys) => boolean
}

const initialAPIKeys: APIKeys = {
  anthropicKey: '',
  openaiKey: '',
  deepseekKey: '',
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      apiKeys: initialAPIKeys,
      useServerKeys: true, // Default to using server-side keys

      setAPIKey: (provider, key) =>
        set((state) => ({
          apiKeys: {
            ...state.apiKeys,
            [provider]: key,
          },
        })),

      setUseServerKeys: (use) =>
        set({ useServerKeys: use }),

      clearAPIKeys: () =>
        set({ apiKeys: initialAPIKeys }),

      getAPIKey: (provider) => {
        const state = get()
        return state.useServerKeys ? '' : state.apiKeys[provider]
      },

      hasAPIKey: (provider) => {
        const state = get()
        if (state.useServerKeys) return true // Assume server has keys
        return state.apiKeys[provider].length > 0
      },
    }),
    {
      name: 'ai-diagram-config', // localStorage key
      // Only persist API keys if not using server keys
      partialize: (state) => ({
        apiKeys: state.useServerKeys ? initialAPIKeys : state.apiKeys,
        useServerKeys: state.useServerKeys,
      }),
    }
  )
)

export default useConfigStore
