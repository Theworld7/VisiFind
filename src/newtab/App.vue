<script setup>
import { ref, onMounted, provide } from 'vue'
import { useBingImage } from './composables/useBingImage'
import { useSearch } from './composables/useSearch'
import { useSettings } from './composables/useSettings'
import { useTheme } from './composables/useTheme'
import { setSetting, getSetting, setAppSetting, getAppSetting } from './lib/db'
import Header from './components/Header.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import './styles/aero.css'

const settingsOpen = ref(false)
const { getCachedWallpaper, shouldRefresh } = useBingImage()
const searchState = useSearch()
const { bgMode, imageUrl, uploadedImage, onlineImageUrl, loadSettings } = useSettings()
const { isDark } = useTheme()

// 提供 searchState 给子组件
provide('searchState', searchState)

const bgImage = ref('')

// 获取当前日期字符串 YYYY-MM-DD
const getCurrentDate = () => {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

// 检查是否需要刷新 Bing 壁纸
const shouldRefreshBingImage = async () => {
  const savedDate = await getAppSetting('lastVisitDate')
  const currentDate = getCurrentDate()

  // 如果没有缓存日期或日期不同，返回 true
  return savedDate !== currentDate
}

// 更新保存的日期
const saveCurrentDate = async () => {
  const currentDate = getCurrentDate()
  await setAppSetting('lastVisitDate', currentDate)
}

onMounted(async () => {
  await loadSettings()
  await searchState.loadSearchEngines()

  const mode = bgMode.value
  if (mode === 'bing') {
    // 检查是否有恢复的壁纸 URL
    const restoredImageUrl = await getAppSetting('restoredBingImageUrl')

    if (restoredImageUrl) {
      // 使用恢复的壁纸 URL
      bgImage.value = restoredImageUrl
      imageUrl.value = restoredImageUrl
      await setSetting('imageUrl', restoredImageUrl)
      await setAppSetting('restoredBingImageUrl', null) // 清除恢复标记
      await saveCurrentDate()
    } else {
      // 没有恢复的壁纸，检查日期是否需要刷新
      const shouldRefreshDate = await shouldRefreshBingImage()

      if (shouldRefreshDate) {
        // 日期变化，获取新壁纸（会缓存到 IndexedDB）
        bgImage.value = await getCachedWallpaper(false)
        await saveCurrentDate()
      } else {
        // 日期未变化，优先使用缓存（快速渲染）
        const needRefresh = await shouldRefresh()

        if (needRefresh) {
          // 没有缓存，需要获取新壁纸
          bgImage.value = await getCachedWallpaper(false)
        } else {
          // 有今天的缓存，直接使用
          bgImage.value = await getCachedWallpaper(false)
        }
      }
    }
  } else if (mode === 'online') {
    bgImage.value = onlineImageUrl.value
  } else if (mode === 'upload') {
    bgImage.value = uploadedImage.value
  }
})

const handleSettingsClick = () => {
  settingsOpen.value = true
}

const handleSettingsChange = async (data) => {
  if (data.mode === 'bing') {
    // 强制刷新壁纸
    bgImage.value = await getCachedWallpaper(true)
  } else if (data.mode === 'online' || data.mode === 'upload') {
    bgImage.value = data.imageUrl
  } else {
    bgImage.value = ''
  }
}
</script>

<template>
  <div
    class="fixed inset-0 -z-10"
    :class="{ 'is-dark': isDark, 'bg-overlay-dark': isDark }"
    :style="bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
  >
    <!-- 默认渐变背景（壁纸加载前显示） -->
    <div v-if="!bgImage" class="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950"></div>
  </div>

  <div class="min-h-screen" :class="{ 'is-dark': isDark }">
    <Header @settings-click="handleSettingsClick" />

    <SettingsDialog
      v-model:open="settingsOpen"
      @change="handleSettingsChange"
    />

    <RouterView />
  </div>
</template>
