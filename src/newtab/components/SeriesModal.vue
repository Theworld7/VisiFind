<script setup>
import { ref, watch, computed } from 'vue'
import { X, Upload, Image as ImageIcon } from 'lucide-vue-next'

const props = defineProps({
  series: {
    type: Object,
    default: null,
  },
  open: {
    type: Boolean,
    default: false,
  },
  categories: {
    type: Array,
    default: () => ['全部'],
  },
})

const emit = defineEmits(['update:open', 'save'])

// Form data
const formData = ref({
  name: '',
  coverImage: '',
  totalEpisodes: '',
  watchedEpisodes: 0,
  category: '',
  status: 'watching',
  notes: '',
})

// Image handling
const imageInput = ref(null)
const imagePreview = ref('')
const imageError = ref('')

// ============ COMBOBOX PATTERN (EXACT COPY FROM BOOKMARKS.VUE) ============
const isGroupDropdownOpen = ref(false)
const groupDropdownRef = ref(null)
const groupInputRef = ref(null)
const teleportedDropdownRef = ref(null)
const dropdownStyle = ref({ top: '0px', left: '0px', width: '0px' })

// Status options
const statusOptions = [
  { value: 'watching', label: '追剧中' },
  { value: 'completed', label: '已看完' },
  { value: 'dropped', label: '弃了' },
]

// Filtered categories (exclude '全部')
const availableCategories = computed(() => props.categories.filter(c => c !== '全部'))

// Watch for edit target
watch(
  () => props.series,
  (newSeries) => {
    if (newSeries) {
      formData.value = {
        name: newSeries.name || '',
        coverImage: newSeries.coverImage || '',
        totalEpisodes: newSeries.totalEpisodes || '',
        watchedEpisodes: newSeries.watchedEpisodes || 0,
        category: newSeries.category || '',
        status: newSeries.status || 'watching',
        notes: newSeries.notes || '',
      }
      imagePreview.value = newSeries.coverImage || ''
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// Reset form
function resetForm() {
  formData.value = {
    name: '',
    coverImage: '',
    totalEpisodes: '',
    watchedEpisodes: 0,
    category: '',
    status: 'watching',
    notes: '',
  }
  imagePreview.value = ''
  imageError.value = ''
  isGroupDropdownOpen.value = false
}

// Image handling
function handleImageSelect() {
  imageInput.value?.click()
}

function handleFileChange(event) {
  const file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    imageError.value = '请选择图片文件'
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    imageError.value = '图片大小不能超过 5MB'
    return
  }

  imageError.value = ''
  const reader = new FileReader()
  reader.onload = (e) => {
    formData.value.coverImage = e.target.result
    imagePreview.value = e.target.result
  }
  reader.readAsDataURL(file)
  event.target.value = ''
}

function useImageUrl() {
  const url = prompt('请输入图片 URL：')
  if (url) {
    formData.value.coverImage = url
    imagePreview.value = url
    imageError.value = ''
  }
}

// ============ COMBOBOX METHODS (EXACT COPY FROM BOOKMARKS.VUE) ============
function toggleGroupDropdown() {
  if (isGroupDropdownOpen.value) {
    isGroupDropdownOpen.value = false
  } else {
    updateDropdownPosition()
    isGroupDropdownOpen.value = true
  }
}

function updateDropdownPosition() {
  if (groupInputRef.value) {
    const rect = groupInputRef.value.getBoundingClientRect()
    dropdownStyle.value = {
      top: `${rect.bottom + window.scrollY}px`,
      left: `${rect.left + window.scrollX}px`,
      width: `${rect.width}px`,
    }
  }
}

function selectGroup(group) {
  formData.value.category = group
  isGroupDropdownOpen.value = false
}

function handleClickOutside(event) {
  if (
    groupDropdownRef.value && !groupDropdownRef.value.contains(event.target) &&
    (!teleportedDropdownRef.value || !teleportedDropdownRef.value.contains(event.target)) &&
    (!groupInputRef.value || !groupInputRef.value.contains(event.target))
  ) {
    isGroupDropdownOpen.value = false
  }
}

// Add/remove click outside listener
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    setTimeout(() => document.addEventListener('click', handleClickOutside), 0)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

// Save
function handleSave() {
  if (!formData.value.name.trim()) {
    alert('请输入系列名称')
    return
  }

  emit('save', {
    ...formData.value,
    totalEpisodes: formData.value.totalEpisodes ? Number(formData.value.totalEpisodes) : null,
    watchedEpisodes: Number(formData.value.watchedEpisodes) || 0,
  })

  emit('update:open', false)
  resetForm()
}

function handleClose() {
  emit('update:open', false)
  resetForm()
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="open" class="fixed inset-0 z-[100] flex items-center justify-center">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="handleClose"
        ></div>

        <!-- Modal Content -->
        <div
          class="relative w-full max-w-lg mx-4 aero-glass aero-border rounded-2xl shadow-2xl overflow-hidden"
          @click.stop
        >
          <!-- Header -->
          <div class="flex items-center justify-between p-5 border-b border-white/10">
            <h2 class="text-base font-semibold text-white">
              {{ series ? '编辑' : '追剧' }}
            </h2>
            <button
              class="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
              @click="handleClose"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Form -->
          <div class="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
            <!-- Cover Image -->
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">封面图片</label>
              <div class="space-y-3">
                <!-- Preview -->
                <div
                  v-if="imagePreview"
                  class="relative w-full h-40 rounded-lg overflow-hidden bg-black/20 aero-border"
                >
                  <img
                    :src="imagePreview"
                    alt="预览"
                    class="w-full h-full object-cover"
                    @error="imageError = '图片加载失败'"
                  />
                  <button
                    type="button"
                    class="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 hover:bg-red-600 text-white transition-colors"
                    @click="() => { imagePreview = ''; formData.coverImage = ''; }"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>

                <!-- Upload Buttons -->
                <div v-else class="flex gap-3">
                  <button
                    type="button"
                    class="flex-1 py-3 px-4 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center justify-center gap-2"
                    @click="handleImageSelect"
                  >
                    <Upload class="w-5 h-5" />
                    <span>上传图片</span>
                  </button>
                  <button
                    type="button"
                    class="flex-1 py-3 px-4 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all flex items-center justify-center gap-2"
                    @click="useImageUrl"
                  >
                    <ImageIcon class="w-5 h-5" />
                    <span>使用 URL</span>
                  </button>
                </div>
                <p v-if="imageError" class="text-sm text-red-400">{{ imageError }}</p>
                <input
                  ref="imageInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleFileChange"
                />
              </div>
            </div>

            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                系列名称 <span class="text-red-400">*</span>
              </label>
              <input
                v-model="formData.name"
                type="text"
                placeholder="请输入系列名称"
                class="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
              />
            </div>

            <!-- Episodes -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">总集数</label>
                <input
                  v-model="formData.totalEpisodes"
                  type="number"
                  min="1"
                  placeholder="24"
                  class="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">已看集数</label>
                <input
                  v-model="formData.watchedEpisodes"
                  type="number"
                  min="0"
                  placeholder="12"
                  class="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <!-- Status -->
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">观看状态</label>
              <div class="flex gap-4">
                <label
                  v-for="option in statusOptions"
                  :key="option.value"
                  class="flex items-center gap-2 cursor-pointer group"
                >
                  <div class="relative">
                    <input
                      v-model="formData.status"
                      type="radio"
                      :value="option.value"
                      class="peer sr-only"
                    />
                    <div
                      class="w-4 h-4 rounded-full border-2 border-white/40 peer-checked:border-white peer-checked:bg-white transition-all"
                      :class="{
                        'peer-checked:bg-blue-400': option.value === 'watching',
                        'peer-checked:bg-green-400': option.value === 'completed',
                        'peer-checked:bg-red-400': option.value === 'dropped'
                      }"
                    ></div>
                  </div>
                  <span class="text-white group-hover:text-white/80 transition-colors text-sm">
                    {{ option.label }}
                  </span>
                </label>
              </div>
            </div>

            <!-- Category (COMBOBOX - EXACT COPY FROM BOOKMARKS.VUE) -->
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">分类</label>
              <div class="relative" ref="groupDropdownRef">
                <input
                  ref="groupInputRef"
                  v-model="formData.category"
                  type="text"
                  placeholder="输入或选择分类名称"
                  class="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15 pr-10"
                  @focus="updateDropdownPosition(); isGroupDropdownOpen = true"
                />
                <button
                  type="button"
                  @click.stop="toggleGroupDropdown"
                  class="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <svg
                    :class="['w-4 h-4 text-white/50 transition-transform', isGroupDropdownOpen ? 'rotate-180' : '']"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <!-- Teleported Dropdown -->
                <Teleport to="body">
                  <div
                    ref="teleportedDropdownRef"
                    v-if="isGroupDropdownOpen && availableCategories.length > 0"
                    :style="{ top: dropdownStyle.top, left: dropdownStyle.left, width: dropdownStyle.width }"
                    class="absolute z-[9999] mt-1 bg-gray-900/95 backdrop-blur border border-white/20 rounded-lg shadow-xl overflow-hidden max-h-48 overflow-y-auto"
                  >
                    <button
                      v-for="cat in availableCategories"
                      :key="cat"
                      type="button"
                      @click="selectGroup(cat)"
                      :class="[
                        'w-full px-3 py-2 text-left text-sm transition-colors',
                        formData.category === cat ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                      ]"
                    >
                      {{ cat }}
                    </button>
                  </div>
                </Teleport>
              </div>
              <p class="text-xs text-white/40 mt-1">可选，输入新分类或从已有分类中选择</p>
            </div>

            <!-- Notes -->
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">备注</label>
              <textarea
                v-model="formData.notes"
                placeholder="添加备注（可选）"
                rows="2"
                class="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all resize-none"
              ></textarea>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex gap-3 p-5 border-t border-white/10 bg-black/20">
            <button
              type="button"
              class="flex-1 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-all aero-border"
              @click="handleClose"
            >
              取消
            </button>
            <button
              type="button"
              class="flex-1 py-2.5 rounded-lg aero-glass aero-border bg-white/30 hover:bg-white/40 text-white font-medium transition-all"
              @click="handleSave"
            >
              {{ series ? '保存' : '追剧' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
@import '../styles/aero.css';

.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95) translateY(-10px);
}
</style>
