<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { NDrawer, NDrawerContent, NButton, NDivider } from 'naive-ui'
import '@/styles/variables.css'
import searchIcon from '@/assets/icon-search.svg'
import settingIcon from '@/assets/setting.svg'
import BookmarkGrid from '@/components/BookmarkGrid.vue'
import EngineSelector from '@/components/EngineSelector.vue'
import BackgroundSettings from '@/components/BackgroundSettings.vue'
import BookmarkModal from '@/components/BookmarkModal.vue'

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

const showSettingsDrawer = ref(false)

// 抽屉设置表单数据
const formValue = ref({
  mode: 'none' as 'none' | 'upload' | 'url',
  url: '',
  blur: 0,
})

const tempBackgroundUrl = ref('')
const backgroundFileInput = ref<HTMLInputElement | null>(null)

const selectFileButtonText = computed(() => (tempBackgroundUrl.value ? '重新选择图片' : '选择图片'))

const triggerFileInput = () => {
  backgroundFileInput.value?.click()
}

const handleBackgroundUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      tempBackgroundUrl.value = e.target?.result as string
      formValue.value.mode = 'upload'
    }
    reader.readAsDataURL(file)
  }
}

const applySettings = () => {
  const url = formValue.value.mode === 'url' ? formValue.value.url : tempBackgroundUrl.value
  backgroundUrl.value = url
  backgroundInputMode.value = formValue.value.mode
  backgroundBlur.value = formValue.value.blur
  saveBackgroundSettings()
  showSettingsDrawer.value = false
}

// 监听抽屉打开，同步初始值
watch(showSettingsDrawer, (val) => {
  if (val) {
    tempBackgroundUrl.value = backgroundUrl.value
    formValue.value.mode = backgroundInputMode.value
    formValue.value.url = backgroundInputMode.value === 'url' ? backgroundUrl.value : ''
    formValue.value.blur = backgroundBlur.value
  }
})

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
const editingBookmark = ref<Bookmark | null>(null)

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

// 处理书签排序
const handleReorder = (reorderedBookmarks: Bookmark[]) => {
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
            // 移除ID字段，让数据库自动生成新ID
            const { id, ...bookmarkWithoutId } = bookmark
            await addBookmark(bookmarkWithoutId)
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
      <!-- 设置按钮 -->
      <button class="action-btn" @click="showSettingsDrawer = true" title="设置">
        <img :src="settingIcon" alt="设置" />
      </button>
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
        @reorder="handleReorder"
      />
    </div>

    <!-- 书签表单模态框 -->
    <BookmarkModal
      v-model:show="isModalOpen"
      :mode="modalMode"
      :bookmark="editingBookmark"
      @save="handleBookmarkSave"
    />

    <!-- 背景设置模态框 -->
    <BackgroundSettings
      v-model:show="showBackgroundModal"
      v-model:background-url="backgroundUrl"
      v-model:background-input-mode="backgroundInputMode"
      v-model:background-url-input="backgroundUrlInput"
      v-model:background-blur="backgroundBlur"
      @save="handleBackgroundSave"
    />

    <!-- 设置抽屉 -->
    <NDrawer v-model:show="showSettingsDrawer" :width="400" placement="right">
      <NDrawerContent title="设置" closable>
        <n-form ref="formRef" :model="formValue">
          <!-- 背景模式选择 -->
          <n-form-item label="背景模式" path="mode">
            <div class="mode-switch">
              <n-radio-group v-model:value="formValue.mode" name="backgroundType">
                <n-radio-button value="none">无背景</n-radio-button>
                <n-radio-button value="url">在线图片</n-radio-button>
                <n-radio-button value="upload">上传图片</n-radio-button>
              </n-radio-group>
            </div>
          </n-form-item>
          <!-- 选择图片按钮 - 上传模式显示 -->
          <n-form-item v-if="formValue.mode === 'upload'" label="选择图片">
            <n-button @click="triggerFileInput">{{ selectFileButtonText }}</n-button>
            <input
              ref="backgroundFileInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleBackgroundUpload"
            />
          </n-form-item>
          <!-- 上传预览 - 上传模式且有图片时显示 -->
          <div v-if="formValue.mode === 'upload' && tempBackgroundUrl" class="form-group">
            <div class="form-label">预览</div>
            <div class="bg-preview">
              <img :src="tempBackgroundUrl" alt="背景预览" />
            </div>
          </div>
          <!-- URL输入 - 在线图片模式显示 -->
          <n-form-item v-if="formValue.mode === 'url'" label="图片URL" path="url">
            <n-input v-model:value="formValue.url" placeholder="输入图片链接（如 https://...）" />
          </n-form-item>
          <!-- URL预览 - 在线图片模式且有URL时显示 -->
          <n-form-item v-if="formValue.mode === 'url' && formValue.url" path="url">
            <div class="bg-preview">
              <img :src="formValue.url" alt="背景预览" />
            </div>
          </n-form-item>
          <!-- 模糊效果 - 非无背景模式显示 -->
          <n-form-item v-if="formValue.mode !== 'none'" label="模糊效果" path="blur">
            <n-select
              v-model:value="formValue.blur"
              :options="[
                { label: '无模糊', value: 0 },
                { label: '轻微模糊', value: 5 },
                { label: '中等模糊', value: 10 },
                { label: '强模糊', value: 20 },
              ]"
            />
          </n-form-item>
        </n-form>

        <n-divider />

        <n-space vertical>
          <n-button block @click="triggerImport"> 导入备份 </n-button>
          <n-button block @click="exportData"> 导出备份 </n-button>
        </n-space>

        <input
          ref="importFileInput"
          type="file"
          accept=".json"
          style="display: none"
          @change="importData"
        />

        <template #footer>
          <n-space reverse>
            <n-button type="primary" @click="applySettings">应用</n-button>
            <n-button @click="showSettingsDrawer = false">关闭</n-button>
          </n-space>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style>
.fullscreen {
  width: 100vw;
  height: 100vh;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  box-sizing: border-box;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
  width: 600px;
  margin: auto;
  position: relative;
  z-index: 1;
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
  }

  .action-buttons {
    position: relative;
    top: 0;
    right: 0;
    margin-bottom: 16px;
  }

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

.bg-preview {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-light);
}

.bg-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
