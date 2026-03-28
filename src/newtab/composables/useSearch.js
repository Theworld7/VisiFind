import { ref } from 'vue'
import { getSetting, setSetting } from '../lib/db'

/**
 * 默认搜索引擎配置
 */
const defaultSearchEngines = [
  { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=' },
  { id: 'baidu', name: '百度', url: 'https://www.baidu.com/s?wd=' },
  { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' }
]

/**
 * 搜索功能组合式函数
 * @returns {Object} 搜索相关状态和方法
 */
export function useSearch() {
  const searchQuery = ref('')
  const searchEngine = ref('')
  const searchEngines = ref([])
  const isLoaded = ref(false)

  // 加载保存的搜索引擎配置
  const loadSearchEngines = async () => {
    const saved = await getSetting('searchEngines')
    if (saved && Array.isArray(saved) && saved.length > 0) {
      searchEngines.value = saved
    } else {
      // 如果没有保存的配置，使用默认引擎列表
      searchEngines.value = [...defaultSearchEngines]
      await saveSearchEngines()
    }
    const savedEngine = await getSetting('searchEngine')
    if (savedEngine && searchEngines.value.some(e => e.id === savedEngine)) {
      searchEngine.value = savedEngine
    } else if (searchEngines.value.length > 0) {
      searchEngine.value = searchEngines.value[0].id
    }
    isLoaded.value = true
  }

  // 保存搜索引擎配置
  const saveSearchEngines = async () => {
    await setSetting('searchEngines', searchEngines.value)
  }

  const handleSearch = (e) => {
    if (e) {
      e.preventDefault()
    }

    if (!searchQuery.value.trim()) return

    const engine = searchEngines.value.find(item => item.id === searchEngine.value)
    if (engine) {
      window.open(engine.url + encodeURIComponent(searchQuery.value), '_blank')
    }
  }

  const switchEngine = async (engineId) => {
    searchEngine.value = engineId
    await setSetting('searchEngine', engineId)
  }

  const addEngine = async (engine) => {
    searchEngines.value.push({
      ...engine,
      id: engine.id || 'engine_' + Date.now()
    })
    await saveSearchEngines()
  }

  const updateEngine = async (id, updates) => {
    const index = searchEngines.value.findIndex(e => e.id === id)
    if (index !== -1) {
      searchEngines.value[index] = { ...searchEngines.value[index], ...updates }
      await saveSearchEngines()
    }
  }

  const deleteEngine = async (id) => {
    if (searchEngines.value.length <= 1) {
      alert('至少保留一个搜索引擎')
      return false
    }
    if (searchEngine.value === id) {
      searchEngine.value = searchEngines.value[0].id
      await setSetting('searchEngine', searchEngine.value)
    }
    searchEngines.value = searchEngines.value.filter(e => e.id !== id)
    await saveSearchEngines()
    return true
  }

  return {
    searchQuery,
    searchEngine,
    searchEngines,
    isLoaded,
    handleSearch,
    switchEngine,
    loadSearchEngines,
    saveSearchEngines,
    addEngine,
    updateEngine,
    deleteEngine
  }
}
