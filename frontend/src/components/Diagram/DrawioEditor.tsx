import React, { useEffect, useRef, useState, useCallback } from 'react'
import { DrawioExportOptions } from '../../types/diagram'

interface DrawioEditorProps {
  value: string // Draw.io XML data
  onChange?: (xml: string) => void
  onError?: (error: Error) => void
  readonly?: boolean
  className?: string
}

interface DrawioMessage {
  event?: string
  action?: string
  xml?: string
  data?: string
  message?: string
  format?: string
  [key: string]: any // Allow additional properties
}

export interface DrawioEditorRef {
  exportDiagram: (options: DrawioExportOptions) => Promise<Blob>
  getCurrentXml: () => Promise<string>
}

export const DrawioEditor = React.forwardRef<DrawioEditorRef, DrawioEditorProps>(({
  value,
  onChange,
  onError,
  readonly = false,
  className = '',
}, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const valueRef = useRef(value)
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const DEBUG = false // Set to true to enable debug logging

  // Update ref to keep latest value
  useEffect(() => {
    valueRef.current = value
  }, [value])

  // Set a timeout to handle cases where init event doesn't arrive
  useEffect(() => {
    loadTimeoutRef.current = setTimeout(() => {
      if (!isLoaded) {
        console.warn('Draw.io init timeout - forcing load state')
        setIsLoaded(true)
      }
    }, 5000) // 5 second timeout (reduced since we now handle 'configure' event)

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
    }
  }, [isLoaded])

  // Draw.io embed URL with configuration
  const embedUrl = `https://embed.diagrams.net/?embed=1&ui=atlas&spin=1&modified=unsavedChanges&proto=json&configure=1${readonly ? '&chrome=0' : ''}`

  // Send message to iframe
  const postMessage = useCallback((message: DrawioMessage) => {
    if (DEBUG) console.log('Sending message to draw.io:', message)
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify(message), '*')
    } else {
      console.warn('Cannot send message - iframe not ready')
    }
  }, [])

  // Load diagram data into the editor
  const loadDiagram = useCallback(() => {
    if (!isLoaded) return

    try {
      if (DEBUG) console.log('Loading diagram with value:', value?.substring(0, 100))
      if (value && value.trim()) {
        // Load existing diagram
        postMessage({
          action: 'load',
          xml: value,
          autosave: 1,
        })
      } else {
        // Load blank diagram
        const emptyXml = getEmptyDiagram()
        if (DEBUG) console.log('Loading empty diagram')
        postMessage({
          action: 'load',
          xml: emptyXml,
          autosave: 1,
        })
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      console.error('Error loading diagram:', error)
      setError(error.message)
      onError?.(error)
    }
  }, [isLoaded, value, postMessage, onError])

  // Handle messages from draw.io
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Log all messages for debugging
      if (DEBUG) console.log('Received message from:', event.origin, event.data)

      // Only process messages from draw.io
      if (event.origin !== 'https://embed.diagrams.net') {
        return
      }

      try {
        const message = JSON.parse(event.data) as DrawioMessage
        if (DEBUG) console.log('Parsed draw.io message:', message)

        switch (message.event) {
          case 'init':
          case 'configure':
            // Draw.io has loaded and is ready (init for older versions, configure for newer)
            if (DEBUG) console.log('Draw.io initialized')
            setIsLoaded(true)
            break

          case 'load':
            // Diagram loaded successfully
            if (DEBUG) console.log('Diagram loaded')
            break

          case 'save':
            // User clicked save or autosave triggered
            if (message.xml && onChange) {
              onChange(message.xml)
            }
            break

          case 'autosave':
            // Autosave event
            if (message.xml && onChange) {
              onChange(message.xml)
            }
            break

          case 'export':
            // Export completed
            if (DEBUG) console.log('Export completed', message)
            break

          case 'exit':
            // User closed the editor
            if (DEBUG) console.log('Editor closed')
            break

          default:
            if (DEBUG) console.log('Unknown draw.io event:', message.event)
        }
      } catch (err) {
        console.error('Error parsing draw.io message:', err, event.data)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onChange, postMessage])

  // 当 draw.io 加载完成后，加载图表数据
  useEffect(() => {
    if (isLoaded) {
      loadDiagram()
    }
  }, [isLoaded, loadDiagram])

  // 导出方法（供父组件调用）
  const exportDiagram = useCallback(
    async (options: DrawioExportOptions): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Export timeout'))
        }, 30000)

        const handleExportMessage = (event: MessageEvent) => {
          if (event.origin !== 'https://embed.diagrams.net') return

          try {
            const message = JSON.parse(event.data) as DrawioMessage
            if (message.event === 'export') {
              clearTimeout(timeout)
              window.removeEventListener('message', handleExportMessage)

              if (message.data) {
                // Convert base64 to blob
                const byteCharacters = atob(message.data.split(',')[1])
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                  byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                const blob = new Blob([byteArray], {
                  type: options.format === 'svg' ? 'image/svg+xml' : 'image/png',
                })
                resolve(blob)
              } else {
                reject(new Error('No export data received'))
              }
            }
          } catch (err) {
            clearTimeout(timeout)
            window.removeEventListener('message', handleExportMessage)
            reject(err)
          }
        }

        window.addEventListener('message', handleExportMessage)

        // 发送导出请求
        postMessage({
          action: 'export',
          format: options.format === 'svg' ? 'xmlsvg' : 'png',
          xml: valueRef.current,
          scale: options.scale || 1,
          border: options.border || 0,
          bg: options.transparent ? 'none' : options.background || '#ffffff',
        })
      })
    },
    [postMessage]
  )

  // 获取当前 XML
  const getCurrentXml = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Get XML timeout'))
      }, 5000)

      const handleXmlMessage = (event: MessageEvent) => {
        if (event.origin !== 'https://embed.diagrams.net') return

        try {
          const message = JSON.parse(event.data) as DrawioMessage
          if (message.event === 'save') {
            clearTimeout(timeout)
            window.removeEventListener('message', handleXmlMessage)
            resolve(message.xml || '')
          }
        } catch (err) {
          clearTimeout(timeout)
          window.removeEventListener('message', handleXmlMessage)
          reject(err)
        }
      }

      window.addEventListener('message', handleXmlMessage)
      postMessage({ action: 'export', format: 'xml' })
    })
  }, [postMessage])

  // Expose methods to parent component via ref
  React.useImperativeHandle(
    ref,
    () => ({
      exportDiagram,
      getCurrentXml,
    }),
    [exportDiagram, getCurrentXml]
  )

  return (
    <div className={`relative w-full h-full ${className}`}>
      {error && (
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-red-50 border border-red-200 text-red-700">
          <p className="font-semibold">Error loading Draw.io editor:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-sm text-gray-600">Loading Draw.io editor...</p>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full border-0"
        allow="clipboard-read; clipboard-write"
        title="Draw.io Diagram Editor"
      />
    </div>
  )
})

DrawioEditor.displayName = 'DrawioEditor'

// 生成空白图表的 XML
function getEmptyDiagram(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="embed.diagrams.net" modified="${new Date().toISOString()}" agent="DrawioEditor" version="21.0.0" etag="" type="embed">
  <diagram name="Page-1" id="empty">
    <mxGraphModel dx="800" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`
}

export default DrawioEditor
