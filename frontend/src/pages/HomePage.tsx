import { Link } from 'react-router-dom'
import { FileCode, Sparkles, FolderOpen, Settings } from 'lucide-react'

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Settings Button - Top Right */}
      <div className="absolute top-4 right-4">
        <Link
          to="/settings"
          className="inline-flex items-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium px-4 py-2 rounded-lg shadow transition-all border border-gray-200 dark:border-gray-700"
        >
          <Settings className="mr-2" size={18} />
          设置
        </Link>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            <Sparkles className="inline-block mr-2 mb-2" size={48} />
            AI Diagram Generator
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            使用AI智能生成专业的技术图表，支持流程图、架构图、时序图等多种类型
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/editor"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg shadow-lg transition-all transform hover:scale-105"
            >
              <FileCode className="mr-2" size={24} />
              开始创建
            </Link>
            <Link
              to="/diagrams"
              className="inline-flex items-center bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold px-8 py-4 rounded-lg shadow-lg transition-all transform hover:scale-105 border border-gray-200 dark:border-gray-700"
            >
              <FolderOpen className="mr-2" size={24} />
              我的图表
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              🤖 AI 驱动
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              使用 Claude、GPT-4 和 DeepSeek R1 三引擎，智能理解您的描述并生成专业图表
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              ✏️ 可视化编辑
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              支持代码和可视化双模式编辑，拖拽即可调整布局和样式
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
              📊 多种图表
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              流程图、架构图、时序图、ER图、甘特图、泳道图等应有尽有
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage