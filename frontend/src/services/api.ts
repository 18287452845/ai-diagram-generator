import axios from 'axios'
import { useConfigStore } from '@/stores/configStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // AI generation can take time
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add client-side API keys if configured
    const configState = useConfigStore.getState()
    if (!configState.useServerKeys) {
      const { apiKeys } = configState
      if (apiKeys.anthropicKey) {
        config.headers['X-Anthropic-Key'] = apiKeys.anthropicKey
      }
      if (apiKeys.openaiKey) {
        config.headers['X-OpenAI-Key'] = apiKeys.openaiKey
      }
      if (apiKeys.deepseekKey) {
        config.headers['X-DeepSeek-Key'] = apiKeys.deepseekKey
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default apiClient
