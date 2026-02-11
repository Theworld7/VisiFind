import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive from 'naive-ui'

import '@/styles/reset.css'
import '@/styles/global.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(naive, {
  colors: {
    primary: '#9CA3AF',
  },
})

app.mount('#app')
