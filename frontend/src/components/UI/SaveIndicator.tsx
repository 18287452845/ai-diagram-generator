import { Check, Clock, AlertCircle } from 'lucide-react'

interface SaveIndicatorProps {
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  isSaving: boolean
  autoSaveEnabled: boolean
}

function SaveIndicator({ lastSaved, hasUnsavedChanges, isSaving, autoSaveEnabled }: SaveIndicatorProps) {
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return '刚刚'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟前`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时前`
    return date.toLocaleDateString('zh-CN')
  }

  if (isSaving) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
        <Clock size={14} className="animate-spin" />
        <span>保存中...</span>
      </div>
    )
  }

  if (hasUnsavedChanges) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400">
        <AlertCircle size={14} />
        <span>未保存{autoSaveEnabled ? ' (即将自动保存)' : ''}</span>
      </div>
    )
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
        <Check size={14} />
        <span>已保存 · {getTimeAgo(lastSaved)}</span>
      </div>
    )
  }

  return null
}

export default SaveIndicator
