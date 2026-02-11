<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { NModal, NSpace } from 'naive-ui'
import '@/styles/variables.css'
import searchIcon from '@/assets/icon-search.svg'
import BookmarkGrid from '@/components/BookmarkGrid.vue'
import EngineSelector from '@/components/EngineSelector.vue'
import BookmarkModal from '@/components/BookmarkModal.vue'

interface Bookmark {
  id?: number
  name: string
  url: string
  customIcon?: string
  group?: string
  description?: string
}

const db = ref<IDBDatabase | null>(null)

const searchQuery = ref('')
const currentEngine = ref('baidu')
const bookmarks = ref<Bookmark[]>([])
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const editingBookmark = ref<Bookmark | null>(null)

const groups = computed(() => {
  const allGroups = bookmarks.value.map((b) => b.group).filter((g) => g !== undefined) as string[]
  return ['全部', ...new Set(allGroups)]
})

const currentGroup = ref('全部')

const filteredBookmarks = computed(() => {
  if (currentGroup.value === '全部') {
    return bookmarks.value
  }
  return bookmarks.value.filter((b) => b.group === currentGroup.value)
})

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

const saveSettings = (key: string, value: string) => {
  if (!db.value) return

  const transaction = db.value.transaction('settings', 'readwrite')
  const store = transaction.objectStore('settings')
  store.put({ key, value })
}

const loadSettings = async () => {
  if (!db.value) return

  const transaction = db.value.transaction('settings', 'readonly')
  const store = transaction.objectStore('settings')

  const engineRequest = store.get('searchEngine')
  engineRequest.onsuccess = () => {
    if (engineRequest.result) {
      currentEngine.value = engineRequest.result.value
    }
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

const search = () => {
  if (!searchQuery.value.trim()) return
  const query = encodeURIComponent(searchQuery.value)
  let url = ''
  switch (currentEngine.value) {
    case 'baidu':
      url = `https://www.baidu.com/s?wd=${query}`
      break
    case 'bing':
      url = `https://www.bing.com/search?q=${query}`
      break
    case 'google':
      url = `https://www.google.com/search?q=${query}`
      break
    case 'sogou':
      url = `https://www.sogou.com/web?query=${query}`
      break
  }
  window.open(url, '_blank')
}

const openBookmark = (url: string) => {
  window.open(url, '_blank')
}

const handleReorder = (reorderedBookmarks: Bookmark[]) => {
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

const openAddModal = () => {
  modalMode.value = 'add'
  editingBookmark.value = null
  isModalOpen.value = true
}

const openEditModal = (bookmark: Bookmark) => {
  modalMode.value = 'edit'
  editingBookmark.value = bookmark
  isModalOpen.value = true
}

const handleBookmarkSave = (data: Partial<Bookmark>) => {
  if (modalMode.value === 'add') {
    addBookmark(data as Bookmark)
  } else if (data.id) {
    updateBookmark(data.id, data as Bookmark)
  }
}

const switchGroup = (group: string) => {
  currentGroup.value = group
}

watch(currentEngine, (newEngine: string) => {
  saveSettings('searchEngine', newEngine)
})

onMounted(async () => {
  await initDB()
  await loadSettings()
  await loadBookmarks()
})
</script>

<template>
  <div class="search-page">
    <div class="search-container">
      <div class="search-bar">
        <EngineSelector v-model="currentEngine" />

        <div class="search-box">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="输入搜索内容..."
            @keyup.enter="search"
          />
          <button class="search-btn" @click="search">
            <img :src="searchIcon" alt="搜索" />
          </button>
        </div>
      </div>

      <BookmarkGrid
        :bookmarks="filteredBookmarks"
        :groups="groups"
        :current-group="currentGroup"
        @add="openAddModal"
        @edit="openEditModal"
        @delete="deleteBookmark"
        @open="openBookmark"
        @reorder="handleReorder"
        @switch-group="switchGroup"
      />
    </div>

    <BookmarkModal
      v-model:show="isModalOpen"
      :mode="modalMode"
      :bookmark="editingBookmark"
      @save="handleBookmarkSave"
    />
  </div>
</template>

<style scoped>
.search-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.search-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
  width: 600px;
  position: relative;
  z-index: 1;
}

.search-bar {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}

.search-box {
  display: flex;
  align-items: center;
  width: 100%;
  height: 48px;
  background: var(--bg-gray-15);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 4px 20px var(--bg-overlay-lighter);
}

.search-box input {
  flex: 1;
  height: 100%;
  padding: 0 20px;
  border: none;
  outline: none;
  font-size: 16px;
  background: transparent;
  color: var(--text-white);
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.search-btn {
  height: 100%;
  padding: 0 16px;
  background: var(--bg-gray-15);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.search-btn img {
  width: 20px;
  height: 20px;
  filter: invert(1);
}

.search-btn:hover,
.search-btn:active {
  background: var(--bg-overlay-light);
}

.search-btn:hover img,
.search-btn:active img {
  filter: invert(1);
}

@media (max-width: 768px) {
  .search-container {
    width: 100%;
    max-width: 360px;
    align-items: center;
    gap: 40px;
  }

  .search-bar {
    gap: 6px;
  }
}

@media (max-width: 392px) {
  .search-container {
    width: 100% !important;
    max-width: 100%;
    padding: 0 16px;
    box-sizing: border-box;
  }
}
</style>
