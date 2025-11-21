import { useState } from 'react'
import { X, Search, FileCode } from 'lucide-react'
import { DiagramType } from '@/types/diagram'
import { TEMPLATES, getTemplatesByType, searchTemplates, DiagramTemplate } from '@/utils/templates'

interface TemplatePickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (template: DiagramTemplate) => void
  filterType?: DiagramType
}

function TemplatePicker({ isOpen, onClose, onSelect, filterType }: TemplatePickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<DiagramType | 'all'>(
    filterType || 'all'
  )

  if (!isOpen) return null

  const filteredTemplates = searchQuery
    ? searchTemplates(searchQuery)
    : selectedType === 'all'
    ? TEMPLATES
    : getTemplatesByType(selectedType)

  const types = [
    { value: 'all', label: '全部' },
    { value: DiagramType.FLOWCHART, label: '流程图' },
    { value: DiagramType.ARCHITECTURE, label: '架构图' },
    { value: DiagramType.SEQUENCE, label: '时序图' },
    { value: DiagramType.ER, label: 'ER图' },
    { value: DiagramType.GANTT, label: '甘特图' },
    { value: DiagramType.CLASS, label: '类图' },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                选择模板
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                从预设模板快速开始
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search and Filter */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索模板..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type Filter */}
            <div className="flex flex-wrap gap-2">
              {types.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedType === type.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <FileCode size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  没有找到匹配的模板
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      onSelect(template)
                      onClose()
                    }}
                    className="text-left p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all bg-white dark:bg-gray-800"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {template.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                      {template.code.split('\n').length} 行代码
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default TemplatePicker