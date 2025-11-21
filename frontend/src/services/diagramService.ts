import apiClient from './api'
import type { Diagram } from '@/types/diagram'

export const diagramService = {
  /**
   * Get all diagrams
   */
  async getAll(): Promise<Diagram[]> {
    const response = await apiClient.get('/diagrams')
    return response.data
  },

  /**
   * Get diagram by ID
   */
  async getById(id: string): Promise<Diagram> {
    const response = await apiClient.get(`/diagrams/${id}`)
    return response.data
  },

  /**
   * Create new diagram
   */
  async create(diagram: Partial<Diagram>): Promise<Diagram> {
    const response = await apiClient.post('/diagrams', diagram)
    return response.data
  },

  /**
   * Update diagram
   */
  async update(id: string, diagram: Partial<Diagram>): Promise<Diagram> {
    const response = await apiClient.put(`/diagrams/${id}`, diagram)
    return response.data
  },

  /**
   * Delete diagram
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/diagrams/${id}`)
  },

  /**
   * Export diagram
   */
  async export(
    id: string,
    format: 'svg' | 'png' | 'pdf'
  ): Promise<Blob> {
    const response = await apiClient.get(`/diagrams/${id}/export`, {
      params: { format },
      responseType: 'blob',
    })
    return response.data
  },
}

export default diagramService