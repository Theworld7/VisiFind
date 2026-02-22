<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NModal, NSpace } from 'naive-ui'
import '@/styles/variables.css'
import searchIcon from '@/assets/icon-search.svg'
import BookmarkGrid from '@/components/BookmarkGrid.vue'
import BookmarkModal from '@/components/BookmarkModal.vue'
import EngineSelector from '@/components/EngineSelector.vue'
import { useBookmarks, type Bookmark } from '@/composables/useBookmarks'
import { useSearch } from '@/composables/useSearch'
import { useAppSettings } from '@/composables/useAppSettings'
import { useBackground } from '@/composables/useBackground'
import { useAppStore } from '@/stores/app'

const {
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
} = useBookmarks()
const { searchQuery, currentEngine, search, openBookmark } = useSearch()
const { initDB: initSettingsDB, loadSettings, saveSettings } = useAppSettings()
const { loadSettings: loadBackgroundSettings } = useBackground()

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

const handleReorder = (reorderedBookmarks: Bookmark[]) => {
  reorderBookmarks(reorderedBookmarks)
}

watch(currentEngine, (newEngine: string) => {
  saveSettings('searchEngine', newEngine)
})

const importFileInput = ref<HTMLInputElement | null>(null)

const triggerImport = () => {
  importFileInput.value?.click()
}

const handleImportData = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      const importCount = await importData(data)
      if (data.backgroundSettings || data.foodLibrary) {
        await loadBackgroundSettings()
      }
      if (importCount !== undefined && importCount > 0) {
        alert(`导入成功！共导入 ${importCount} 个项目`)
      } else if (importCount === 0) {
        alert('没有新数据需要导入')
      }
    } catch (err) {
      alert('导入失败，请检查文件格式是否正确')
      console.error(err)
    }
    input.value = ''
  }
  reader.readAsText(file)
}

const doExportData = async () => {
  await exportData()
}

onMounted(async () => {
  await initDB()
  initSettingsDB(db.value!)
  await loadSettings()
  await loadBookmarks()

  const appStore = useAppStore()
  appStore.registerImportExport(triggerImport, doExportData, handleImportData)
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

    <input
      ref="importFileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleImportData"
    />
  </div>
</template>

<style scoped>
.search-page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.search-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
  width: 100%;
}

.search-bar {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.search-box {
  display: flex;
  align-items: center;
  width: 100%;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
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
  background: transparent;
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

.search-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

@media (max-width: 768px) {
  .search-container {
    gap: 32px;
  }
}
</style>
