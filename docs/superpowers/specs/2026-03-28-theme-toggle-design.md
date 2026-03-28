# 明暗模式切换功能设计

## 概述

在设置按钮左侧添加明暗模式切换功能，支持跟随系统主题和手动切换，所有毛玻璃效果元素根据主题自动切换对应的毛玻璃样式，暗色模式时在背景图片上添加渐变遮罩调暗壁纸。

---

## 用户行为

- **主题选择策略**：跟随系统 + 手动切换。首次加载时跟随系统设置，用户可手动切换，切换后记住用户偏好。
- **暗色模式遮罩**：半透明黑色渐变遮罩，从顶部到底部透明度 40% → 60%。
- **图标方案**：Sun/Moon 图标切换，浅色模式显示 Moon，暗色模式显示 Sun。
- **过渡动画**：0.3s 平滑过渡。

---

## 设计方案

### 1. 主题状态管理

新建 `src/newtab/composables/useTheme.js`：

**初始化逻辑**：
1. 检查 IndexedDB 是否有用户手动设置的主题偏好
2. 如果有 → 使用用户偏好
3. 如果没有 → 监听 `prefers-color-scheme` media query

**导出内容**：
- `theme` — ref，值为 `'light'` 或 `'dark'`
- `isDark` — computed，基于 theme 判断
- `toggleTheme()` — 切换主题并持久化到 IndexedDB
- `initTheme()` — 初始化主题监听

### 2. 背景遮罩层

在 `App.vue` 的背景 div 上，根据 `isDark` 动态添加遮罩 class：

```html
<div :class="isDark ? 'bg-overlay-dark' : ''"
  :style="bgImage ? { backgroundImage: `url(${bgImage})`, ... } : {}"
/>
```

`bg-overlay-dark` 样式（新增到 `aero.css`）：
```css
.bg-overlay-dark {
  background-color: rgba(0, 0, 0, 0.4);
  background-blend-mode: overlay;
}
```

### 3. 毛玻璃效果主题变体

修改 `src/newtab/styles/aero.css`，为现有毛玻璃类添加暗色模式变体：

**变体策略**：通过 CSS 变量实现，不需要改变组件中的 class 名。

```css
/* 现有 .aero-glass 保持不变（深色玻璃） */

/* 暗色模式下使用更深的背景 */
:root.is-dark .aero-glass {
  background: linear-gradient(
    to bottom,
    rgba(10, 10, 10, 0.25) 0%,
    rgba(5, 5, 5, 0.2) 50%,
    rgba(10, 10, 10, 0.25) 100%
  );
}

/* .aero-glass-light 在暗色模式下自动适配 */
:root.is-dark .aero-glass-light {
  background: linear-gradient(
    to bottom,
    rgba(20, 20, 20, 0.3) 0%,
    rgba(15, 15, 15, 0.2) 50%,
    rgba(20, 20, 20, 0.3) 100%
  );
}

/* .modal-content 暗色模式变体 */
:root.is-dark .modal-content {
  background: rgba(10, 10, 10, 0.85);
}

/* .modal-backdrop 暗色模式变体 */
:root.is-dark .modal-backdrop {
  background: rgba(0, 0, 0, 0.6);
}
```

**主题 class 应用位置**：`App.vue` 根 div 添加动态 class：
```html
<div :class="{ 'is-dark': isDark }">
```

### 4. 主题切换按钮

在 `Header.vue` 设置按钮左侧添加 Moon/Sun 切换按钮：

```html
<button
  class="p-1.5 rounded-full hover:bg-white/20 transition-all text-white/90 hover:text-white aero-hover flex-shrink-0"
  @click="theme.toggleTheme()"
>
  <Sun v-if="theme.isDark" class="w-4 h-4" />
  <Moon v-else class="w-4 h-4" />
</button>
```

需要引入 lucide-vue-next 的 Sun 和 Moon 图标。

### 5. IndexedDB 持久化

在 `src/newtab/lib/db.js` 中添加主题相关 key：
- `theme` — 用户手动设置的主题偏好（`'light'` | `'dark'` | `null`）

---

## 组件变更清单

| 组件/文件 | 变更类型 |
|-----------|---------|
| `src/newtab/composables/useTheme.js` | 新建 |
| `src/newtab/lib/db.js` | 修改：添加 theme 读写方法 |
| `src/newtab/styles/aero.css` | 修改：添加暗色模式 CSS 变体 |
| `src/newtab/App.vue` | 修改：引入 useTheme，应用 is-dark class 和背景遮罩 |
| `src/newtab/components/Header.vue` | 修改：添加主题切换按钮 |

### 需检查的组件（无需强制修改）

以下组件使用公共毛玻璃类，无需修改即可自动响应主题：

- `SettingsDialog.vue` — 使用 `.aero-glass` + `.modal-content`
- `Modal.vue` — 使用 `.modal-backdrop` + `.modal-content`
- `SeriesModal.vue` — 使用 `.modal-content`
- `ItemModal.vue` — 使用 `.modal-content`
- `Bookmarks.vue` — 使用 `.aero-glass`
- `DocumentList.vue` — 使用 `.aero-glass`
- 其他使用公共类的组件

---

## 技术细节

### 过渡动画

在 `aero.css` 中添加全局过渡：
```css
.aero-glass,
.aero-glass-light,
.modal-content,
.modal-backdrop {
  transition: background 0.3s ease, box-shadow 0.3s ease;
}
```

### 系统主题监听

使用 `window.matchMedia('(prefers-color-scheme: dark)')` 监听系统主题变化：

```js
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
mediaQuery.addEventListener('change', (e) => {
  if (!userPreference) {
    theme.value = e.matches ? 'dark' : 'light'
  }
})
```

---

## 实施顺序

1. 创建 `useTheme.js` composable
2. 修改 `db.js` 添加 theme 持久化
3. 修改 `aero.css` 添加暗色模式变体
4. 修改 `App.vue` 应用主题 class
5. 修改 `Header.vue` 添加切换按钮
