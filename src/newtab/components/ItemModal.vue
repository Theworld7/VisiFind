<script setup>
import { ref, watch, onMounted } from 'vue'
import { X, Upload, Image as ImageIcon } from 'lucide-vue-next'

const props = defineProps({
  /**
   * 编辑的物品数据（为空表示新增）
   */
  item: {
    type: Object,
    default: null,
  },
  /**
   * 是否显示
   */
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:open', 'save'])

// 表单数据
const formData = ref({
  name: '',
  image: '',
  price: '',
  purchaseDate: '',
  inService: true,
})

// 图片上传处理
const imageInput = ref(null)
const imagePreview = ref('')
const imageError = ref('')

// 监听编辑物品变化
watch(
  () => props.item,
  (newItem) => {
    if (newItem) {
      formData.value = {
        name: newItem.name || '',
        image: newItem.image || '',
        price: newItem.price || '',
        purchaseDate: newItem.purchaseDate ? newItem.purchaseDate.split('T')[0] : '',
        inService: newItem.inService ?? true,
      }
      imagePreview.value = newItem.image || ''
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// 重置表单
function resetForm() {
  formData.value = {
    name: '',
    image: '',
    price: '',
    purchaseDate: '',
    inService: true,
  }
  imagePreview.value = ''
  imageError.value = ''
}

// 选择图片文件
function handleImageSelect() {
  imageInput.value?.click()
}

// 处理文件上传
function handleFileChange(event) {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    imageError.value = '请选择图片文件'
    return
  }

  // 验证文件大小（最大 5MB）
  if (file.size > 5 * 1024 * 1024) {
    imageError.value = '图片大小不能超过 5MB'
    return
  }

  imageError.value = ''

  // 读取文件为 Base64
  const reader = new FileReader()
  reader.onload = (e) => {
    const base64 = e.target.result
    formData.value.image = base64
    imagePreview.value = base64
  }
  reader.onerror = () => {
    imageError.value = '图片读取失败'
  }
  reader.readAsDataURL(file)

  // 清空 input 以便重复选择同一文件
  event.target.value = ''
}

// 使用在线图片 URL
function useImageUrl() {
  const url = prompt('请输入图片 URL：')
  if (url) {
    formData.value.image = url
    imagePreview.value = url
    imageError.value = ''
  }
}

// 保存
function handleSave() {
  // 验证必填字段
  if (!formData.value.name.trim()) {
    alert('请输入物品名称')
    return
  }

  if (!formData.value.price || formData.value.price <= 0) {
    alert('请输入有效的购入价格')
    return
  }

  if (!formData.value.purchaseDate) {
    alert('请选择购入时间')
    return
  }

  emit('save', {
    ...formData.value,
    price: Number(formData.value.price),
  })

  emit('update:open', false)
  resetForm()
}

// 关闭
function handleClose() {
  emit('update:open', false)
  resetForm()
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="open" class="fixed inset-0 z-[100] flex items-center justify-center">
        <!-- 遮罩 -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          @click="handleClose"
        ></div>

        <!-- 弹窗内容 -->
        <div
          class="relative w-full max-w-lg mx-4 aero-glass aero-border rounded-2xl shadow-2xl overflow-hidden"
          @click.stop
        >
          <!-- 头部 -->
          <div class="flex items-center justify-between p-5 border-b border-white/10">
            <h2 class="text-xl font-semibold text-white">
              {{ item ? '编辑物品' : '添加物品' }}
            </h2>
            <button
              class="p-2 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
              @click="handleClose"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- 表单 -->
          <div class="p-5 space-y-5">
            <!-- 图片上传 -->
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                物品图片
              </label>
              <div class="space-y-3">
                <!-- 预览区域 -->
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
                    @click="() => { imagePreview = ''; formData.image = ''; }"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </div>

                <!-- 上传按钮 -->
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

                <!-- 错误提示 -->
                <p v-if="imageError" class="text-sm text-red-400">{{ imageError }}</p>

                <!-- 隐藏的文件输入 -->
                <input
                  ref="imageInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleFileChange"
                />
              </div>
            </div>

            <!-- 名称 -->
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                物品名称 <span class="text-red-400">*</span>
              </label>
              <input
                v-model="formData.name"
                type="text"
                placeholder="请输入物品名称"
                class="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
              />
            </div>

            <!-- 价格和时间 -->
            <div class="grid grid-cols-2 gap-4">
              <!-- 价格 -->
              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">
                  购入价格 <span class="text-red-400">*</span>
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">¥</span>
                  <input
                    v-model="formData.price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    class="w-full pl-8 pr-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <!-- 购入时间 -->
              <div>
                <label class="block text-sm font-medium text-white/80 mb-2">
                  购入时间 <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="formData.purchaseDate"
                  type="date"
                  class="w-full px-4 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <!-- 服役状态 -->
            <div>
              <label class="block text-sm font-medium text-white/80 mb-2">
                服役状态
              </label>
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer group">
                  <div class="relative">
                    <input
                      v-model="formData.inService"
                      type="radio"
                      :value="true"
                      class="peer sr-only"
                    />
                    <div class="w-4 h-4 rounded-full border-2 border-white/40 peer-checked:border-white peer-checked:bg-white transition-all"></div>
                    <div class="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                      <div class="w-1.5 h-1.5 rounded-full bg-black"></div>
                    </div>
                  </div>
                  <span class="text-white group-hover:text-white/80 transition-colors">服役中</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer group">
                  <div class="relative">
                    <input
                      v-model="formData.inService"
                      type="radio"
                      :value="false"
                      class="peer sr-only"
                    />
                    <div class="w-4 h-4 rounded-full border-2 border-white/40 peer-checked:border-white peer-checked:bg-white transition-all"></div>
                    <div class="absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                      <div class="w-1.5 h-1.5 rounded-full bg-black"></div>
                    </div>
                  </div>
                  <span class="text-white group-hover:text-white/80 transition-colors">已退役</span>
                </label>
              </div>
            </div>
          </div>

          <!-- 底部按钮 -->
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
              {{ item ? '保存修改' : '添加物品' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
@import '../styles/aero.css';

/* 弹窗过渡动画 */
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

.modal-enter-to .relative,
.modal-leave-from .relative {
  transform: scale(1) translateY(0);
}
</style>
