# Vue 3 最佳实践技能

本技能提供 Vue 3 + Vite + Tailwind CSS 项目的最佳实践指导。

## 核心原则

### 1. 组件设计
- ✅ 使用 `<script setup>` 语法糖
- ✅ 优先使用 Composition API
- ✅ 单一职责原则，组件保持小而专注
- ✅ Props 单向数据流，使用 emits 向上传递事件
- ✅ 组件名使用 PascalCase

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

### 5. v-model 最佳实践
```vue
<!-- Vue 3.3+ 使用 defineModel -->
<script setup>
const model = defineModel('open', { type: Boolean, default: false })
</script>

<template>
  <Modal v-model:open="model" title="设置">
```

### 6. 组件通信模式
- 父子：props / emits
- 兄弟：提升到共同父组件
- 跨层级：provide / inject
- 全局状态：Pinia

### 7. Pinia 状态管理
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

### 8. 路由最佳实践
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

### 9. 性能优化
- ✅ 使用 `computed` 缓存计算结果
- ✅ 大列表使用虚拟滚动
- ✅ 路由懒加载：`component: () => import('...')`
- ✅ 避免在模板中创建对象/数组
- ✅ 使用 `shallowRef` / `shallowReactive` 优化深层对象
- ✅ v-for 必须绑定 :key

### 10. 代码规范
```vue
<!-- 推荐的组件结构顺序 -->
<script setup>
// 1. imports
import { ref } from 'vue'
import Component from './Component.vue'

// 2. props/emit
const props = defineProps({...})
const emit = defineEmits([...])

// 3. 响应式数据
const state = ref()

// 4. 计算属性
const computedValue = computed(() => {})

// 5. 方法
const handleClick = () => {}

// 6. 生命周期
onMounted(() => {})
</script>

<template>
  <!-- 模板内容 -->
</template>

<style scoped>
/* 样式 */
</style>
```

### 11. 样式最佳实践
- ✅ 使用 `scoped` 样式
- ✅ 优先使用 CSS 变量
- ✅ 配合 Tailwind CSS 实用类
- ✅ 避免深层嵌套选择器
- ✅ 全局样式放在单独 CSS 文件

### 12. 错误处理
```vue
<script setup>
const fetchData = async () => {
  try {
    const res = await fetch('/api/data')
    const data = await res.json()
    return data
  } catch (e) {
    console.error('Fetch failed:', e)
    // 显示错误提示
  }
}
</script>
```

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
├── styles/         # 全局样式
├── App.vue
└── main.js
```

## 常见反模式 ⚠️

```vue
<!-- ❌ 避免：在模板中创建对象 -->
<template>
  <div :style="{ color: 'red' }"></div>
</template>

<!-- ✅ 推荐：使用计算属性 -->
<script setup>
const style = computed(() => ({ color: 'red' }))
</script>

<!-- ❌ 避免：v-for 不带 key -->
<div v-for="item in items">{{ item }}</div>

<!-- ✅ 推荐：绑定唯一 key -->
<div v-for="item in items" :key="item.id">{{ item }}</div>

<!-- ❌ 避免：直接修改 prop -->
props.count++

<!-- ✅ 推荐：使用 emits -->
emit('update:count', props.count + 1)
```

## 推荐 VS Code 扩展

- Volar (Vue Language Features)
- Vue - Official
- ESLint
- Prettier
- Tailwind CSS IntelliSense

## 常用命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 类型检查（如使用 TypeScript）
npx vue-tsc --noEmit

# 代码检查
npm run lint
```

## 禁用此技能

在对话中说 "跳过 vue 技能" 或 "不使用最佳实践" 即可临时禁用。
