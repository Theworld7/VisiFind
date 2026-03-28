import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '../style.css'
import 'highlight.js/styles/atom-one-dark.css'
import { migrateFoodLibraryFromLocalStorage } from './lib/intakeDb.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')

// 错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue error:', err, info)
}

// 数据迁移
migrateFoodLibraryFromLocalStorage()

if (import.meta.hot) {
  import.meta.hot.accept()
}
