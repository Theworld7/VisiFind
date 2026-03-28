# 明暗模式切换功能实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在设置按钮左侧添加明暗模式切换功能，支持跟随系统 + 手动切换，所有毛玻璃效果元素根据主题自动切换样式，暗色模式时在背景图片上添加渐变遮罩。

**Architecture:** 使用 CSS 变量 + 动态 class 方案。`useTheme.js` composable 管理主题状态（监听系统主题 + 持久化用户偏好），`aero.css` 中通过 `:root.is-dark` 选择器定义暗色模式变体，所有毛玻璃组件自动响应主题变化。

**Tech Stack:** Vue 3 Composition API, IndexedDB (现有), lucide-vue-next icons

---

## 文件变更概览

| 文件 | 职责 |
|------|------|
| `src/newtab/composables/useTheme.js` | 新建：主题状态管理、监听系统主题、持久化偏好 |
| `src/newtab/styles/aero.css` | 修改：添加暗色模式变体样式、过渡动画 |
| `src/newtab/App.vue` | 修改：应用 `is-dark` class 到根元素，添加背景遮罩 |
| `src/newtab/components/Header.vue` | 修改：添加主题切换按钮（Sun/Moon 图标） |

---

## Task 1: 创建 useTheme.js Composable

**Files:**
- Create: `src/newtab/composables/useTheme.js`

- [ ] **Step 1: 创建 useTheme.js**

```javascript
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getSetting, setSetting } from '../lib/db'

const THEME_KEY = 'theme'

export function useTheme() {
  const theme = ref('light') // 'light' | 'dark'
  let mediaQuery = null

  // 计算属性：是否暗色模式
  const isDark = computed(() => theme.value === 'dark')

  // 初始化主题
  const initTheme = async () => {
    // 1. 检查用户是否有手动设置
    const savedTheme = await getSetting(THEME_KEY)

    if (savedTheme) {
      theme.value = savedTheme
    } else {
      // 2. 没有用户偏好，跟随系统
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      theme.value = prefersDark ? 'dark' : 'light'
    }

    // 3. 监听系统主题变化
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', handleSystemThemeChange)
  }

  // 处理系统主题变化
  const handleSystemThemeChange = (e) => {
    // 只有在用户没有手动设置时才跟随系统
    getSetting(THEME_KEY).then(saved => {
      if (!saved) {
        theme.value = e.matches ? 'dark' : 'light'
      }
    })
  }

  // 切换主题
  const toggleTheme = async () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    await setSetting(THEME_KEY, theme.value)
  }

  // 清理
  const cleanup = () => {
    if (mediaQuery) {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }

  onMounted(() => {
    initTheme()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    theme,
    isDark,
    toggleTheme,
    initTheme,
  }
}
```

- [ ] **Step 2: 验证文件创建成功**

---

## Task 2: 修改 aero.css 添加暗色模式变体

**Files:**
- Modify: `src/newtab/styles/aero.css`

- [ ] **Step 1: 在 aero.css 末尾添加暗色模式变体样式**

在现有 `.aero-glass` 等样式之后添加：

```css
/* ============ 暗色模式变体 ============ */

/* 全局过渡 */
.aero-glass,
.aero-glass-light,
.modal-content,
.modal-backdrop,
.bg-overlay-dark {
  transition: background 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease;
}

/* 暗色模式：更深的毛玻璃背景 */
:root.is-dark .aero-glass {
  background: linear-gradient(
    to bottom,
    rgba(10, 10, 10, 0.3) 0%,
    rgba(5, 5, 5, 0.25) 50%,
    rgba(10, 10, 10, 0.3) 100%
  );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
}

/* 暗色模式：浅色毛玻璃变暗 */
:root.is-dark .aero-glass-light {
  background: linear-gradient(
    to bottom,
    rgba(20, 20, 20, 0.4) 0%,
    rgba(15, 15, 15, 0.3) 50%,
    rgba(20, 20, 20, 0.4) 100%
  );
  box-shadow:
    0 0 20px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
}

/* 暗色模式：Modal 内容变暗 */
:root.is-dark .modal-content {
  background: rgba(10, 10, 10, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.7),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* 暗色模式：Modal 遮罩加暗 */
:root.is-dark .modal-backdrop {
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
}

/* 暗色模式：滚动条变暗 */
:root.is-dark ::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
}

:root.is-dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}

/* 暗色模式：毛玻璃边框变暗 */
:root.is-dark .aero-border {
  border: 1px solid rgba(0, 0, 0, 0.3);
  border-top-color: rgba(0, 0, 0, 0.4);
}

/* 暗色模式：按钮悬停光晕调暗 */
:root.is-dark .aero-hover:hover {
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.4);
}

/* 暗色模式：文字投影加强 */
:root.is-dark .aero-text {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

/* ============ 背景渐变遮罩 ============ */

/* 暗色模式背景遮罩：半透明黑色渐变 */
.bg-overlay-dark {
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0.6) 100%
  );
}
```

- [ ] **Step 2: 验证 CSS 语法正确**

---

## Task 3: 修改 App.vue 应用主题 class

**Files:**
- Modify: `src/newtab/App.vue`

- [ ] **Step 1: 引入 useTheme 并应用到根元素**

修改 `script setup` 部分：

```javascript
import { ref, onMounted, provide, computed } from 'vue'
// ... 现有导入 ...
import { useTheme } from './composables/useTheme' // 新增

const settingsOpen = ref(false)
const { fetchBingImage } = useBingImage()
const searchState = useSearch()
const { bgMode, imageUrl, uploadedImage, onlineImageUrl, loadSettings } = useSettings()
const { isDark } = useTheme() // 新增

const bgImage = ref('')
```

修改 `template` 中的背景 div：

```html
<!-- 原有背景 div，添加 is-dark class 和暗色遮罩 -->
<div
  class="fixed inset-0 -z-10"
  :class="{ 'is-dark': isDark, 'bg-overlay-dark': isDark }"
  :style="bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}"
></div>
```

修改 `<div class="min-h-screen">` 为：

```html
<div class="min-h-screen" :class="{ 'is-dark': isDark }">
```

- [ ] **Step 2: 验证主题 class 应用正确**

---

## Task 4: 修改 Header.vue 添加主题切换按钮

**Files:**
- Modify: `src/newtab/components/Header.vue`

- [ ] **Step 1: 添加 Sun 和 Moon 图标导入**

```javascript
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Settings, Sun, Moon } from 'lucide-vue-next' // 新增 Sun, Moon
import { useTheme } from '../composables/useTheme' // 新增

const route = useRoute()
const emit = defineEmits(['settings-click'])
const { isDark, toggleTheme } = useTheme() // 新增
```

- [ ] **Step 2: 在设置按钮左侧添加主题切换按钮**

在设置按钮（`<button class="p-1.5 rounded-full ..." @click="emit('settings-click')">`）之前添加：

```html
<!-- 主题切换按钮 -->
<button
  class="p-1.5 rounded-full hover:bg-white/20 transition-all text-white/90 hover:text-white aero-hover flex-shrink-0"
  @click="toggleTheme"
>
  <Sun v-if="isDark" class="w-4 h-4" />
  <Moon v-else class="w-4 h-4" />
</button>

<!-- 分隔线 -->
<div class="w-px h-5 bg-white/30 flex-shrink-0"></div>
```

- [ ] **Step 3: 验证按钮显示正确**

---

## Task 5: 最终验证

- [ ] **Step 1: 检查所有文件修改是否完整**
- [ ] **Step 2: 确认 useTheme 在 App.vue 和 Header.vue 中都能正常工作**
- [ ] **Step 3: 测试主题切换功能**

手动测试步骤：
1. 打开应用，观察是否正确识别系统主题
2. 点击主题切换按钮，观察 Sun/Moon 图标切换
3. 观察所有毛玻璃元素是否平滑过渡到暗色样式
4. 刷新页面，确认用户偏好已持久化
5. 检查暗色模式下背景是否有渐变遮罩效果

---

## 实施顺序

1. Task 1: 创建 useTheme.js
2. Task 2: 修改 aero.css
3. Task 3: 修改 App.vue
4. Task 4: 修改 Header.vue
5. Task 5: 最终验证
