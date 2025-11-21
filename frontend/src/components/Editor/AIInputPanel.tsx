import { useState, useRef, useEffect } from 'react'
import { Sparkles, Loader2, Lightbulb, Zap } from 'lucide-react'
import { DiagramType, AIProvider } from '@/types/diagram'
import { aiService } from '@/services/aiService'

interface AIInputPanelProps {
  onGenerate: (code: string) => void
  onGeneratingChange: (generating: boolean) => void
}

const diagramTypes = [
  { value: DiagramType.FLOWCHART, label: '流程图', example: '用户登录流程，订单处理流程' },
  { value: DiagramType.ARCHITECTURE, label: '系统架构图', example: 'Web应用架构，微服务架构' },
  { value: DiagramType.SEQUENCE, label: '时序图', example: 'API调用时序，用户交互流程' },
  { value: DiagramType.CLASS, label: '类图', example: '面向对象设计，系统模块关系' },
  { value: DiagramType.ER, label: 'ER图', example: '数据库设计，实体关系模型' },
  { value: DiagramType.GANTT, label: '甘特图', example: '项目进度计划，任务时间表' },
  { value: DiagramType.SWIMLANE, label: '泳道图', example: '跨部门流程，职责划分' },
  { value: DiagramType.STATE, label: '状态图', example: '订单状态转换，工作流状态' },
]

const aiProviders = [
  { value: AIProvider.CLAUDE, label: 'Claude 3.5 Sonnet' },
  { value: AIProvider.OPENAI, label: 'GPT-4' },
  { value: AIProvider.DEEPSEEK, label: 'DeepSeek R1' },
]

function AIInputPanel({ onGenerate, onGeneratingChange }: AIInputPanelProps) {
  const [description, setDescription] = useState('')
  const [diagramType, setDiagramType] = useState<DiagramType>(DiagramType.FLOWCHART)
  const [aiProvider, setAIProvider] = useState<AIProvider>(AIProvider.CLAUDE)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generationProgress, setGenerationProgress] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const progressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-focus on description textarea when component mounts
  useEffect(() => {
    textareaRef.current?.focus()

    return () => {
      if (progressTimeoutRef.current) {
        clearTimeout(progressTimeoutRef.current)
      }
    }
  }, [])

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('请输入图表描述')
      return
    }

    setIsGenerating(true)
    onGeneratingChange(true)
    setError(null)
    setGenerationProgress('AI正在分析您的需求...')

    try {
      progressTimeoutRef.current = setTimeout(() => {
        setGenerationProgress('正在生成图表代码...')
      }, 2000)

      const response = await aiService.generateDiagram({
        description,
        diagramType,
        aiProvider,
      })
      
      setGenerationProgress('生成完成！')
      onGenerate(response.code)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试')
    } finally {
      if (progressTimeoutRef.current) {
        clearTimeout(progressTimeoutRef.current)
      }
      setIsGenerating(false)
      onGeneratingChange(false)
      setGenerationProgress('')
    }
  }

  // Quick examples for better UX
  const examples: Record<DiagramType, string> = {
    [DiagramType.FLOWCHART]: '电商用户下单流程：浏览商品 → 加入购物车 → 结算 → 支付 → 订单确认',
    [DiagramType.ARCHITECTURE]: 'Web应用架构：前端React + 后端FastAPI + 数据库PostgreSQL + 缓存Redis',
    [DiagramType.SEQUENCE]: '用户登录时序图：用户输入 → 前端验证 → API请求 → 数据库查询 → 返回Token',
    [DiagramType.ER]: '博客系统：用户表(user_id, name) 一对多 文章表(post_id, user_id, title)',
    [DiagramType.GANTT]: '项目开发计划：需求分析2周 → 设计1周 → 开发4周 → 测试2周 → 部署1周',
    [DiagramType.SWIMLANE]: '订单处理流程：客户下单(客户泳道) → 系统处理(系统泳道) → 物流配送(物流泳道)',
    [DiagramType.CLASS]: '用户管理系统：User类(id, name, email) 继承 Person类，关联 Order类',
    [DiagramType.STATE]: '订单状态流转：待支付 → 已支付 → 配送中 → 已完成 → 已取消',
    [DiagramType.MINDMAP]: 'AI技术栈：机器学习 → 监督学习/无监督学习 → 算法/框架/工具',
    [DiagramType.ROADMAP]: '产品发展路线：Q1需求调研 → Q2原型设计 → Q3开发测试 → Q4正式发布',
  }

  const fillExample = () => {
    const example = examples[diagramType] || examples[DiagramType.FLOWCHART]
    setDescription(example)
    setError(null)
  }

  const selectedType = diagramTypes.find(t => t.value === diagramType)

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <Sparkles size={20} className="text-blue-500" />
          AI 生成图表
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          用自然语言描述您的需求，AI 会自动生成专业的可视化图表
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          图表类型
        </label>
        <select
          value={diagramType}
          onChange={(e) => setDiagramType(e.target.value as DiagramType)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {diagramTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {selectedType && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            示例：{selectedType.example}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          AI 引擎
        </label>
        <select
          value={aiProvider}
          onChange={(e) => setAIProvider(e.target.value as AIProvider)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {aiProviders.map((provider) => (
            <option key={provider.value} value={provider.value}>
              {provider.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            图表描述
            <span className="text-red-500 ml-1">*</span>
          </label>
          <button
            type="button"
            onClick={fillExample}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <Lightbulb size={12} />
            填充示例
          </button>
        </div>
        <textarea
          ref={textareaRef}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="请详细描述您想要生成的图表...\n\n例如：\n• 一个电商网站的用户下单流程\n• 包含浏览商品、加入购物车、填写收货信息、选择支付方式、支付成功等步骤\n• 如果支付失败则返回重新支付"
          rows={10}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            描述越详细，生成的图表质量越高
          </p>
          <span className="text-xs text-gray-400">
            {description.length} / 2000
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {generationProgress && isGenerating && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md text-blue-700 dark:text-blue-400 text-sm flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" />
          <span>{generationProgress}</span>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !description.trim()}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            AI 正在生成图表...
          </>
        ) : (
          <>
            <Zap size={20} />
            生成图表
          </>
        )}
      </button>

      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          💡 提示：生成后的图表可以直接在右侧编辑器中进行可视化编辑，包括拖拽、调整样式、添加元素等操作。
        </p>
      </div>
    </div>
  )
}

export default AIInputPanel