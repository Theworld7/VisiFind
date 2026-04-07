<script setup>
import { ref, onMounted, inject, watch } from 'vue'
import { Upload, Image, Download, Upload as UploadIcon, Edit2, X, Plus, Search, GripVertical } from 'lucide-vue-next'
import Modal from './Modal.vue'
import { useSettings } from '../composables/useSettings'
import { useBingImage } from '../composables/useBingImage'
import { exportAllIntakeData, importAllIntakeData } from '../lib/intakeDb.js'
import { exportAllWeightData, importAllWeightData } from '../lib/weightDb.js'
import { getSetting, getAppSetting, setAppSetting, exportAllItemsData, importAllItemsData } from '../lib/db'
import { exportAllDocumentsData, importAllDocumentsData } from '../lib/documents.js'
import { exportAllSeriesData, importAllSeriesData } from '../lib/seriesDb.js'

// 从父组件注入 searchState
const searchState = inject('searchState', null)
const searchEngines = searchState?.searchEngines || ref([])
const { loadSearchEngines, addEngine, updateEngine, deleteEngine, saveSearchEngines } = searchState || {}

const props = defineProps({
  open: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:open', 'change'])

const { bgMode, imageUrl, uploadedImage, onlineImageUrl, loadSettings, setBgMode, setImageUrl, setUploadedImage, getBgImageUrl } = useSettings()
const { getCachedPreview } = useBingImage()

const bgModes = [
  { value: 'bing', label: 'Bing 每日壁纸', icon: Image },
  { value: 'online', label: '在线图片', icon: Image },
  { value: 'upload', label: '上传图片', icon: Upload }
]

const bingPreviewUrl = ref('')

// 当模态框打开时加载设置和预览
watch(() => props.open, async (newVal) => {
  if (newVal) {
    // 加载设置以确保状态同步
    await loadSettings()

    if (bgMode.value === 'bing') {
      // 优先使用已保存的壁纸 URL 作为预览
      const savedImageUrl = imageUrl.value || await getSetting('imageUrl')
      // 从缓存获取预览图（优先缓存，回退到 URL 转换）
      bingPreviewUrl.value = await getCachedPreview(savedImageUrl)
    }
  }
}, { immediate: true })

const handleModeChange = async (mode) => {
  await setBgMode(mode)
  emit('change', { mode, imageUrl: getBgImageUrl() })
}

const handleImageUrlSave = async () => {
  await setImageUrl(onlineImageUrl.value)
  emit('change', { mode: bgMode.value, imageUrl: onlineImageUrl.value })
}

const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      await setUploadedImage(e.target.result)
      emit('change', { mode: bgMode.value, imageUrl: e.target.result })
    }
    reader.readAsDataURL(file)
  }
}

const handleClose = () => {
  emit('update:open', false)
}

// 备份数据
const handleBackup = async () => {
  try {
    const data = await exportAllIntakeData()
    const weightData = await exportAllWeightData()
    const itemsData = await exportAllItemsData()
    const documentsData = await exportAllDocumentsData()
    const seriesData = await exportAllSeriesData()

    // 同时导出 IndexedDB 中的书签数据和应用设置
    const bookmarks = await getAppSetting('bookmarks')
    const bookmarkGroups = await getAppSetting('bookmarkGroups')
    const lastVisitDate = await getAppSetting('lastVisitDate')

    const backupData = {
      intake: data,
      weight: weightData,
      items: itemsData,
      documents: documentsData,
      series: seriesData,
      appSettings: {
        bookmarks,
        bookmarkGroups,
        lastVisitDate
      },
      backupTime: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `visifind-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Backup failed:', e)
    alert('备份失败：' + e.message)
  }
}

// 恢复数据
const handleRestore = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const backupData = JSON.parse(e.target.result)

      // 恢复摄入相关数据（设置、记录、限制、食物库）
      if (backupData.intake) {
        await importAllIntakeData(backupData.intake)

        // 保存 Bing 壁纸 URL 到 IndexedDB，用于恢复后保持一致
        if (backupData.intake.settings && backupData.intake.settings.imageUrl && backupData.intake.settings.bgMode === 'bing') {
          await setAppSetting('restoredBingImageUrl', backupData.intake.settings.imageUrl)
        }
      }

      // 恢复体重数据
      if (backupData.weight) {
        await importAllWeightData(backupData.weight)
      }

      // 恢复物品数据
      if (backupData.items) {
        await importAllItemsData(backupData.items)
      }

      // 恢复文档数据
      if (backupData.documents) {
        await importAllDocumentsData(backupData.documents)
      }

      // 恢复漫剧数据
      if (backupData.series) {
        await importAllSeriesData(backupData.series)
      }

      // 恢复 IndexedDB 应用设置数据
      if (backupData.appSettings) {
        if (backupData.appSettings.bookmarks) {
          await setAppSetting('bookmarks', backupData.appSettings.bookmarks)
        }
        if (backupData.appSettings.bookmarkGroups) {
          await setAppSetting('bookmarkGroups', backupData.appSettings.bookmarkGroups)
        }
        if (backupData.appSettings.lastVisitDate) {
          await setAppSetting('lastVisitDate', backupData.appSettings.lastVisitDate)
        }
      }

      alert('数据恢复成功！页面将重新加载。')
      emit('update:open', false)
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (err) {
      console.error('Restore failed:', err)
      alert('恢复失败：无效的备份文件格式')
    }
  }
  reader.readAsText(file)
}

// 搜索引擎管理
const isAddingEngine = ref(false)
const editingEngineId = ref(null)
const engineForm = ref({ name: '', url: '' })
const draggedEngineIndex = ref(null)

const openAddEngineModal = () => {
  editingEngineId.value = null
  engineForm.value = { name: '', url: '' }
  isAddingEngine.value = true
}

const openEditEngineModal = (engine) => {
  editingEngineId.value = engine.id
  engineForm.value = { name: engine.name, url: engine.url }
  isAddingEngine.value = true
}

const closeEngineModal = () => {
  isAddingEngine.value = false
  editingEngineId.value = null
}

const handleSaveEngine = async () => {
  if (!engineForm.value.name || !engineForm.value.url) {
    alert('请填写完整信息')
    return
  }

  let url = engineForm.value.url
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }

  // 确保 URL 以 ? 或 = 结尾，用于拼接搜索词
  if (!url.endsWith('?') && !url.endsWith('=') && !url.endsWith('&')) {
    url += '?'
  }

  if (editingEngineId.value) {
    await updateEngine(editingEngineId.value, {
      name: engineForm.value.name,
      url: url
    })
  } else {
    await addEngine({
      name: engineForm.value.name,
      url: url
    })
  }

  closeEngineModal()
}

const handleDeleteEngine = async (engine) => {
  if (confirm(`确定要删除搜索引擎"${engine.name}"吗？`)) {
    await deleteEngine(engine.id)
  }
}

// 拖拽排序
const handleEngineDragStart = (index) => {
  draggedEngineIndex.value = index
}

const handleEngineDragOver = (e, index) => {
  e.preventDefault()
  if (draggedEngineIndex.value === null || draggedEngineIndex.value === index) return
  
  // 交换引擎位置
  const draggedEngine = searchEngines.value[draggedEngineIndex.value]
  const targetEngine = searchEngines.value[index]
  
  const temp = { ...draggedEngine }
  searchEngines.value[draggedEngineIndex.value] = { ...targetEngine }
  searchEngines.value[index] = temp
  draggedEngineIndex.value = index
}

const handleEngineDragEnd = async () => {
  draggedEngineIndex.value = null
  await saveSearchEngines()
}
</script>

<template>
  <Modal :open="open" @update:open="emit('update:open', $event)" title="设置">
    <div class="space-y-6">
      <!-- Background Mode -->
      <div>
        <h3 class="text-sm font-medium mb-3 text-white">背景模式</h3>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="mode in bgModes"
            :key="mode.value"
            :class="[
              'flex items-center gap-2 p-3 rounded-md border transition-colors',
              bgMode === mode.value
                ? 'border-white/40 bg-white/20 text-white'
                : 'border-white/20 text-white/80 hover:bg-white/10'
            ]"
            @click="handleModeChange(mode.value)"
          >
            <component :is="mode.icon" class="w-4 h-4" />
            <span class="text-sm">{{ mode.label }}</span>
          </button>
        </div>
      </div>

      <!-- Online Image URL -->
      <div v-if="bgMode === 'online'">
        <h3 class="text-sm font-medium mb-3 text-white">图片 URL</h3>
        <div class="flex gap-2">
          <input
            v-model="onlineImageUrl"
            type="text"
            placeholder="输入图片地址..."
            class="flex-1 px-3 py-2 rounded-md border border-white/20 bg-white/10 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15"
          />
          <button
            class="px-4 py-2 bg-white/30 hover:bg-white/40 text-white rounded-md text-sm transition-colors"
            @click="handleImageUrlSave"
          >
            保存
          </button>
        </div>
      </div>

      <!-- Upload Image -->
      <div v-if="bgMode === 'upload'">
        <h3 class="text-sm font-medium mb-3 text-white">上传图片</h3>
        <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-md cursor-pointer hover:bg-white/10 transition-colors">
          <Upload class="w-8 h-8 text-white/60 mb-2" />
          <span class="text-sm text-white/60">点击上传图片</span>
          <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
        </label>
        <div v-if="uploadedImage" class="mt-3">
          <img :src="uploadedImage" alt="Uploaded" class="w-full h-32 object-cover rounded-md" />
        </div>
      </div>

      <!-- Preview -->
      <div v-if="bgMode === 'bing' || (bgMode === 'online' && imageUrl)">
        <h3 class="text-sm font-medium mb-3 text-white">预览</h3>
        <img
          :src="bgMode === 'bing' ? bingPreviewUrl : imageUrl"
          alt="Preview"
          class="w-full h-32 object-cover rounded-md"
        />
      </div>

      <!-- Data Backup & Restore -->
      <div>
        <h3 class="text-sm font-medium mb-3 text-white">数据管理</h3>
        <div class="flex gap-2">
          <button
            class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/30 hover:bg-white/40 text-white rounded-md text-sm transition-colors"
            @click="handleBackup"
          >
            <Download class="w-4 h-4" />
            备份数据
          </button>
          <label class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/30 hover:bg-white/40 text-white rounded-md text-sm transition-colors cursor-pointer">
            <UploadIcon class="w-4 h-4" />
            恢复数据
            <input type="file" accept=".json" class="hidden" @change="handleRestore" />
          </label>
        </div>
      </div>

      <!-- Search Engines -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-white">搜索引擎</h3>
          <button
            class="flex items-center gap-1 px-3 py-1.5 bg-white/30 hover:bg-white/40 text-white rounded-md text-xs transition-colors"
            @click="openAddEngineModal"
          >
            <Plus class="w-3.5 h-3.5" />
            添加
          </button>
        </div>
        <div class="space-y-2">
          <div
            v-for="(engine, index) in searchEngines"
            :key="engine.id"
            draggable="true"
            :class="[
              'flex items-center justify-between p-3 rounded-md border border-white/20 bg-white/10 transition-all',
              draggedEngineIndex === index ? 'opacity-50 scale-95' : ''
            ]"
            @dragstart="handleEngineDragStart(index)"
            @dragover="handleEngineDragOver($event, index)"
            @dragend="handleEngineDragEnd"
          >
            <div class="flex items-center gap-2 flex-1">
              <button
                class="p-1 hover:bg-white/10 rounded cursor-grab active:cursor-grabbing"
                @dragstart="handleEngineDragStart(index)"
                @click.stop
              >
                <GripVertical class="w-4 h-4 text-white/40" />
              </button>
              <Search class="w-4 h-4 text-white/60" />
              <div class="flex-1">
                <div class="text-sm text-white font-medium">{{ engine.name }}</div>
                <div class="text-xs text-white/50 truncate">{{ engine.url }}</div>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <button
                class="p-1.5 hover:bg-white/20 rounded transition-colors"
                @click="openEditEngineModal(engine)"
              >
                <Edit2 class="w-3.5 h-3.5 text-white/70" />
              </button>
              <button
                class="p-1.5 hover:bg-white/20 rounded transition-colors"
                @click="handleDeleteEngine(engine)"
              >
                <X class="w-3.5 h-3.5 text-white/70" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Engine Edit Modal -->
    <Teleport to="body">
      <Transition name="modal" appear>
        <div v-if="isAddingEngine" class="fixed inset-0 z-[60] flex items-center justify-center">
          <div class="fixed inset-0 modal-backdrop" @click="closeEngineModal" />
          <div class="relative modal-content rounded-lg w-full max-w-md mx-4 overflow-hidden">
            <div class="flex items-center justify-between p-4 border-b border-white/20">
              <h2 class="text-lg font-semibold text-white">{{ editingEngineId ? '编辑搜索引擎' : '添加搜索引擎' }}</h2>
              <button
                class="p-1 rounded-md hover:bg-white/10 transition-colors"
                @click="closeEngineModal"
              >
                <X class="w-5 h-5 text-white" />
              </button>
            </div>
            <div class="p-4 space-y-4">
              <div>
                <label class="block text-xs text-white/70 mb-1">名称</label>
                <input
                  v-model="engineForm.name"
                  type="text"
                  placeholder="如：Google、百度"
                  class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15"
                />
              </div>
              <div>
                <label class="block text-xs text-white/70 mb-1">搜索 URL</label>
                <input
                  v-model="engineForm.url"
                  type="text"
                  placeholder="https://www.google.com/search?q="
                  class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15"
                />
                <p class="text-xs text-white/40 mt-1">URL 末尾需要包含 ? 或 = 用于拼接搜索词</p>
              </div>
              <div class="flex gap-2 pt-2">
                <button
                  type="button"
                  @click="closeEngineModal"
                  class="flex-1 bg-white/10 hover:bg-white/20 text-white text-sm py-2 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  @click="handleSaveEngine"
                  class="flex-1 bg-white/30 hover:bg-white/40 text-white text-sm py-2 rounded-lg transition-colors"
                >
                  {{ editingEngineId ? '保存' : '添加' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </Modal>
</template>
