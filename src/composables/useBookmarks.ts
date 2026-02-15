import { ref } from 'vue'

export interface Bookmark {
  id?: number
  name: string
  url: string
  customIcon?: string
  group?: string
  description?: string
}

const db = ref<IDBDatabase | null>(null)

export function useBookmarks() {
  const bookmarks = ref<Bookmark[]>([])

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

  const loadBookmarks = async () => {
    if (!db.value) return

    const transaction = db.value.transaction('bookmarks', 'readonly')
    const store = transaction.objectStore('bookmarks')
    const request = store.getAll()

    request.onsuccess = () => {
      bookmarks.value = request.result
    }
  }

  const addBookmark = (bookmark: Bookmark): Promise<number> => {
    return new Promise((resolve, reject) => {
      if (!db.value) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = db.value.transaction('bookmarks', 'readwrite')
      const store = transaction.objectStore('bookmarks')
      const request = store.add(bookmark)

      request.onsuccess = () => {
        const id = request.result as number
        const newBookmark = { ...bookmark, id }
        bookmarks.value = [...bookmarks.value, newBookmark]
        resolve(id)
      }
      request.onerror = () => reject(request.error)
    })
  }

  const updateBookmark = (id: number, bookmark: Bookmark) => {
    if (!db.value) return

    const transaction = db.value.transaction('bookmarks', 'readwrite')
    const store = transaction.objectStore('bookmarks')
    store.put({ ...bookmark, id })

    transaction.oncomplete = () => {
      bookmarks.value = bookmarks.value.map((b) => (b.id === id ? { ...bookmark, id } : b))
    }
  }

  const deleteBookmark = (id: number) => {
    if (!db.value) return

    const transaction = db.value.transaction('bookmarks', 'readwrite')
    const store = transaction.objectStore('bookmarks')
    store.delete(id)

    transaction.oncomplete = () => {
      bookmarks.value = bookmarks.value.filter((b) => b.id !== id)
    }
  }

  const reorderBookmarks = (reorderedBookmarks: Bookmark[]) => {
    if (!db.value) return

    const transaction = db.value.transaction('bookmarks', 'readwrite')
    const store = transaction.objectStore('bookmarks')

    reorderedBookmarks.forEach((bookmark) => {
      if (bookmark.id !== undefined) {
        store.put(bookmark)
      }
    })

    bookmarks.value = reorderedBookmarks
  }

  const exportData = () => {
    const data = {
      version: 1,
      bookmarks: bookmarks.value,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookmarks-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importData = async (data: { bookmarks?: Bookmark[] }) => {
    if (!data.bookmarks || !Array.isArray(data.bookmarks)) return 0

    const existingNames = new Set(bookmarks.value.map((b) => b.name.toLowerCase()))
    let importCount = 0

    for (const bookmark of data.bookmarks) {
      if (!existingNames.has(bookmark.name.toLowerCase())) {
        const { id, ...bookmarkWithoutId } = bookmark
        await addBookmark(bookmarkWithoutId)
        existingNames.add(bookmark.name.toLowerCase())
        importCount++
      }
    }

    return importCount
  }

  return {
    db,
    bookmarks,
    initDB,
    loadBookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    reorderBookmarks,
    exportData,
    importData,
  }
}
