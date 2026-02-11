<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FormInst } from 'naive-ui'

interface Props {
  show: boolean
  backgroundUrl: string
  backgroundInputMode: 'color' | 'upload' | 'url'
  backgroundUrlInput: string
  backgroundBlur: number
  backgroundColor: string
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'update:backgroundUrl', value: string): void
  (e: 'update:backgroundInputMode', value: 'color' | 'upload' | 'url'): void
  (e: 'update:backgroundUrlInput', value: string): void
  (e: 'update:backgroundBlur', value: number): void
  (e: 'update:backgroundColor', value: string): void
  (
    e: 'save',
    data: {
      backgroundUrl: string
      backgroundInputMode: string
      backgroundBlur: number
      backgroundColor: string
    },
  ): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 表单数据
const formValue = ref({
  mode: 'color' as 'color' | 'upload' | 'url',
  url: '',
  blur: 0,
  color: '#1a1a2e',
})

// 临时变量，用于上传图片数据
const tempBackgroundUrl = ref('')

// 预览使用的值
const previewMode = computed(() => formValue.value.mode)

// 选择图片按钮文字
const selectFileButtonText = computed(() => (tempBackgroundUrl.value ? '重新选择图片' : '选择图片'))

// 监听弹窗打开，同步初始值
watch(
  () => props.show,
  (val) => {
    if (val) {
      tempBackgroundUrl.value = props.backgroundUrl
      formValue.value.mode = props.backgroundInputMode
      formValue.value.url = props.backgroundInputMode === 'url' ? props.backgroundUrl : ''
      formValue.value.blur = props.backgroundBlur
      formValue.value.color = props.backgroundColor
    }
  },
)

const backgroundFileInput = ref<HTMLInputElement | null>(null)

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

const close = () => {
  emit('update:show', false)
}

const save = () => {
  const url = formValue.value.mode === 'url' ? formValue.value.url : tempBackgroundUrl.value
  emit('save', {
    backgroundUrl: url,
    backgroundInputMode: formValue.value.mode,
    backgroundBlur: formValue.value.blur,
    backgroundColor: formValue.value.color,
  })
}
</script>

<template>
  <n-modal v-model:show="props.show" preset="card" title="背景设置" style="width: 400px">
    <n-form ref="formRef" :model="formValue">
      <!-- 背景模式选择 -->
      <n-form-item label="背景模式" path="mode">
        <div class="mode-switch">
          <n-radio-group v-model:value="formValue.mode" name="backgroundType">
            <n-radio-button value="color">色彩背景</n-radio-button>
            <n-radio-button value="url">在线图片</n-radio-button>
            <n-radio-button value="upload">上传图片</n-radio-button>
          </n-radio-group>
        </div>
      </n-form-item>
      <!-- 颜色选择器 - 色彩背景模式显示 -->
      <n-form-item v-if="previewMode === 'color'" label="选择颜色" path="color">
        <n-color-picker
          v-model:value="formValue.color"
          :show-alpha="true"
          :modes="['hex', 'rgb', 'hsl']"
          :swatches="['#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560', '#ffffff', '#000000']"
        />
      </n-form-item>
      <!-- 颜色预览 - 色彩背景模式显示 -->
      <div v-if="previewMode === 'color'" class="form-group">
        <div class="form-label">预览</div>
        <div class="color-preview" :style="{ backgroundColor: formValue.color }"></div>
      </div>
      <!-- 选择图片按钮 - 上传模式显示 -->
      <n-form-item v-if="previewMode === 'upload'" label="选择图片">
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
      <div
        v-if="previewMode === 'upload' && tempBackgroundUrl"
        class="form-group"
        style="margin-bottom: 16px"
      >
        <div class="form-label">预览</div>
        <div class="bg-preview">
          <img :src="tempBackgroundUrl" alt="背景预览" />
        </div>
      </div>
      <!-- URL输入 - 在线图片模式显示 -->
      <n-form-item v-if="previewMode === 'url'" label="图片URL" path="url">
        <n-input v-model:value="formValue.url" placeholder="输入图片链接（如 https://...）" />
      </n-form-item>
      <!-- URL预览 - 在线图片模式且有URL时显示 -->
      <n-form-item
        v-if="previewMode === 'url' && formValue.url"
        path="url"
        style="margin-bottom: 16px"
      >
        <div class="bg-preview">
          <img :src="formValue.url" alt="背景预览" />
        </div>
      </n-form-item>
      <!-- 模糊效果 - 非色彩背景模式显示 -->
      <n-form-item v-if="previewMode !== 'color'" label="模糊效果" path="blur">
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
    <template #footer>
      <n-space reverse>
        <n-button type="primary" @click="save">应用</n-button>
        <n-button @click="close">取消</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped>
.color-preview {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  border: 2px solid var(--bg-white-30);
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
