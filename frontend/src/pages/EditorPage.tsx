import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Save, Undo, Redo, Home, Code2, Eye } from 'lucide-react'
import AIInputPanel from '@/components/Editor/AIInputPanel'
import CodeEditor from '@/components/Editor/CodeEditor'
import DrawioEditor, { DrawioEditorRef } from '@/components/Diagram/DrawioEditor'
import ExportButton from '@/components/UI/ExportButton'
import ThemeToggle from '@/components/UI/ThemeToggle'
import { diagramService } from '@/services/diagramService'
import { DiagramType } from '@/types/diagram'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

type ViewMode = 'visual' | 'code'

function EditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [code, setCode] = useState(getDefaultDrawioXml())
  const [title, setTitle] = useState('未命名图表')
  const [viewMode, setViewMode] = useState<ViewMode>('visual')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [history, setHistory] = useState<string[]>([getDefaultDrawioXml()])
  const [historyIndex, setHistoryIndex] = useState(0)
  const drawioEditorRef = useRef<DrawioEditorRef>(null)

  // Load diagram if ID is provided
  useEffect(() => {
    if (id) {
      loadDiagram(id)
    }
  }, [id])

  const loadDiagram = async (diagramId: string) => {
    try {
      const diagram = await diagramService.getById(diagramId)
      setCode(diagram.code)
      setTitle(diagram.title)
      setHistory([diagram.code])
      setHistoryIndex(0)
    } catch (error) {
      console.error('Failed to load diagram:', error)
      alert('加载图表失败')
    }
  }

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newCode)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setCode(history[historyIndex - 1])
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setCode(history[historyIndex + 1])
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (id) {
        // Update existing
        await diagramService.update(id, { code, title })
        alert('保存成功！')
      } else {
        // Create new
        const diagram = await diagramService.create({
          title,
          type: DiagramType.FLOWCHART,
          code,
        })
        alert('保存成功！')
        navigate(`/editor/${diagram.id}`)
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAIGenerate = (generatedCode: string) => {
    handleCodeChange(generatedCode)
    setIsGenerating(false)
  }

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 's',
      ctrl: true,
      action: handleSave,
      description: 'Save diagram',
    },
    {
      key: 'z',
      ctrl: true,
      action: handleUndo,
      description: 'Undo',
    },
    {
      key: 'y',
      ctrl: true,
      action: handleRedo,
      description: 'Redo',
    },
  ])

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <Home size={20} />
            </Link>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-semibold text-gray-900 dark:text-white bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
            />

            {/* Badge */}
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              Draw.io 可视化
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-md p-1">
              <button
                onClick={() => setViewMode('visual')}
                className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${
                  viewMode === 'visual'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Eye size={14} />
                可视化
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${
                  viewMode === 'code'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Code2 size={14} />
                代码
              </button>
            </div>

            <ThemeToggle />
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              title="撤销 (Ctrl+Z)"
            >
              <Undo size={16} />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
              className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              title="重做 (Ctrl+Y)"
            >
              <Redo size={16} />
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !code.trim()}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {isSaving ? '保存中...' : '保存'}
            </button>
            <ExportButton code={code} title={title} editorRef={drawioEditorRef.current} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - AI Input */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <AIInputPanel
            onGenerate={handleAIGenerate}
            onGeneratingChange={setIsGenerating}
          />
        </div>

        {/* Right Panel - Editor */}
        <div className="flex-1 flex flex-col">
          {viewMode === 'visual' ? (
            // Draw.io Visual Editor
            <DrawioEditor
              ref={drawioEditorRef}
              value={code}
              onChange={handleCodeChange}
              className="h-full"
            />
          ) : (
            // XML Code Editor
            <CodeEditor code={code} onChange={handleCodeChange} />
          )}
        </div>
      </div>
    </div>
  )
}

// Default empty Draw.io XML
function getDefaultDrawioXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="embed.diagrams.net" modified="${new Date().toISOString()}" agent="AIDrawEditor" version="21.0.0" etag="" type="embed">
  <diagram name="Diagram" id="diagram-1">
    <mxGraphModel dx="800" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`
}

export default EditorPage