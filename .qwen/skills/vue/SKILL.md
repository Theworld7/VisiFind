# Vue 3 最佳实践技能

本技能提供 Vue 3 + Vite + TypeScript 项目的最佳实践指导。

## 核心原则

### 1. 组件设计
- 使用 `<script setup>` 语法糖
- 优先使用 Composition API
- 单一职责原则，组件保持小而专注
- Props 单向数据流，使用 emits 向上传递事件

### 2. 响应式数据
```vue
<script setup>
import { ref, reactive, computed, watch } from 'vue'

// 基本类型用 ref
const count = ref(0)

// 对象用 reactive
const state = reactive({ name: 'Vue' })

// 派生状态用 computed
const doubleCount = computed(() => count.value * 2)

// 副作用用 watch
watch(count, (newVal) => {
  console.log(`count changed to ${newVal}`)
})
</script>
```

### 3. Props 定义
```vue
<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 0
  },
  items: {
    type: Array,
    default: () => []
  }
})
</script>
```

### 4. 事件发射
```vue
<script setup>
import { defineEmits } from 'vue'

const emit = defineEmits({
  // 验证事件
  submit: (payload) => {
    return payload !== null
  },
  close: null // 无验证
})

const handleClose = () => {
  emit('close')
}
</script>
```

### 5. 组件通信模式
- 父子：props / emits
- 兄弟：提升到共同父组件
- 跨层级：provide / inject
- 全局状态：Pinia

### 6. Pinia 状态管理
```js
// stores/counter.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)
  
  function increment() {
    count.value++
  }
  
  return { count, doubleCount, increment }
})
```

### 7. 路由最佳实践
```js
// router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '首页', requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})
```

### 8. 性能优化
- 使用 `v-memo` 缓存模板部分
- 大列表使用虚拟滚动
- 路由懒加载：`component: () => import('...')`
- 避免在模板中创建对象/数组
- 使用 `ShallowRef` / `ShallowReactive` 优化深层对象

### 9. 代码规范
- 组件名使用 PascalCase
- Props 名使用 camelCase
- 使用 `.vue` 单文件组件
- 按顺序组织选项：
  1. `<script setup>`
  2. `<template>`
  3. `<style scoped>`

### 10. 样式最佳实践
- 使用 `scoped` 样式
- 优先使用 CSS 变量
- 配合 Tailwind CSS 实用类
- 避免深层嵌套选择器

## 常用命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 类型检查
npx vue-tsc --noEmit

# 代码检查
npm run lint
```

## 推荐 VS Code 扩展

- Volar (Vue Language Features)
- Vue - Official
- ESLint
- Prettier
- Tailwind CSS IntelliSense

## 项目结构建议

```
src/
├── assets/          # 静态资源
├── components/      # 通用组件
│   ├── ui/         # UI 基础组件
│   └── layout/     # 布局组件
├── composables/     # 组合式函数
├── views/          # 页面组件
├── router/         # 路由配置
├── stores/         # Pinia stores
├── lib/            # 工具函数
├── utils/          # 辅助函数
├── App.vue
└── main.js
```

## 禁用此技能

在对话中说 "跳过 vue 技能" 或 "不使用最佳实践" 即可临时禁用。
