<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NDrawer,
  NDrawerContent,
  NButton,
  NColorPicker,
  NDivider,
  NSpace,
  NForm,
  NFormItem,
  NRadioGroup,
  NRadioButton,
  NInput,
  NSelect,
} from 'naive-ui'
import { useBackground } from '@/composables/useBackground'
import { useSettings } from '@/composables/useSettings'
import { useBookmarks } from '@/composables/useBookmarks'

const { exportData, importData } = useBookmarks()

const {
  backgroundUrl,
  backgroundInputMode,
  backgroundBlur,
  backgroundColor,
  backgroundStyle,
  bingWallpaperUrl,
  saveSettings,
  updateBackground,
  fetchBingWallpaper,
} = useBackground()

const {
  showSettingsDrawer,
  formValue,
  tempBackgroundUrl,
  backgroundFileInput,
  selectFileButtonText,
  triggerFileInput,
  handleBackgroundUpload,
  syncFormWithSettings,
  closeSettings,
} = useSettings()

const applySettings = () => {
  const url = formValue.value.mode === 'url' ? formValue.value.url : tempBackgroundUrl.value
  if (formValue.value.mode === 'bing') {
    backgroundUrl.value = tempBackgroundUrl.value
  }
  updateBackground({
    backgroundUrl: formValue.value.mode === 'bing' ? tempBackgroundUrl.value : url,
    backgroundInputMode: formValue.value.mode,
    backgroundBlur: formValue.value.blur,
    backgroundColor: formValue.value.color,
    bingWallpaperUrl: tempBackgroundUrl.value,
  })
  closeSettings()
}

const fileInputRef = ref<HTMLInputElement | null>(null)

const handleFileImport = async () => {
  const file = fileInputRef.value?.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)
      await importData(data)
      alert('导入成功')
    } catch (error) {
      alert('导入失败')
    }
  }
  reader.readAsText(file)
}

const blurOptions = [
  { label: '无模糊', value: 0 },
  { label: '轻微模糊', value: 5 },
  { label: '中等模糊', value: 10 },
  { label: '强模糊', value: 20 },
]

const bingLoading = ref(false)

const handleFetchBingWallpaper = async () => {
  bingLoading.value = true
  try {
    const url = await fetchBingWallpaper()
    tempBackgroundUrl.value = url
    formValue.value.mode = 'bing'
  } catch (error) {
    console.error('Failed to fetch Bing wallpaper:', error)
  } finally {
    bingLoading.value = false
  }
}

const handleDrawerShow = (show: boolean) => {
  if (show) {
    syncFormWithSettings(
      backgroundInputMode.value,
      backgroundInputMode.value === 'bing' ? bingWallpaperUrl.value : backgroundUrl.value,
      backgroundBlur.value,
      backgroundColor.value,
    )
  }
}
</script>

<template>
  <NDrawer
    v-model:show="showSettingsDrawer"
    :width="400"
    placement="right"
    @update:show="handleDrawerShow"
  >
    <NDrawerContent title="设置" closable>
      <n-form :model="formValue">
        <n-form-item label="背景模式" path="mode">
          <div class="mode-switch">
            <n-radio-group v-model:value="formValue.mode" name="backgroundType">
              <n-radio-button value="color">色彩背景</n-radio-button>
              <n-radio-button value="bing">必应壁纸</n-radio-button>
              <n-radio-button value="url">在线图片</n-radio-button>
              <n-radio-button value="upload">上传图片</n-radio-button>
            </n-radio-group>
          </div>
        </n-form-item>
        <n-form-item v-if="formValue.mode === 'color'" label="选择颜色" path="color">
          <n-color-picker
            v-model:value="formValue.color"
            :show-alpha="true"
            :modes="['hex', 'rgb', 'hsl']"
            :swatches="[
              '#1a1a2e',
              '#16213e',
              '#0f3460',
              '#533483',
              '#e94560',
              '#ffffff',
              '#000000',
            ]"
          />
        </n-form-item>
        <div v-if="formValue.mode === 'color'" class="form-group">
          <div class="form-label">预览</div>
          <div class="color-preview" :style="{ backgroundColor: formValue.color }"></div>
        </div>
        <n-form-item v-if="formValue.mode === 'bing'" label="必应每日壁纸">
          <n-button :loading="bingLoading" @click="handleFetchBingWallpaper"> 刷新壁纸 </n-button>
        </n-form-item>
        <div
          v-if="formValue.mode === 'bing' && tempBackgroundUrl"
          class="form-group"
          style="margin-bottom: 16px"
        >
          <div class="form-label">预览</div>
          <div class="bg-preview">
            <img :src="tempBackgroundUrl" alt="必应壁纸预览" />
          </div>
        </div>
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
        <div
          v-if="formValue.mode === 'upload' && tempBackgroundUrl"
          class="form-group"
          style="margin-bottom: 16px"
        >
          <div class="form-label">预览</div>
          <div class="bg-preview">
            <img :src="tempBackgroundUrl" alt="背景预览" />
          </div>
        </div>
        <n-form-item v-if="formValue.mode === 'url'" label="图片URL" path="url">
          <n-input v-model:value="formValue.url" placeholder="输入图片链接（如 https://...）" />
        </n-form-item>
        <n-form-item
          v-if="formValue.mode === 'url' && formValue.url"
          path="url"
          style="margin-bottom: 16px"
        >
          <div class="bg-preview">
            <img :src="formValue.url" alt="背景预览" />
          </div>
        </n-form-item>
        <n-form-item v-if="formValue.mode !== 'color'" label="模糊效果" path="blur">
          <n-select v-model:value="formValue.blur" :options="blurOptions" />
        </n-form-item>
      </n-form>

      <n-divider />

      <n-space vertical>
        <input
          ref="fileInputRef"
          type="file"
          accept=".json"
          style="display: none"
          @change="handleFileImport"
        />
        <n-button block @click="fileInputRef?.click()"> 导入备份 </n-button>
        <n-button block @click="exportData()"> 导出备份 </n-button>
      </n-space>

      <template #footer>
        <n-space reverse>
          <n-button type="primary" @click="applySettings">应用</n-button>
          <n-button @click="closeSettings">关闭</n-button>
        </n-space>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
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

.color-preview {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  border: 2px solid var(--bg-white-30);
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  color: var(--text-white);
  font-size: 14px;
  margin-bottom: 8px;
}
</style>
