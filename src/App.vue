<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import {
  NDrawer,
  NDrawerContent,
  NButton,
  NColorPicker,
  NConfigProvider,
  NGlobalStyle,
} from 'naive-ui'
import '@/styles/variables.css'
import settingIcon from '@/assets/setting.svg'
import BackgroundSettings from '@/components/BackgroundSettings.vue'

const backgroundUrl = ref('')
const backgroundInputMode = ref<'color' | 'upload' | 'url'>('color')
const showBackgroundModal = ref(false)
const backgroundUrlInput = ref('')
const backgroundBlur = ref(0)
const backgroundColor = ref('#1a1a2e')

const showSettingsDrawer = ref(false)

const formValue = ref({
  mode: 'color' as 'color' | 'upload' | 'url',
  url: '',
  blur: 0,
  color: '#1a1a2e',
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
  backgroundColor.value = formValue.value.color
  saveBackgroundSettings()
  showSettingsDrawer.value = false
}

watch(showSettingsDrawer, (val) => {
  if (val) {
    tempBackgroundUrl.value = backgroundUrl.value
    formValue.value.mode = backgroundInputMode.value
    formValue.value.url = backgroundInputMode.value === 'url' ? backgroundUrl.value : ''
    formValue.value.blur = backgroundBlur.value
    formValue.value.color = backgroundColor.value
  }
})

const backgroundStyle = computed(() => {
  const style: Record<string, string> = {}
  if (backgroundInputMode.value === 'color') {
    style.backgroundColor = backgroundColor.value
    style.backgroundImage = 'none'
  } else if (backgroundUrl.value) {
    style.backgroundImage = `url(${backgroundUrl.value})`
  }
  style['--bg-blur'] = backgroundBlur.value ? `${backgroundBlur.value}px` : '0px'
  return style
})

const db = ref<IDBDatabase | null>(null)

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

const loadSettings = async () => {
  if (!db.value) return

  const transaction = db.value.transaction('settings', 'readonly')
  const store = transaction.objectStore('settings')

  const bgRequest = store.get('backgroundSettings')
  bgRequest.onsuccess = () => {
    if (bgRequest.result) {
      const settings = bgRequest.result.value
      if (settings.backgroundUrl !== undefined) {
        backgroundUrl.value = settings.backgroundUrl
      }
      if (settings.backgroundInputMode !== undefined) {
        backgroundInputMode.value = settings.backgroundInputMode
        if (backgroundInputMode.value === 'none') {
          backgroundInputMode.value = 'color'
          backgroundColor.value = '#1a1a2e'
        }
      }
      if (settings.backgroundBlur !== undefined) {
        backgroundBlur.value = settings.backgroundBlur
      }
      if (settings.backgroundColor !== undefined) {
        backgroundColor.value = settings.backgroundColor
      }
    }
  }
}

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
      backgroundColor: backgroundColor.value,
    },
  })
}

const handleBackgroundSave = (data: {
  backgroundUrl: string
  backgroundInputMode: string
  backgroundBlur: number
  backgroundColor: string
}) => {
  backgroundUrl.value = data.backgroundUrl
  backgroundInputMode.value = data.backgroundInputMode as typeof backgroundInputMode.value
  backgroundBlur.value = data.backgroundBlur
  backgroundColor.value = data.backgroundColor
  showBackgroundModal.value = false
  saveBackgroundSettings()
}

onMounted(async () => {
  await initDB()
  await loadSettings()
})
</script>

<template>
  <n-config-provider
    :theme-overrides="{
      common: {
        primaryColor: '#6B7280',
        primaryColorHover: '#9CA3AF',
        primaryColorPressed: '#4B5563',
        mergedTdColorHover: 'rgba(107, 114, 128, 0.25)',
      },
    }"
  >
    <n-global-style />
    <div
      class="fullscreen"
      :class="{ 'has-background': backgroundInputMode !== 'color' && backgroundUrl }"
      :style="backgroundStyle"
    >
      <nav class="top-nav">
        <router-link to="/search" class="nav-item">搜索</router-link>
        <router-link to="/health" class="nav-item">健康记录</router-link>
      </nav>

      <div class="action-buttons">
        <button class="action-btn" @click="showSettingsDrawer = true" title="设置">
          <img :src="settingIcon" alt="设置" />
        </button>
      </div>

      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>

      <BackgroundSettings
        v-model:show="showBackgroundModal"
        v-model:background-url="backgroundUrl"
        v-model:background-input-mode="backgroundInputMode"
        v-model:background-url-input="backgroundUrlInput"
        v-model:background-blur="backgroundBlur"
        v-model:background-color="backgroundColor"
        @save="handleBackgroundSave"
      />

      <NDrawer v-model:show="showSettingsDrawer" :width="400" placement="right">
        <NDrawerContent title="设置" closable>
          <n-form ref="formRef" :model="formValue">
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
              <n-button type="primary" @click="applySettings">应用</n-button>
              <n-button @click="showSettingsDrawer = false">关闭</n-button>
            </n-space>
          </template>
        </NDrawerContent>
      </NDrawer>
    </div>
  </n-config-provider>
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

.top-nav {
  position: absolute;
  top: 24px;
  left: 24px;
  display: flex;
  gap: 8px;
  z-index: 100;
  background: var(--bg-gray-15);
  backdrop-filter: blur(4px);
  padding: 6px;
  border-radius: 20px;
}

.nav-item {
  color: var(--text-white);
  text-decoration: none;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 16px;
  background: transparent;
  transition: all 0.2s;
}

.nav-item:hover {
  background: var(--bg-white-30);
}

.nav-item.router-link-active {
  background: #6b7280;
  color: #f3f4f6;
}

.action-buttons {
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
  gap: 8px;
  z-index: 100;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-gray-15);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-white);
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--bg-gray-25);
}

.action-btn img {
  width: 18px;
  height: 18px;
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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

  .top-nav {
    position: relative;
    top: 0;
    left: 0;
    margin-bottom: 16px;
    justify-content: center;
  }
}
</style>
