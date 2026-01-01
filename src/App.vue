<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import '@/styles/variables.css'
import searchIcon from '@/assets/icon-search.svg'
import exportIcon from '@/assets/icon-export.svg'
import importIcon from '@/assets/icon-import.svg'
import BookmarkGrid from '@/components/BookmarkGrid.vue'
import EngineSelector from '@/components/EngineSelector.vue'
import BackgroundSettings from '@/components/BackgroundSettings.vue'

interface Bookmark {
  id?: number
  name: string
  url: string
  customIcon?: string // 自定义图标（base64或URL）
  group?: string
}

const backgroundUrl = ref('')
const backgroundInputMode = ref<'none' | 'upload' | 'url'>('none')
const showBackgroundModal = ref(false)
const backgroundUrlInput = ref('')
const backgroundBlur = ref(0)

const backgroundStyle = computed(() => {
  const style: Record<string, string> = {}
  if (backgroundUrl.value) {
    style.backgroundImage = `url(${backgroundUrl.value})`
  }
  style['--bg-blur'] = backgroundBlur.value ? `${backgroundBlur.value}px` : '0px'
  return style
})

const screenWidth = ref(window.innerWidth)
const searchQuery = ref('')
const currentEngine = ref('baidu')
const bookmarks = ref<Bookmark[]>([])
const db = ref<IDBDatabase | null>(null)
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const editingBookmarkId = ref<number | null>(null)
const formName = ref('')
const formUrl = ref('')
const formGroup = ref('')
const formCustomIcon = ref('') // 自定义图标URL或base64
const iconInputMode = ref<'none' | 'upload' | 'url'>('none')
const iconFileInput = ref<HTMLInputElement | null>(null)

// IndexedDB 相关函数
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

// 加载设置
const loadSettings = async () => {
  if (!db.value) return

  const transaction = db.value.transaction('settings', 'readonly')
  const store = transaction.objectStore('settings')

  // 加载搜索引擎
  const engineRequest = store.get('searchEngine')
  engineRequest.onsuccess = () => {
    if (engineRequest.result) {
      currentEngine.value = engineRequest.result.value
    }
  }

  // 加载背景设置
  const bgRequest = store.get('backgroundSettings')
  bgRequest.onsuccess = () => {
    if (bgRequest.result) {
      const settings = bgRequest.result.value
      if (settings.backgroundUrl !== undefined) {
        backgroundUrl.value = settings.backgroundUrl
      }
      if (settings.backgroundInputMode !== undefined) {
        backgroundInputMode.value = settings.backgroundInputMode
      }
      if (settings.backgroundBlur !== undefined) {
        backgroundBlur.value = settings.backgroundBlur
      }
    }
  }
}

// 保存设置
const saveSettings = (key: string, value: string) => {
  if (!db.value) return

  const transaction = db.value.transaction('settings', 'readwrite')
  const store = transaction.objectStore('settings')
  store.put({ key, value })
}

// 保存背景设置
const saveBackgroundSettings = () => {
  if (!db.value) return

  const transaction = db.value.transaction('settings', 'readwrite')
  const store = transaction.objectStore('settings')
  store.put({
    key: 'backgroundSettings',
    value: {
      backgroundUrl: backgroundUrl.value,
      backgroundInputMode: backgroundInputMode.value,
      backgroundBlur: backgroundBlur.value,
    },
  })
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

const updateScreenWidth = () => {
  screenWidth.value = window.innerWidth
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

const openAddModal = () => {
  modalMode.value = 'add'
  formName.value = ''
  formUrl.value = ''
  formGroup.value = ''
  formCustomIcon.value = ''
  iconInputMode.value = 'none'
  isModalOpen.value = true
}

const openEditModal = (bookmark: Bookmark) => {
  modalMode.value = 'edit'
  editingBookmarkId.value = bookmark.id ?? null
  formName.value = bookmark.name
  formUrl.value = bookmark.url
  formGroup.value = bookmark.group || ''
  formCustomIcon.value = bookmark.customIcon || ''
  iconInputMode.value = bookmark.customIcon ? 'url' : 'none'
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingBookmarkId.value = null
}

const saveBookmark = () => {
  if (!formName.value.trim() || !formUrl.value.trim()) return

  const bookmark: Bookmark = {
    name: formName.value,
    url: formUrl.value,
    group: formGroup.value.trim() || undefined,
    customIcon: formCustomIcon.value || undefined,
  }

  if (modalMode.value === 'add') {
    addBookmark(bookmark)
  } else if (editingBookmarkId.value !== null) {
    updateBookmark(editingBookmarkId.value, bookmark)
  }

  closeModal()
}

// 处理图标文件上传
const handleIconUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      formCustomIcon.value = e.target?.result as string
      iconInputMode.value = 'url'
    }
    reader.readAsDataURL(file)
  }
}

// 设置图标URL模式
const setIconUrlMode = () => {
  iconInputMode.value = 'url'
}

// 清除自定义图标
const clearCustomIcon = () => {
  formCustomIcon.value = ''
  iconInputMode.value = 'none'
}

// 处理背景设置保存
const handleBackgroundSave = (data: {
  backgroundUrl: string
  backgroundInputMode: string
  backgroundBlur: number
}) => {
  // 更新数据
  backgroundUrl.value = data.backgroundUrl
  backgroundInputMode.value = data.backgroundInputMode as typeof backgroundInputMode.value
  backgroundBlur.value = data.backgroundBlur
  // 关闭弹窗
  showBackgroundModal.value = false
  // 保存设置
  saveBackgroundSettings()
}

// 导出数据
const exportData = () => {
  const data = {
    version: 1,
    backgroundUrl: backgroundUrl.value,
    backgroundInputMode: backgroundInputMode.value,
    backgroundBlur: backgroundBlur.value,
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

// 导入数据
const importFileInput = ref<HTMLInputElement | null>(null)

const triggerImport = () => {
  importFileInput.value?.click()
}

const importData = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      if (data.bookmarks && Array.isArray(data.bookmarks)) {
        // 获取现有名称用于去重
        const existingNames = new Set(bookmarks.value.map((b) => b.name.toLowerCase()))

        // 导入新数据，忽略重复名称
        let importCount = 0
        for (const bookmark of data.bookmarks) {
          if (!existingNames.has(bookmark.name.toLowerCase())) {
            await addBookmark(bookmark)
            existingNames.add(bookmark.name.toLowerCase())
            importCount++
          }
        }

        // 导入背景设置
        if (data.backgroundUrl !== undefined) {
          backgroundUrl.value = data.backgroundUrl || ''
        }
        if (data.backgroundInputMode !== undefined) {
          backgroundInputMode.value = data.backgroundInputMode
        }
        if (data.backgroundBlur !== undefined) {
          backgroundBlur.value = data.backgroundBlur
        }

        alert(`导入成功！共导入 ${importCount} 个书签`)
      }
    } catch (err) {
      alert('导入失败，请检查文件格式是否正确')
      console.error(err)
    }
    // 清空 input 以便重复导入同一文件
    input.value = ''
  }
  reader.readAsText(file)
}

onMounted(async () => {
  await initDB()
  await loadSettings()
  await loadBookmarks()
  updateScreenWidth()
  window.addEventListener('resize', updateScreenWidth)
})

// 监听搜索引擎变化并保存
watch(currentEngine, (newEngine: string) => {
  saveSettings('searchEngine', newEngine)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScreenWidth)
})
</script>

<template>
  <div class="fullscreen" :class="{ 'has-background': backgroundUrl }" :style="backgroundStyle">
    <!-- 右上角操作按钮 -->
    <div class="action-buttons">
      <!-- 背景设置按钮 -->
      <button class="action-btn" @click="showBackgroundModal = true" title="设置背景">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="3" />
          <path
            d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          />
        </svg>
      </button>
      <!-- 导入按钮 -->
      <button class="action-btn" @click="triggerImport" title="导入恢复">
        <img :src="importIcon" alt="导入" />
      </button>
      <!-- 导出按钮 -->
      <button class="action-btn" @click="exportData" title="导出备份">
        <img :src="exportIcon" alt="导出" />
      </button>
      <input
        ref="importFileInput"
        type="file"
        accept=".json"
        style="display: none"
        @change="importData"
      />
    </div>

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
        :bookmarks="bookmarks"
        @add="openAddModal"
        @edit="openEditModal"
        @delete="deleteBookmark"
        @open="openBookmark"
      />
    </div>

    <!-- 模态框 -->
    <div v-if="isModalOpen" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <h3 class="modal-title">{{ modalMode === 'add' ? '新增书签' : '编辑书签' }}</h3>
        <div class="form-group">
          <label>名称</label>
          <input v-model="formName" type="text" placeholder="输入名称" />
        </div>
        <div class="form-group">
          <label>网址</label>
          <input v-model="formUrl" type="text" placeholder="https://..." />
        </div>
        <div class="form-group">
          <label>分组</label>
          <input v-model="formGroup" type="text" placeholder="输入分组名称（可选）" />
        </div>
        <div class="form-group">
          <label>图标</label>
          <div class="icon-input-container">
            <div class="icon-mode-tabs">
              <button :class="{ active: iconInputMode === 'none' }" @click="clearCustomIcon">
                不使用
              </button>
              <button :class="{ active: iconInputMode === 'url' }" @click="setIconUrlMode">
                在线图片
              </button>
              <button
                :class="{ active: iconInputMode === 'upload' }"
                @click="iconFileInput?.click()"
              >
                上传图片
              </button>
              <input
                ref="iconFileInput"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handleIconUpload"
              />
            </div>
            <div v-if="iconInputMode === 'url'" class="icon-url-input">
              <input
                v-model="formCustomIcon"
                type="text"
                placeholder="输入图片URL（如 https://...）"
              />
              <div v-if="formCustomIcon" class="icon-preview">
                <img :src="formCustomIcon" alt="预览" @error="clearCustomIcon" />
              </div>
            </div>
            <div v-else-if="formCustomIcon" class="icon-preview">
              <img :src="formCustomIcon" alt="预览" @error="clearCustomIcon" />
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="closeModal">取消</button>
          <button class="btn-save" @click="saveBookmark">保存</button>
        </div>
      </div>
    </div>

    <!-- 背景设置模态框 -->
    <BackgroundSettings
      v-model:show="showBackgroundModal"
      v-model:background-url="backgroundUrl"
      v-model:background-input-mode="backgroundInputMode"
      v-model:background-url-input="backgroundUrlInput"
      v-model:background-blur="backgroundBlur"
      @save="handleBackgroundSave"
    />
  </div>
</template>

<style>
.fullscreen {
  width: 100vw;
  height: 100vh;
  padding: 24px;
  position: relative;
  background-color: var(--bg-gradient-start);
  background-image: linear-gradient(
    135deg,
    var(--bg-gradient-start) 0%,
    var(--bg-gradient-mid) 50%,
    var(--bg-gradient-end) 100%
  );
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.fullscreen.has-background {
  background-color: transparent;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.action-buttons {
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-white-20);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-white);
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--bg-white-30);
}

.action-btn img {
  width: 18px;
  height: 18px;
  filter: invert(1);
}

.search-container {
  position: absolute;
  top: 35%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 48px;
  width: 600px;
}

.search-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.search-box {
  display: flex;
  align-items: center;
  width: 100%;
  height: 48px;
  background: var(--bg-white-85);
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
}

.search-btn {
  height: 100%;
  padding: 0 16px;
  background: var(--bg-white-85);
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
}

.search-btn:hover,
.search-btn:active {
  background: var(--bg-overlay-light);
}

.search-btn:hover img,
.search-btn:active img {
  filter: invert(1);
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-white);
  border-radius: 12px;
  padding: 24px;
  width: 360px;
  box-shadow: 0 4px 20px var(--bg-overlay);
}

.modal-title {
  margin: 0 0 20px;
  font-size: 18px;
  color: var(--text-primary);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--text-secondary);
}

.form-group input[type='text'] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.form-group input[type='text']:focus {
  border-color: var(--primary-color);
}

.form-group input[type='color'] {
  width: 60px;
  height: 36px;
  border: none;
  cursor: pointer;
}

.icon-input-container {
  margin-top: 8px;
}

.icon-mode-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.icon-mode-tabs button {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-light);
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-mode-tabs button.active {
  background: linear-gradient(
    135deg,
    var(--bg-gradient-start) 0%,
    var(--bg-gradient-mid) 50%,
    var(--bg-gradient-end) 100%
  );
  color: var(--text-white);
  border-color: transparent;
}

.bg-preview {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.bg-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.icon-url-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-url-input input[type='text'] {
  flex: 1;
}

.icon-preview {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.icon-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-cancel,
.btn-save {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: var(--bg-light);
  border: none;
  color: var(--text-secondary);
}

.btn-cancel:hover {
  background: var(--bg-lighter);
}

.btn-save {
  background: linear-gradient(
    135deg,
    var(--bg-gradient-start) 0%,
    var(--bg-gradient-mid) 50%,
    var(--bg-gradient-end) 100%
  );
  border: none;
  color: var(--text-white);
}

.btn-save:hover {
  background: linear-gradient(
    135deg,
    var(--bg-gradient-start) 0%,
    var(--bg-gradient-mid) 65%,
    var(--bg-gradient-end) 100%
  );
}

.fullscreen::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-overlay-lighter);
  backdrop-filter: blur(var(--bg-blur, 0px));
  -webkit-backdrop-filter: blur(var(--bg-blur, 0px));
  pointer-events: none;
}

/* 手机适配 */
@media (max-width: 768px) {
  .fullscreen {
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .action-buttons {
    position: relative;
    top: 0;
    right: 0;
    margin-bottom: 16px;
  }

  .search-container {
    position: absolute;
    top: 30%;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 360px;
    align-items: center;
    gap: 40px;
  }

  .search-bar {
    gap: 6px;
  }

  .modal {
    width: calc(100% - 32px);
    max-width: 320px;
    padding: 20px;
  }

  .icon-mode-tabs {
    flex-wrap: wrap;
  }

  .icon-mode-tabs button {
    flex: 1;
    min-width: 70px;
    text-align: center;
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
