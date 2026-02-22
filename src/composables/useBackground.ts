import { ref, computed, watch } from 'vue'

const backgroundUrl = ref('')
const backgroundInputMode = ref<'color' | 'upload' | 'url' | 'bing'>('color')
const backgroundBlur = ref(0)
const backgroundColor = ref('#1a1a2e')
const bingWallpaperUrl = ref('')

const db = ref<IDBDatabase | null>(null)

export interface BackgroundSettings {
  backgroundUrl: string
  backgroundInputMode: string
  backgroundBlur: number
  backgroundColor: string
  bingWallpaperUrl: string
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
        if (settings.backgroundInputMode !== undefined) {
          const mode = settings.backgroundInputMode as string
          backgroundInputMode.value =
            mode === 'color' || mode === 'upload' || mode === 'url' || mode === 'bing'
              ? (mode as typeof backgroundInputMode.value)
              : 'color'
          if (backgroundInputMode.value === 'color') {
            backgroundColor.value = '#1a1a2e'
          }
        }
        if (settings.bingWallpaperUrl !== undefined) {
          bingWallpaperUrl.value = settings.bingWallpaperUrl
          if (backgroundInputMode.value === 'bing') {
            backgroundUrl.value = settings.bingWallpaperUrl
          }
        }
        if (settings.backgroundUrl !== undefined && backgroundInputMode.value !== 'bing') {
          backgroundUrl.value = settings.backgroundUrl
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
        bingWallpaperUrl: bingWallpaperUrl.value,
      },
    })
  }

  const backgroundStyle = computed(() => {
    const style: Record<string, string> = {}
    if (backgroundInputMode.value === 'color') {
      style.backgroundColor = backgroundColor.value
      style.backgroundImage = 'none'
    } else if (
      (backgroundInputMode.value === 'url' || backgroundInputMode.value === 'bing') &&
      backgroundUrl.value
    ) {
      style.backgroundImage = `url(${backgroundUrl.value})`
    } else if (backgroundInputMode.value === 'upload' && backgroundUrl.value) {
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
    if (settings.bingWallpaperUrl !== undefined) {
      bingWallpaperUrl.value = settings.bingWallpaperUrl
    }
    saveSettings()
  }

  const fetchBingWallpaper = async (): Promise<string> => {
    const isProduction = import.meta.env.PROD

    try {
      let bingUrl: string

      if (isProduction) {
        const response = await fetch(
          'https://bing.biturl.top/?resolution=1920&format=image&index=0&mkt=zh-CN',
        )
        const data = await response.json()
        bingUrl = data.url
      } else {
        const response = await fetch('/bing-api/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN')
        const data = await response.json()
        if (data.images && data.images.length > 0) {
          bingUrl = 'https://www.bing.com' + data.images[0].urlbase + '_1920x1080.jpg'
        } else {
          throw new Error('No Bing wallpaper found')
        }
      }

      return bingUrl
    } catch (error) {
      console.error('Failed to fetch Bing wallpaper:', error)
      throw error
    }
  }

  return {
    db,
    backgroundUrl,
    backgroundInputMode,
    backgroundBlur,
    backgroundColor,
    bingWallpaperUrl,
    backgroundStyle,
    initDB,
    loadSettings,
    saveSettings,
    updateBackground,
    fetchBingWallpaper,
  }
}
