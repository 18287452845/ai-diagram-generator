import React, { useEffect, useRef, useState } from 'react'

interface DrawioPreviewProps {
  xml: string // Draw.io XML data
  className?: string
  onError?: (error: Error) => void
}

export const DrawioPreview: React.FC<DrawioPreviewProps> = ({ xml, className = '', onError }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!xml || !containerRef.current) return

    const renderDiagram = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 使用 draw.io 的查看器 API
        const viewerUrl = `https://viewer.diagrams.net/?embed=1&chrome=0&nav=0&highlight=0000ff&edit=_blank&layers=1&nav=1&title=Diagram`

        // 创建 iframe 来显示图表
        const iframe = document.createElement('iframe')
        iframe.style.width = '100%'
        iframe.style.height = '100%'
        iframe.style.border = 'none'
        iframe.src = viewerUrl

        // 等待 iframe 加载
        iframe.onload = () => {
          // 发送 XML 数据到 viewer
          iframe.contentWindow?.postMessage(
            JSON.stringify({
              action: 'load',
              xml: xml,
            }),
            '*'
          )
          setIsLoading(false)
        }

        iframe.onerror = () => {
          const err = new Error('Failed to load Draw.io viewer')
          setError(err.message)
          onError?.(err)
          setIsLoading(false)
        }

        // 清空容器并添加 iframe
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
          containerRef.current.appendChild(iframe)
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error.message)
        onError?.(error)
        setIsLoading(false)
      }
    }

    renderDiagram()
  }, [xml, onError])

  return (
    <div className={`relative w-full h-full ${className}`}>
      {error && (
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-red-50 border border-red-200 text-red-700">
          <p className="font-semibold">Error rendering diagram:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-sm text-gray-600">Loading diagram...</p>
          </div>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}

export default DrawioPreview
