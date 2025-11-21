import { create } from 'zustand'
import type { AIProvider, DiagramType } from '@/types/diagram'

interface EditorStore {
  code: string
  selectedDiagramType: DiagramType
  selectedAIProvider: AIProvider
  isGenerating: boolean
  isDarkMode: boolean

  // Actions
  setCode: (code: string) => void
  setDiagramType: (type: DiagramType) => void
  setAIProvider: (provider: AIProvider) => void
  setGenerating: (generating: boolean) => void
  toggleDarkMode: () => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  code: '',
  selectedDiagramType: 'flowchart' as DiagramType,
  selectedAIProvider: 'claude' as AIProvider,
  isGenerating: false,
  isDarkMode: false,

  setCode: (code) => set({ code }),

  setDiagramType: (type) => set({ selectedDiagramType: type }),

  setAIProvider: (provider) => set({ selectedAIProvider: provider }),

  setGenerating: (generating) => set({ isGenerating: generating }),

  toggleDarkMode: () =>
    set((state) => {
      const newMode = !state.isDarkMode
      if (newMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return { isDarkMode: newMode }
    }),
}))