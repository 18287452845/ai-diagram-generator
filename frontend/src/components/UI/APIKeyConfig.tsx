import { useState } from 'react'
import { Eye, EyeOff, Save, Trash2, Key, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useConfigStore } from '@/stores/configStore'

interface APIKeyInputProps {
  label: string
  provider: 'anthropicKey' | 'openaiKey' | 'deepseekKey'
  placeholder: string
  description: string
  value: string
  onChange: (value: string) => void
}

function APIKeyInput({
  label,
  provider,
  placeholder,
  description,
  value,
  onChange,
}: APIKeyInputProps) {
  const [showKey, setShowKey] = useState(false)

  return (
    <div className="space-y-2">
      <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
        <Key className="mr-2" size={16} />
        {label}
      </label>
      <div className="relative">
        <input
          type={showKey ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  )
}

export default function APIKeyConfig() {
  const {
    apiKeys,
    useServerKeys,
    setAPIKey,
    setUseServerKeys,
    clearAPIKeys,
    hasAPIKey,
  } = useConfigStore()

  const [localKeys, setLocalKeys] = useState(apiKeys)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setAPIKey('anthropicKey', localKeys.anthropicKey)
    setAPIKey('openaiKey', localKeys.openaiKey)
    setAPIKey('deepseekKey', localKeys.deepseekKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleClear = () => {
    setLocalKeys({
      anthropicKey: '',
      openaiKey: '',
      deepseekKey: '',
    })
    clearAPIKeys()
  }

  const handleModeChange = (useServer: boolean) => {
    setUseServerKeys(useServer)
    if (useServer) {
      handleClear()
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          API密钥配置
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          配置您的AI服务API密钥以使用图表生成功能
        </p>
      </div>

      {/* Mode Selection */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="text-blue-600 dark:text-blue-400 mr-3 mt-0.5" size={20} />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              密钥使用模式
            </h3>
            <div className="space-y-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={useServerKeys}
                  onChange={() => handleModeChange(true)}
                  className="mr-3"
                />
                <div>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    使用服务器端密钥
                  </span>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    推荐：密钥存储在服务器端，更加安全
                  </p>
                </div>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={!useServerKeys}
                  onChange={() => handleModeChange(false)}
                  className="mr-3"
                />
                <div>
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    使用客户端密钥
                  </span>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    在浏览器本地配置密钥，仅存储在您的设备上
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* API Keys Form */}
      {!useServerKeys && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
          <div className="space-y-6">
            <APIKeyInput
              label="Claude (Anthropic) API Key"
              provider="anthropicKey"
              placeholder="sk-ant-api03-..."
              description="从 https://console.anthropic.com 获取您的API密钥"
              value={localKeys.anthropicKey}
              onChange={(value) =>
                setLocalKeys({ ...localKeys, anthropicKey: value })
              }
            />

            <APIKeyInput
              label="OpenAI API Key"
              provider="openaiKey"
              placeholder="sk-proj-..."
              description="从 https://platform.openai.com/api-keys 获取您的API密钥"
              value={localKeys.openaiKey}
              onChange={(value) =>
                setLocalKeys({ ...localKeys, openaiKey: value })
              }
            />

            <APIKeyInput
              label="DeepSeek API Key"
              provider="deepseekKey"
              placeholder="sk-..."
              description="从 https://platform.deepseek.com 获取您的API密钥"
              value={localKeys.deepseekKey}
              onChange={(value) =>
                setLocalKeys({ ...localKeys, deepseekKey: value })
              }
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClear}
              className="flex items-center px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
            >
              <Trash2 className="mr-2" size={18} />
              清除所有密钥
            </button>
            <button
              onClick={handleSave}
              className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all transform hover:scale-105"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="mr-2" size={18} />
                  已保存
                </>
              ) : (
                <>
                  <Save className="mr-2" size={18} />
                  保存配置
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Security Notice */}
      {!useServerKeys && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                安全提示
              </h4>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-disc list-inside">
                <li>API密钥仅存储在您的浏览器本地存储中</li>
                <li>请勿在公共或共享设备上保存您的密钥</li>
                <li>建议定期更换API密钥以确保安全</li>
                <li>密钥会随请求一起发送到后端进行API调用</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Status Indicators */}
      {!useServerKeys && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            密钥状态
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Claude (Anthropic)</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  hasAPIKey('anthropicKey')
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {hasAPIKey('anthropicKey') ? '已配置' : '未配置'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">OpenAI</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  hasAPIKey('openaiKey')
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {hasAPIKey('openaiKey') ? '已配置' : '未配置'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">DeepSeek</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  hasAPIKey('deepseekKey')
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {hasAPIKey('deepseekKey') ? '已配置' : '未配置'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
