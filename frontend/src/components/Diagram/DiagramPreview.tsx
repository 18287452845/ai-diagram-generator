import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { AlertCircle } from 'lucide-react'

interface DiagramPreviewProps {
  code: string
}

function DiagramPreview({ code }: DiagramPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const isInitialized = useRef(false)
  const renderTimerRef = useRef<number | null>(null)
  const isMountedRef = useRef(true)

  // Initialize mermaid once
  useEffect(() => {
    if (!isInitialized.current) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'monospace',
      })
      isInitialized.current = true
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      // Clear any pending timers
      if (renderTimerRef.current) {
        clearTimeout(renderTimerRef.current)
      }
      // Safely clear container using textContent (safer than innerHTML)
      if (containerRef.current) {
        try {
          // Use textContent to clear, which is safer
          containerRef.current.textContent = ''
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    }
  }, [])

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !code.trim() || !isInitialized.current || !isMountedRef.current) {
        setIsRendering(false)
        return
      }

      setIsRendering(true)
      setError(null)

      try {
        const container = containerRef.current
        
        // Check if still mounted
        if (!isMountedRef.current || !container) return

        // Clear previous content using textContent (safer)
        container.textContent = ''

        // Check again after clearing
        if (!isMountedRef.current || !containerRef.current) return

        // Generate unique ID
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Render diagram
        const { svg } = await mermaid.render(id, code)
        
        // Check if still mounted
        if (!isMountedRef.current || !containerRef.current) return

        // Use insertAdjacentHTML which is safer for React
        container.insertAdjacentHTML('beforeend', svg)
      } catch (err) {
        if (!isMountedRef.current) return
        setError(err instanceof Error ? err.message : '渲染失败')
        console.error('Mermaid render error:', err)
      } finally {
        if (isMountedRef.current) {
          setIsRendering(false)
        }
      }
    }

    // Clear previous timer
    if (renderTimerRef.current) {
      clearTimeout(renderTimerRef.current)
    }

    // Debounce rendering
    renderTimerRef.current = window.setTimeout(() => {
      renderDiagram()
    }, 500)

    return () => {
      if (renderTimerRef.current) {
        clearTimeout(renderTimerRef.current)
        renderTimerRef.current = null
      }
    }
  }, [code])

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          预览
        </h3>
      </div>
      <div className="flex-1 overflow-auto p-4 bg-white dark:bg-gray-900">
        {error ? (
          <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-medium text-red-800 dark:text-red-300">渲染错误</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="flex items-center justify-center min-h-full"
          >
            {isRendering && (
              <div className="text-gray-500 dark:text-gray-400">渲染中...</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DiagramPreview
