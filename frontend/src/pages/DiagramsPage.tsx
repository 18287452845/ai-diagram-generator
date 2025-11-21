import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Trash2, Edit, Clock, FileCode } from 'lucide-react'
import { diagramService } from '@/services/diagramService'
import type { Diagram } from '@/types/diagram'

function DiagramsPage() {
  const navigate = useNavigate()
  const [diagrams, setDiagrams] = useState<Diagram[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDiagrams()
  }, [])

  const loadDiagrams = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await diagramService.getAll()
      setDiagrams(data)
    } catch (err) {
      setError('加载图表列表失败')
      console.error('Failed to load diagrams:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`确定要删除图表 "${title}" 吗？`)) return

    try {
      await diagramService.delete(id)
      setDiagrams(diagrams.filter((d) => d.id !== id))
    } catch (err) {
      alert('删除失败，请重试')
      console.error('Failed to delete:', err)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDiagramTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      flowchart: '流程图',
      architecture: '架构图',
      sequence: '时序图',
      gantt: '甘特图',
      swimlane: '泳道图',
      er: 'ER图',
      class: '类图',
      state: '状态图',
      mindmap: '思维导图',
      roadmap: '路线图',
    }
    return labels[type] || type
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Diagram Generator
            </Link>
            <Link
              to="/editor"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
            >
              <Plus size={20} />
              新建图表
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          我的图表
        </h1>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">加载中...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-400">
            {error}
            <button
              onClick={loadDiagrams}
              className="ml-4 text-sm underline hover:no-underline"
            >
              重试
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && diagrams.length === 0 && (
          <div className="text-center py-16">
            <FileCode size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              还没有图表
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              创建您的第一个AI生成的图表
            </p>
            <Link
              to="/editor"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
            >
              <Plus size={20} />
              新建图表
            </Link>
          </div>
        )}

        {/* Diagrams Grid */}
        {!isLoading && !error && diagrams.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diagrams.map((diagram) => (
              <div
                key={diagram.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Card Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {diagram.title}
                      </h3>
                      <span className="inline-block mt-1 px-2 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {getDiagramTypeLabel(diagram.type)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Body - Preview */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 h-48 flex items-center justify-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-mono max-h-full overflow-hidden">
                    {diagram.code.slice(0, 200)}...
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{formatDate(diagram.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/editor/${diagram.id}`)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md"
                    >
                      <Edit size={14} />
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(diagram.id, diagram.title)}
                      className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default DiagramsPage