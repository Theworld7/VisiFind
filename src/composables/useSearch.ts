import { ref, computed } from 'vue'

export type SearchEngine = 'baidu' | 'bing' | 'google' | 'sogou'

export function useSearch() {
  const searchQuery = ref('')
  const currentEngine = ref<SearchEngine>('baidu')

  const engineUrls: Record<SearchEngine, string> = {
    baidu: 'https://www.baidu.com/s?wd=',
    bing: 'https://www.bing.com/search?q=',
    google: 'https://www.google.com/search?q=',
    sogou: 'https://www.sogou.com/web?query=',
  }

  const search = () => {
    if (!searchQuery.value.trim()) return
    const query = encodeURIComponent(searchQuery.value)
    const url = `${engineUrls[currentEngine.value]}${query}`
    window.open(url, '_blank')
  }

  const openBookmark = (url: string) => {
    window.open(url, '_blank')
  }

  return {
    searchQuery,
    currentEngine,
    search,
    openBookmark,
  }
}
