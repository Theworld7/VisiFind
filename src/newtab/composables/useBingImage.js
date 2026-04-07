import { ref } from 'vue'
import { getWallpaperCache, setWallpaperCache, isWallpaperCacheValid, getSetting, setSetting } from '../lib/db'

// 开发环境使用 Vite 代理，生产环境使用 CORS 代理
const isDev = import.meta.env.DEV
const BING_API_URL = isDev
  ? '/bing-api?format=js&idx=0&n=1&mkt=en-US'
  : 'https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=en-US'

// 备用 CORS 代理列表
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest='
]

/**
 * 获取当前日期字符串 (YYYY-MM-DD)
 */
const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0]
}

/**
 * 使用代理获取数据
 */
const fetchWithProxy = async (url, proxy) => {
  const proxiedUrl = proxy + encodeURIComponent(url)
  const res = await fetch(proxiedUrl, {
    signal: AbortSignal.timeout(10000)
  })

  if (!res.ok) {
    throw new Error(`Proxy failed with status ${res.status}`)
  }

  return res
}

/**
 * 获取 Bing 每日壁纸 URL
 * @param {boolean} highRes - 是否返回高分辨率图片
 * @returns {Promise<string>} 图片 URL
 */
const getBingImageUrl = (highRes = true) => {
  return BING_API_URL
}

/**
 * 处理 Bing API 返回的图片 URL
 * @param {string} url - 原始 URL
 * @param {boolean} highRes - 是否返回高分辨率
 * @returns {string} 处理后的 URL
 */
const processImageUrl = (url, highRes = true) => {
  let processedUrl = 'https://www.bing.com' + url
  if (highRes) {
    processedUrl = processedUrl.replace('&pid=hp', '&pid=hp&w=3840&h=2160&rs=1&qlt=100')
  }
  return processedUrl
}

/**
 * 获取预览尺寸的 URL
 * @param {string} url - 原始 URL
 * @returns {string} 预览尺寸的 URL
 */
const getPreviewUrl = (url) => {
  return 'https://www.bing.com' + url.replace('&pid=hp', '&pid=hp&w=640&h=360')
}

/**
 * 从 API 获取壁纸 URL
 * @param {boolean} highRes - 是否获取高分辨率
 * @returns {Promise<{url: string, previewUrl: string}>}
 */
const fetchBingApiUrl = async (highRes = true) => {
  // 开发环境直接使用 Vite 代理
  if (isDev) {
    const res = await fetch(BING_API_URL)
    const data = await res.json()

    if (data?.images?.[0]?.url) {
      const url = processImageUrl(data.images[0].url, highRes)
      const previewUrl = getPreviewUrl(data.images[0].url)
      return { url, previewUrl }
    }
    throw new Error('No image found')
  }

  // 生产环境：尝试多个代理直到成功
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await fetchWithProxy(BING_API_URL, proxy)
      const data = await res.json()

      if (data?.images?.[0]?.url) {
        const url = processImageUrl(data.images[0].url, highRes)
        const previewUrl = getPreviewUrl(data.images[0].url)
        return { url, previewUrl }
      }
    } catch (e) {
      console.log(`Proxy ${proxy} failed:`, e.message)
      continue
    }
  }

  throw new Error('All proxies failed')
}

/**
 * 将图片 URL 转换为 Blob
 * @param {string} url - 图片 URL
 * @returns {Promise<Blob>}
 */
const fetchImageAsBlob = async (url) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
  if (!res.ok) {
    throw new Error(`Failed to fetch image: ${res.status}`)
  }
  return res.blob()
}

/**
 * 使用 Bing 每日壁纸
 */
export function useBingImage() {
  const imageUrl = ref('')
  const loading = ref(false)
  const error = ref(null)

  /**
   * 获取带缓存的壁纸 URL（优先从缓存读取）
   * @param {boolean} forceRefresh - 是否强制刷新
   * @returns {Promise<string>} 壁纸 URL (Object URL 或缓存的 URL)
   */
  const getCachedWallpaper = async (forceRefresh = false) => {
    const today = getCurrentDate()

    // 检查是否有今天的有效缓存
    if (!forceRefresh) {
      const fullCache = await getWallpaperCache('full')
      if (fullCache && fullCache.cachedDate === today && fullCache.blob) {
        console.log('Using cached wallpaper')
        // 将 Blob 转换为 Object URL
        const objectUrl = URL.createObjectURL(fullCache.blob)
        imageUrl.value = objectUrl
        return objectUrl
      }
    }

    // 需要获取新壁纸
    loading.value = true
    error.value = null

    try {
      // 获取壁纸 URL
      const { url: fullUrl, previewUrl } = await fetchBingApiUrl(true)

      // 下载全尺寸图片并缓存
      try {
        const blob = await fetchImageAsBlob(fullUrl)
        await setWallpaperCache('full', fullUrl, blob, today)

        // 下载预览图并缓存（用于 Modal 预览）
        const previewBlob = await fetchImageAsBlob(previewUrl)
        await setWallpaperCache('preview', previewUrl, previewBlob, today)
      } catch (cacheError) {
        console.warn('Failed to cache wallpaper, using URL directly:', cacheError)
      }

      imageUrl.value = fullUrl
      // 保存 URL 到 settings
      await setSetting('imageUrl', fullUrl)

      return fullUrl
    } catch (e) {
      console.error('Failed to fetch Bing image:', e)
      error.value = e

      // 尝试使用旧缓存
      const oldCache = await getWallpaperCache('full')
      if (oldCache && oldCache.blob) {
        const objectUrl = URL.createObjectURL(oldCache.blob)
        imageUrl.value = objectUrl
        return objectUrl
      }

      // 回退到默认壁纸
      imageUrl.value = 'https://picsum.photos/3840/2160'
      return imageUrl.value
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取带缓存的预览图 URL（用于 Modal 预览）
   * @param {string} fallbackUrl - 备用的 URL（通常是已保存的壁纸 URL）
   * @returns {Promise<string>} 预览图 URL
   */
  const getCachedPreview = async (fallbackUrl = '') => {
    const today = getCurrentDate()

    // 检查是否有今天的预览缓存
    const previewCache = await getWallpaperCache('preview')
    if (previewCache && previewCache.cachedDate === today && previewCache.blob) {
      console.log('Using cached preview')
      return URL.createObjectURL(previewCache.blob)
    }

    // 检查全尺寸缓存
    const fullCache = await getWallpaperCache('full')
    if (fullCache && fullCache.cachedDate === today && fullCache.blob) {
      console.log('Generating preview from cached full image')
      return URL.createObjectURL(fullCache.blob)
    }

    // 如果有保存的 URL，转换为预览尺寸
    if (fallbackUrl) {
      return fallbackUrl.replace('&w=3840&h=2160&rs=1&qlt=100', '&w=640&h=360')
    }

    // 尝试从 API 获取预览
    try {
      const { previewUrl } = await fetchBingApiUrl(false)
      return previewUrl
    } catch (e) {
      console.error('Failed to fetch preview:', e)
      return 'https://picsum.photos/640/360'
    }
  }

  /**
   * 检查是否需要刷新壁纸
   * @returns {Promise<boolean>}
   */
  const shouldRefresh = async () => {
    const cacheValid = await isWallpaperCacheValid('full')
    return !cacheValid
  }

  /**
   * 清除所有壁纸缓存
   */
  const clearCache = async () => {
    const db = await (await import('../lib/db')).openDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('wallpaperCache', 'readwrite')
      const store = transaction.objectStore('wallpaperCache')
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  // 保留旧的 API 以保持向后兼容
  const fetchBingImage = async (highRes = true) => {
    return getCachedWallpaper()
  }

  const fetchPreview = async () => {
    const savedUrl = await getSetting('imageUrl')
    return getCachedPreview(savedUrl)
  }

  return {
    imageUrl,
    loading,
    error,
    fetchBingImage,
    fetchPreview,
    getCachedWallpaper,
    getCachedPreview,
    shouldRefresh,
    clearCache
  }
}
