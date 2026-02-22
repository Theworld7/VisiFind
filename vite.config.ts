import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // GitHub Pages 部署时使用 /VisiFind/，其他情况使用相对路径
  const base = mode === 'github-pages' ? '/VisiFind/' : './'

  return {
    base,
    plugins: [vue(), vueDevTools()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/bing-api': {
          target: 'https://www.bing.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/bing-api/, ''),
        },
      },
    },
  }
})
