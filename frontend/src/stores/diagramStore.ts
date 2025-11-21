import { create } from 'zustand'
import type { Diagram, DiagramType, AIProvider } from '@/types/diagram'

interface DiagramStore {
  currentDiagram: Diagram | null
  diagrams: Diagram[]
  isLoading: boolean
  error: string | null

  // Actions
  setCurrentDiagram: (diagram: Diagram | null) => void
  setDiagrams: (diagrams: Diagram[]) => void
  addDiagram: (diagram: Diagram) => void
  updateDiagram: (id: string, updates: Partial<Diagram>) => void
  removeDiagram: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useDiagramStore = create<DiagramStore>((set) => ({
  currentDiagram: null,
  diagrams: [],
  isLoading: false,
  error: null,

  setCurrentDiagram: (diagram) => set({ currentDiagram: diagram }),

  setDiagrams: (diagrams) => set({ diagrams }),

  addDiagram: (diagram) =>
    set((state) => ({ diagrams: [diagram, ...state.diagrams] })),

  updateDiagram: (id, updates) =>
    set((state) => ({
      diagrams: state.diagrams.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
      currentDiagram:
        state.currentDiagram?.id === id
          ? { ...state.currentDiagram, ...updates }
          : state.currentDiagram,
    })),

  removeDiagram: (id) =>
    set((state) => ({
      diagrams: state.diagrams.filter((d) => d.id !== id),
      currentDiagram:
        state.currentDiagram?.id === id ? null : state.currentDiagram,
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}))