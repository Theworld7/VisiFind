import { ref } from 'vue'

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
 * 获取 Bing 每日壁纸
 * @param {boolean} highRes - 是否返回高分辨率图片
 * @returns {Promise<string>} 图片 URL
 */
export function useBingImage() {
  const imageUrl = ref('')
  const loading = ref(false)
  const error = ref(null)

  const getBingImageUrl = () => {
    return BING_API_URL
  }

  // 使用代理获取数据
  const fetchWithProxy = async (url, proxy) => {
    const proxiedUrl = proxy + encodeURIComponent(url)
    const res = await fetch(proxiedUrl, {
      // 设置超时
      signal: AbortSignal.timeout(10000)
    })
    
    if (!res.ok) {
      throw new Error(`Proxy failed with status ${res.status}`)
    }
    
    return res
  }

  const fetchBingImage = async (highRes = true) => {
    loading.value = true
    error.value = null

    try {
      // 开发环境直接使用 Vite 代理
      if (isDev) {
        const res = await fetch(BING_API_URL)
        const data = await res.json()

        if (data?.images?.[0]?.url) {
          let url = 'https://www.bing.com' + data.images[0].url
          if (highRes) {
            url = url.replace('&pid=hp', '&pid=hp&w=3840&h=2160&rs=1&qlt=100')
          }
          imageUrl.value = url
          return url
        }
        throw new Error('No image found')
      }

      // 生产环境：尝试多个代理直到成功
      for (const proxy of CORS_PROXIES) {
        try {
          const res = await fetchWithProxy(BING_API_URL, proxy)
          const data = await res.json()

          if (data?.images?.[0]?.url) {
            let url = 'https://www.bing.com' + data.images[0].url
            if (highRes) {
              url = url.replace('&pid=hp', '&pid=hp&w=3840&h=2160&rs=1&qlt=100')
            }
            imageUrl.value = url
            return url
          }
        } catch (e) {
          console.log(`Proxy ${proxy} failed:`, e.message)
          continue
        }
      }

      throw new Error('All proxies failed')
    } catch (e) {
      console.error('Failed to fetch Bing image:', e)
      error.value = e
      // 使用默认壁纸
      imageUrl.value = 'https://picsum.photos/3840/2160'
      return imageUrl.value
    } finally {
      loading.value = false
    }
  }

  const fetchPreview = async () => {
    try {
      // 开发环境直接使用 Vite 代理
      if (isDev) {
        const res = await fetch(BING_API_URL)
        const data = await res.json()
        if (data?.images?.[0]?.url) {
          return 'https://www.bing.com' + data.images[0].url.replace('&pid=hp', '&pid=hp&w=640&h=360')
        }
      }

      // 生产环境：尝试多个代理
      for (const proxy of CORS_PROXIES) {
        try {
          const res = await fetchWithProxy(BING_API_URL, proxy)
          const data = await res.json()
          if (data?.images?.[0]?.url) {
            return 'https://www.bing.com' + data.images[0].url.replace('&pid=hp', '&pid=hp&w=640&h=360')
          }
        } catch (e) {
          continue
        }
      }
    } catch (e) {
      console.error('Failed to fetch Bing preview:', e)
    }
    return 'https://picsum.photos/640/360'
  }

  return {
    imageUrl,
    loading,
    error,
    fetchBingImage,
    fetchPreview
  }
}
