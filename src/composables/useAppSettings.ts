import { ref } from 'vue'
import type { SearchEngine } from './useSearch'

const db = ref<IDBDatabase | null>(null)

export function useAppSettings() {
  const currentEngine = ref<SearchEngine>('baidu')

  const initDB = (database: IDBDatabase) => {
    db.value = database
  }

  const loadSettings = async () => {
    if (!db.value) return

    const transaction = db.value.transaction('settings', 'readonly')
    const store = transaction.objectStore('settings')

    const engineRequest = store.get('searchEngine')
    engineRequest.onsuccess = () => {
      if (engineRequest.result) {
        currentEngine.value = engineRequest.result.value as SearchEngine
      }
    }
  }

  const saveSettings = (key: string, value: string) => {
    if (!db.value) return

    const transaction = db.value.transaction('settings', 'readwrite')
    const store = transaction.objectStore('settings')
    store.put({ key, value })
  }

  return {
    currentEngine,
    initDB,
    loadSettings,
    saveSettings,
  }
}
