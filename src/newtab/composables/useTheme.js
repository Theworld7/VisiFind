import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getSetting, setSetting } from '../lib/db'

const THEME_KEY = 'theme'

// 模块级别状态，所有 useTheme() 调用共享同一个 ref
const theme = ref('light') // 'light' | 'dark'
let mediaQuery = null
let initialized = false

// 计算属性：是否暗色模式
const isDark = computed(() => theme.value === 'dark')

// 更新 document.documentElement 的 class
const updateRootClass = () => {
  if (theme.value === 'dark') {
    document.documentElement.classList.add('is-dark')
  } else {
    document.documentElement.classList.remove('is-dark')
  }
}

// 初始化主题（仅执行一次）
const initTheme = async () => {
  if (initialized) return
  initialized = true

  // 1. 检查用户是否有手动设置
  const savedTheme = await getSetting(THEME_KEY)

  if (savedTheme) {
    theme.value = savedTheme
  } else {
    // 2. 没有用户偏好，跟随系统
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    theme.value = prefersDark ? 'dark' : 'light'
  }

  // 3. 应用 class 到 :root
  updateRootClass()

  // 4. 监听系统主题变化
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', handleSystemThemeChange)
}

// 处理系统主题变化
const handleSystemThemeChange = (e) => {
  // 只有在用户没有手动设置时才跟随系统
  getSetting(THEME_KEY).then(saved => {
    if (!saved) {
      theme.value = e.matches ? 'dark' : 'light'
      updateRootClass()
    }
  })
}

// 切换主题
export const toggleTheme = async () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  updateRootClass()
  await setSetting(THEME_KEY, theme.value)
}

// 清理
const cleanup = () => {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }
}

export function useTheme() {
  // 初始化（多次调用只执行一次）
  initTheme()

  return {
    theme,
    isDark,
    toggleTheme,
  }
}
