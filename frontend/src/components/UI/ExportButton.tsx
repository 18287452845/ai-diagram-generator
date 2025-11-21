import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { exportService } from '@/services/exportService'

interface ExportButtonProps {
  code: string
  title?: string
  editorRef?: any // Reference to DrawioEditor for draw.io exports
}

function ExportButton({ code, title = 'diagram', editorRef }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleExport = async (exportFormat: 'svg' | 'png' | 'xml') => {
    setIsExporting(true)
    setShowMenu(false)

    try {
      await exportService.export(code, exportFormat, title, editorRef)
    } catch (error) {
      console.error('Export failed:', error)
      alert('导出失败，请重试')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting || !code.trim()}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md flex items-center gap-2"
      >
        {isExporting ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            导出中...
          </>
        ) : (
          <>
            <Download size={16} />
            导出
          </>
        )}
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-20">
            <button
              onClick={() => handleExport('svg')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-md"
            >
              导出为 SVG
            </button>
            <button
              onClick={() => handleExport('png')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              导出为 PNG
            </button>
            <button
              onClick={() => handleExport('xml')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-md"
            >
              导出 XML 代码
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default ExportButton