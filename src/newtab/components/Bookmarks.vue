<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Plus, X, Edit2, Grip } from 'lucide-vue-next'
import Modal from './Modal.vue'
import { getAppSetting, setAppSetting } from '../lib/db'

const props = defineProps({
  class: String,
  searchQuery: String
})

const bookmarks = ref([])
const isModalOpen = ref(false)
const editingId = ref(null)
const formData = ref({ name: '', url: '', group: '', description: '' })
const selectedGroup = ref('默认')
const draggedIndex = ref(null)
const isGroupDropdownOpen = ref(false)
const groupDropdownRef = ref(null)
const groupInputRef = ref(null)
const teleportedDropdownRef = ref(null)
const dropdownStyle = ref({ top: '0px', left: '0px', width: '0px' })

// 删除确认对话框状态
const isDeleteConfirmOpen = ref(false)
const bookmarkToDelete = ref(null)

// 自动滚动相关
const gridContainer = ref(null)
const scrollSpeed = ref(0)
let scrollAnimationId = null

const defaultBookmarks = [
]

onMounted(async () => {
  const saved = await getAppSetting('bookmarks')
  if (saved && Array.isArray(saved)) {
    bookmarks.value = saved
  } else {
    bookmarks.value = defaultBookmarks
  }
})

const saveBookmarks = async () => {
  await setAppSetting('bookmarks', JSON.parse(JSON.stringify(bookmarks.value)))
}

const groups = computed(() => {
  const groupSet = new Set(bookmarks.value.map(b => b.group).filter(g => g))
  return ['默认', ...Array.from(groupSet)]
})

const filteredBookmarks = computed(() => {
  // 首先根据类别筛选
  let result = selectedGroup.value === '默认'
    ? bookmarks.value.filter(b => !b.group || b.group === '')
    : bookmarks.value.filter(b => b.group === selectedGroup.value)

  // 如果有搜索词，进行模糊匹配
  if (props.searchQuery && props.searchQuery.trim()) {
    const query = props.searchQuery.toLowerCase().trim()
    const matched = result.filter(b =>
      b.name.toLowerCase().includes(query) ||
      b.url.toLowerCase().includes(query)
    )
    // 有匹配项时返回匹配结果，没有匹配项时返回当前类别下的全部书签
    return matched.length > 0 ? matched : result
  }

  return result
})

const openAddModal = () => {
  editingId.value = null
  formData.value = { name: '', url: '', group: '', description: '' }
  isModalOpen.value = true
}

const openEditModal = (bookmark) => {
  editingId.value = bookmark.id
  formData.value = {
    name: bookmark.name,
    url: bookmark.url,
    group: bookmark.group,
    description: bookmark.description || ''
  }
  isModalOpen.value = true
}

const handleSubmit = () => {
  if (!formData.value.name || !formData.value.url) return

  let url = formData.value.url
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }

  if (editingId.value) {
    const index = bookmarks.value.findIndex(b => b.id === editingId.value)
    if (index !== -1) {
      bookmarks.value[index] = {
        ...bookmarks.value[index],
        name: formData.value.name,
        url: url,
        group: formData.value.group || '',
        description: formData.value.description || ''
      }
    }
  } else {
    bookmarks.value.push({
      id: Date.now(),
      name: formData.value.name,
      url: url,
      group: formData.value.group || '',
      description: formData.value.description || ''
    })
  }

  saveBookmarks()
  isModalOpen.value = false
}

const handleDeleteBookmark = (bookmark) => {
  bookmarkToDelete.value = bookmark
  isDeleteConfirmOpen.value = true
}

const confirmDelete = () => {
  if (bookmarkToDelete.value) {
    bookmarks.value = bookmarks.value.filter(b => b.id !== bookmarkToDelete.value.id)
    saveBookmarks()
  }
  isDeleteConfirmOpen.value = false
  bookmarkToDelete.value = null
}

const cancelDelete = () => {
  isDeleteConfirmOpen.value = false
  bookmarkToDelete.value = null
}

const handleBookmarkClick = (url) => {
  window.open(url, '_blank')
}

const handleGroupClick = (group) => {
  selectedGroup.value = group
}

// 拖拽相关方法
const handleDragStart = (index) => {
  draggedIndex.value = index
}

const handleDragOver = (e, index) => {
  e.preventDefault()
  if (draggedIndex.value === null || draggedIndex.value === index) return
  
  // 交换书签位置
  const draggedBookmark = filteredBookmarks.value[draggedIndex.value]
  const targetBookmark = filteredBookmarks.value[index]
  
  // 在原始数组中找到并交换
  const draggedOrigIndex = bookmarks.value.findIndex(b => b.id === draggedBookmark.id)
  const targetOrigIndex = bookmarks.value.findIndex(b => b.id === targetBookmark.id)
  
  if (draggedOrigIndex !== -1 && targetOrigIndex !== -1) {
    const temp = bookmarks.value[draggedOrigIndex]
    bookmarks.value[draggedOrigIndex] = bookmarks.value[targetOrigIndex]
    bookmarks.value[targetOrigIndex] = temp
    draggedIndex.value = index
    saveBookmarks()
  }
}

const handleDragEnd = () => {
  draggedIndex.value = null
}

const toggleGroupDropdown = () => {
  if (isGroupDropdownOpen.value) {
    isGroupDropdownOpen.value = false
  } else {
    updateDropdownPosition()
    isGroupDropdownOpen.value = true
  }
}

const updateDropdownPosition = () => {
  if (groupInputRef.value) {
    const rect = groupInputRef.value.getBoundingClientRect()
    dropdownStyle.value = {
      top: `${rect.bottom + window.scrollY}px`,
      left: `${rect.left + window.scrollX}px`,
      width: `${rect.width}px`
    }
  }
}

const selectGroup = (group) => {
  formData.value.group = group
  isGroupDropdownOpen.value = false
}

const handleClickOutside = (event) => {
  if (
    groupDropdownRef.value && !groupDropdownRef.value.contains(event.target) &&
    (!teleportedDropdownRef.value || !teleportedDropdownRef.value.contains(event.target)) &&
    (!groupInputRef.value || !groupInputRef.value.contains(event.target))
  ) {
    isGroupDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div :class="['w-full max-w-2xl', props.class || '']">
    <!-- Bookmarks Grid -->
    <div
      ref="gridContainer"
      class="grid grid-cols-4 gap-3 bookmarks-grid-height overflow-y-auto pr-1 pb-20 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
    >
      <!-- Add Bookmark Button -->
      <button
        @click="openAddModal"
        class="aero-glass aero-border rounded-xl p-3 flex flex-col items-center justify-center gap-1 hover:bg-white/25 transition-all min-h-[80px]"
      >
        <Plus class="w-5 h-5 text-white/70" />
        <span class="text-white/60 text-xs">添加</span>
      </button>

      <!-- Bookmark Items -->
      <div
        v-for="(bookmark, index) in filteredBookmarks"
        :key="bookmark.id"
        :draggable="!searchQuery"
        :class="[
          'group aero-glass aero-border rounded-xl p-3 flex flex-col items-center justify-center gap-1 hover:bg-white/25 transition-all cursor-pointer min-h-[80px] relative',
          draggedIndex === index ? 'opacity-50 scale-95' : ''
        ]"
        @click="handleBookmarkClick(bookmark.url)"
        @dragstart="handleDragStart(index)"
        @dragover="handleDragOver($event, index)"
        @dragend="handleDragEnd"
      >
        <div class="flex items-center gap-1 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            @click.stop="openEditModal(bookmark)"
            class="p-1 hover:bg-white/20 rounded"
          >
            <Edit2 class="w-3 h-3 text-white/70" />
          </button>
          <button
            @click.stop="handleDeleteBookmark(bookmark)"
            class="p-1 hover:bg-white/20 rounded"
          >
            <X class="w-3 h-3 text-white/70" />
          </button>
        </div>
        <div class="flex items-center gap-1 absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
          <button
            class="p-1 hover:bg-white/20 rounded cursor-grab active:cursor-grabbing"
            @dragstart="handleDragStart(index)"
          >
            <Grip class="w-3 h-3 text-white/50" />
          </button>
        </div>
        <span class="text-white text-xs font-medium truncate w-full text-center px-2">{{ bookmark.name }}</span>
        <span class="text-white/40 text-[10px] truncate w-full text-center px-2" v-if="bookmark.description">{{ bookmark.description }}</span>
        <span class="text-white/40 text-[10px]" v-else-if="bookmark.group">{{ bookmark.group }}</span>
      </div>
    </div>
  </div>

  <!-- Group Tags - Fixed at bottom -->
  <div class="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none">
    <div class="aero-glass aero-border rounded-full px-3 flex gap-2 flex-wrap justify-center items-center pointer-events-auto h-[44px] max-w-2xl overflow-x-auto scrollbar-hide relative">
      <div class="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/30 to-transparent pointer-events-none rounded-l-full"></div>
      <div class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/30 to-transparent pointer-events-none rounded-r-full"></div>
      <button
        v-for="group in groups"
        :key="group"
        @click="handleGroupClick(group)"
        :class="[
          'px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ease-out',
          selectedGroup === group
            ? 'bg-white/40 text-white shadow-lg aero-border'
            : 'text-white/70 hover:bg-white/20'
        ]"
      >
        {{ group }}
      </button>
    </div>
  </div>

  <!-- Delete Confirm Modal -->
  <Modal v-model:open="isDeleteConfirmOpen" title="确认删除">
    <div class="space-y-4">
      <div class="flex items-center gap-3 text-white/90">
        <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <X class="w-5 h-5 text-red-400" />
        </div>
        <div>
          <p class="text-sm">确定要删除书签 <span class="font-medium text-white">"{{ bookmarkToDelete?.name }}"</span> 吗？</p>
          <p class="text-xs text-white/50 mt-1">此操作无法撤销</p>
        </div>
      </div>
      <div class="flex gap-2 pt-2">
        <button
          @click="cancelDelete"
          class="flex-1 bg-white/10 hover:bg-white/20 text-white text-sm py-2 rounded-lg transition-colors"
        >
          取消
        </button>
        <button
          @click="confirmDelete"
          class="flex-1 bg-red-500/80 hover:bg-red-500 text-white text-sm py-2 rounded-lg transition-colors"
        >
          删除
        </button>
      </div>
    </div>
  </Modal>

  <!-- Edit Modal -->
  <Modal v-model:open="isModalOpen" :title="editingId ? '编辑书签' : '添加书签'">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-xs text-white/70 mb-1">名称</label>
        <input
          v-model="formData.name"
          type="text"
          placeholder="输入书签名称"
          class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15"
          required
        />
      </div>

      <div>
        <label class="block text-xs text-white/70 mb-1">网址</label>
        <input
          v-model="formData.url"
          type="text"
          placeholder="https://example.com"
          class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15"
          required
        />
      </div>

      <div>
        <label class="block text-xs text-white/70 mb-1">描述</label>
        <textarea
          v-model="formData.description"
          placeholder="输入书签描述（可选）"
          rows="2"
          maxlength="50"
          class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15 resize-none"
        />
        <p class="text-xs text-white/40 mt-1">最多 50 个字符</p>
      </div>

      <div>
        <label class="block text-xs text-white/70 mb-1">分组</label>
        <div class="relative" ref="groupDropdownRef">
          <input
            ref="groupInputRef"
            v-model="formData.group"
            type="text"
            placeholder="输入分组名称，如：常用、工作、娱乐（可选）"
            class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15 pr-10"
            @focus="updateDropdownPosition(); isGroupDropdownOpen = true"
          />
          <button
            type="button"
            @click.stop="toggleGroupDropdown"
            class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors"
          >
            <svg :class="['w-4 h-4 text-white/50 transition-transform', isGroupDropdownOpen ? 'rotate-180' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <!-- 下拉选项 (Teleport 到 body 避免被 modal overflow 裁剪) -->
          <Teleport to="body">
            <div
              ref="teleportedDropdownRef"
              v-if="isGroupDropdownOpen && groups.filter(g => g !== '默认').length > 0"
              :style="{ top: dropdownStyle.top, left: dropdownStyle.left, width: dropdownStyle.width }"
              class="absolute z-[9999] mt-1 bg-gray-900/95 backdrop-blur border border-white/20 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto"
            >
              <button
                v-for="group in groups.filter(g => g !== '默认')"
                :key="group"
                type="button"
                @click="selectGroup(group)"
                :class="[
                  'w-full px-3 py-2 text-left text-sm transition-colors',
                  formData.group === group ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                ]"
              >
                {{ group }}
              </button>
            </div>
          </Teleport>
        </div>
        <p class="text-xs text-white/40 mt-1">可选，留空则归类为默认分组</p>
      </div>

      <div class="flex gap-2 pt-2">
        <button
          type="button"
          @click="isModalOpen = false"
          class="flex-1 bg-white/10 hover:bg-white/20 text-white text-sm py-2 rounded-lg transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          class="flex-1 bg-white/30 hover:bg-white/40 text-white text-sm py-2 rounded-lg transition-colors"
        >
          {{ editingId ? '保存' : '添加' }}
        </button>
      </div>
    </form>
  </Modal>
</template>
