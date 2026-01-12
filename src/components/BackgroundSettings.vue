<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  show: boolean
  backgroundUrl: string
  backgroundInputMode: 'none' | 'upload' | 'url'
  backgroundUrlInput: string
  backgroundBlur: number
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'update:backgroundUrl', value: string): void
  (e: 'update:backgroundInputMode', value: 'none' | 'upload' | 'url'): void
  (e: 'update:backgroundUrlInput', value: string): void
  (e: 'update:backgroundBlur', value: number): void
  (e: 'save', data: { backgroundUrl: string; backgroundInputMode: string; backgroundBlur: number }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 临时变量，用于表单预览
const tempBackgroundUrl = ref('')
const tempUrlInput = ref('')
const tempBlur = ref(0)
const tempInputMode = ref<'none' | 'upload' | 'url'>('none')

// 监听弹窗打开，同步初始值
watch(
  () => props.show,
  (val) => {
    if (val) {
      tempBackgroundUrl.value = props.backgroundUrl
      tempUrlInput.value = props.backgroundUrlInput
      tempBlur.value = props.backgroundBlur
      tempInputMode.value = props.backgroundInputMode
      // 如果是 URL 模式，直接使用 backgroundUrl 作为输入框的值
      if (props.backgroundInputMode === 'url' && props.backgroundUrl) {
        tempUrlInput.value = props.backgroundUrl
      }
    }
  }
)

// 预览使用的值
const previewMode = computed(() => tempInputMode.value)

const backgroundFileInput = ref<HTMLInputElement | null>(null)

const handleBackgroundUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      tempBackgroundUrl.value = e.target?.result as string
      tempInputMode.value = 'upload'
    }
    reader.readAsDataURL(file)
  }
}

const close = () => {
  emit('update:show', false)
}

const save = () => {
  // 将数据传递给父组件处理
  // URL 模式使用 tempUrlInput，upload 模式使用 tempBackgroundUrl
  const url = tempInputMode.value === 'url' ? tempUrlInput.value : tempBackgroundUrl.value
  emit('save', {
    backgroundUrl: url,
    backgroundInputMode: tempInputMode.value,
    backgroundBlur: tempBlur.value,
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="close">
        <div class="modal-content">
          <h3>背景设置</h3>
          <div class="mode-switch">
            <n-radio-group v-model:value="tempInputMode" name="backgroundType">
              <n-radio-button value="none">无背景</n-radio-button>
              <n-radio-button value="url">在线图片</n-radio-button>
              <n-radio-button value="upload">上传图片</n-radio-button>
            </n-radio-group>
            <input
              ref="backgroundFileInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleBackgroundUpload"
            />
          </div>
          <!-- 上传预览 -->
          <div v-if="previewMode === 'upload' && tempBackgroundUrl" class="form-group">
            <label>预览</label>
            <div class="bg-preview">
              <img :src="tempBackgroundUrl" alt="背景预览" />
            </div>
          </div>
          <!-- URL输入 - 无背景模式不显示 -->
          <div v-if="previewMode !== 'none'" class="form-group">
            <label>图片URL</label>
            <n-input
              v-model:value="tempUrlInput"
              placeholder="输入图片链接（如 https://...）"
            />
            <!-- URL预览 - 只在URL模式且有填写URL时显示 -->
            <div v-if="previewMode === 'url' && tempUrlInput" class="bg-preview" style="margin-top: 12px">
              <img :src="tempUrlInput" alt="背景预览" />
            </div>
          </div>
          <!-- 模糊效果 -->
          <div v-if="previewMode !== 'none'" class="form-group">
            <label>模糊效果</label>
            <n-select
              v-model:value="tempBlur"
              :options="[
                { label: '无模糊', value: 0 },
                { label: '轻微模糊', value: 5 },
                { label: '中等模糊', value: 10 },
                { label: '强模糊', value: 20 }
              ]"
            />
          </div>
          <div class="modal-actions">
            <button class="btn-cancel" @click="close">取消</button>
            <button class="btn-save" @click="save">应用</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin: 0 0 16px;
  color: var(--text-primary);
}

.mode-switch {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-secondary);
  font-size: 14px;
}

.form-group input[type="text"],
.form-group select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input[type="text"]:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color);
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

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-cancel,
.btn-save {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-cancel {
  background: var(--bg-light);
  color: var(--text-secondary);
}

.btn-cancel:hover {
  background: var(--bg-lighter);
}

.btn-save {
  background: var(--primary-color);
  color: #fff;
}

.btn-save:hover {
  opacity: 0.9;
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.2s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.95);
}
</style>
