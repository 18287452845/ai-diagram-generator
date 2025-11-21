import { Link } from 'react-router-dom'
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react'
import APIKeyConfig from '@/components/UI/APIKeyConfig'
import ThemeToggle from '@/components/UI/ThemeToggle'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="mr-2" size={20} />
                返回首页
              </Link>
              <div className="flex items-center">
                <SettingsIcon className="mr-2 text-blue-600 dark:text-blue-400" size={24} />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  设置
                </h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* API Key Configuration Section */}
          <section>
            <APIKeyConfig />
          </section>

          {/* Additional Settings Sections can be added here */}
          <section className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                关于
              </h3>
              <div className="space-y-2 text-gray-600 dark:text-gray-400">
                <p>
                  <strong>AI Diagram Generator</strong>
                </p>
                <p>版本: 0.1.0</p>
                <p className="pt-2 text-sm">
                  支持的AI提供商：
                  <br />
                  • Claude 3.5 (Anthropic)
                  <br />
                  • GPT-4 (OpenAI)
                  <br />
                  • DeepSeek R1
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
