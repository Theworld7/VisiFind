import { ref, computed, watch } from 'vue'

const backgroundUrl = ref('')
const backgroundInputMode = ref<'color' | 'upload' | 'url'>('color')
const backgroundBlur = ref(0)
const backgroundColor = ref('#1a1a2e')

const db = ref<IDBDatabase | null>(null)

export interface BackgroundSettings {
  backgroundUrl: string
  backgroundInputMode: string
  backgroundBlur: number
  backgroundColor: string
}

export function useBackground() {
  const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BookmarkDB', 2)

      request.onerror = () => reject(request.error)

      request.onsuccess = () => {
        db.value = request.result
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result
        if (!database.objectStoreNames.contains('bookmarks')) {
          database.createObjectStore('bookmarks', { keyPath: 'id', autoIncrement: true })
        }
        if (!database.objectStoreNames.contains('settings')) {
          database.createObjectStore('settings', { keyPath: 'key' })
        }
      }
    })
  }

  const loadSettings = async () => {
    if (!db.value) return

    const transaction = db.value.transaction('settings', 'readonly')
    const store = transaction.objectStore('settings')

    const bgRequest = store.get('backgroundSettings')
    bgRequest.onsuccess = () => {
      if (bgRequest.result) {
        const settings = bgRequest.result.value
        if (settings.backgroundUrl !== undefined) {
          backgroundUrl.value = settings.backgroundUrl
        }
        if (settings.backgroundInputMode !== undefined) {
          const mode = settings.backgroundInputMode as string
          backgroundInputMode.value =
            mode === 'color' || mode === 'upload' || mode === 'url'
              ? (mode as typeof backgroundInputMode.value)
              : 'color'
          if (backgroundInputMode.value === 'color') {
            backgroundColor.value = '#1a1a2e'
          }
        }
        if (settings.backgroundBlur !== undefined) {
          backgroundBlur.value = settings.backgroundBlur
        }
        if (settings.backgroundColor !== undefined) {
          backgroundColor.value = settings.backgroundColor
        }
      }
    }
  }

  const saveSettings = () => {
    if (!db.value) return

    const transaction = db.value.transaction('settings', 'readwrite')
    const store = transaction.objectStore('settings')
    store.put({
      key: 'backgroundSettings',
      value: {
        backgroundUrl: backgroundUrl.value,
        backgroundInputMode: backgroundInputMode.value,
        backgroundBlur: backgroundBlur.value,
        backgroundColor: backgroundColor.value,
      },
    })
  }

  const backgroundStyle = computed(() => {
    const style: Record<string, string> = {}
    if (backgroundInputMode.value === 'color') {
      style.backgroundColor = backgroundColor.value
      style.backgroundImage = 'none'
    } else if (backgroundUrl.value) {
      style.backgroundImage = `url(${backgroundUrl.value})`
    }
    style['--bg-blur'] = backgroundBlur.value ? `${backgroundBlur.value}px` : '0px'
    return style
  })

  const updateBackground = (settings: Partial<BackgroundSettings>) => {
    if (settings.backgroundUrl !== undefined) {
      backgroundUrl.value = settings.backgroundUrl
    }
    if (settings.backgroundInputMode !== undefined) {
      backgroundInputMode.value = settings.backgroundInputMode as typeof backgroundInputMode.value
    }
    if (settings.backgroundBlur !== undefined) {
      backgroundBlur.value = settings.backgroundBlur
    }
    if (settings.backgroundColor !== undefined) {
      backgroundColor.value = settings.backgroundColor
    }
    saveSettings()
  }

  return {
    db,
    backgroundUrl,
    backgroundInputMode,
    backgroundBlur,
    backgroundColor,
    backgroundStyle,
    initDB,
    loadSettings,
    saveSettings,
    updateBackground,
  }
}
