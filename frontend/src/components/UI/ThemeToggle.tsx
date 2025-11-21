import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'

function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useThemeStore()

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title={isDarkMode ? '切换到亮色主题' : '切换到暗色主题'}
    >
      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}

export default ThemeToggle