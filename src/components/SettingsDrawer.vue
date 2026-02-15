<script setup lang="ts">
import { computed } from 'vue'
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
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()

const {
  backgroundUrl,
  backgroundInputMode,
  backgroundBlur,
  backgroundColor,
  backgroundStyle,
  saveSettings,
  updateBackground,
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
  updateBackground({
    backgroundUrl: url,
    backgroundInputMode: formValue.value.mode,
    backgroundBlur: formValue.value.blur,
    backgroundColor: formValue.value.color,
  })
  closeSettings()
}

const blurOptions = [
  { label: '无模糊', value: 0 },
  { label: '轻微模糊', value: 5 },
  { label: '中等模糊', value: 10 },
  { label: '强模糊', value: 20 },
]

const handleDrawerShow = (show: boolean) => {
  if (show) {
    syncFormWithSettings(
      backgroundInputMode.value,
      backgroundUrl.value,
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
        <n-button block @click="appStore.doTriggerImport()"> 导入备份 </n-button>
        <n-button block @click="appStore.doExportData()"> 导出备份 </n-button>
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
