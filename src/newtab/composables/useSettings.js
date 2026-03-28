import { ref, onMounted } from 'vue'
import { getSetting, setSetting } from '../lib/db'

/**
 * 设置管理组合式函数
 * @returns {Object} 设置相关状态和方法
 */
export function useSettings() {
  const bgMode = ref('bing')
  const imageUrl = ref('')
  const uploadedImage = ref(null)
  const onlineImageUrl = ref('')

  const loadSettings = async () => {
    const [mode, url, uploaded, onlineUrl] = await Promise.all([
      getSetting('bgMode'),
      getSetting('imageUrl'),
      getSetting('uploadedImage'),
      getSetting('onlineImageUrl')
    ])

    if (mode) bgMode.value = mode
    if (url) imageUrl.value = url
    if (uploaded) uploadedImage.value = uploaded
    if (onlineUrl) onlineImageUrl.value = onlineUrl
  }

  const setBgMode = async (mode) => {
    bgMode.value = mode
    await setSetting('bgMode', mode)
  }

  const setImageUrl = async (url) => {
    imageUrl.value = url
    onlineImageUrl.value = url
    await setSetting('imageUrl', url)
    await setSetting('onlineImageUrl', url)
  }

  const setUploadedImage = async (image) => {
    uploadedImage.value = image
    await setSetting('uploadedImage', image)
  }

  const getBgImageUrl = () => {
    if (bgMode.value === 'upload') return uploadedImage.value
    if (bgMode.value === 'online') return onlineImageUrl.value
    return imageUrl.value
  }

  return {
    bgMode,
    imageUrl,
    uploadedImage,
    onlineImageUrl,
    loadSettings,
    setBgMode,
    setImageUrl,
    setUploadedImage,
    getBgImageUrl
  }
}
