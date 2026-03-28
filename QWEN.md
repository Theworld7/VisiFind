# VisiFind (寻迹)

## 项目概述

VisiFind 是一个 Chrome 浏览器扩展，用于自定义浏览器新标签页。提供美观的搜索界面、Bing 每日壁纸背景、多搜索引擎切换和书签管理功能。

### 技术栈

- **框架**: Vue 3 (Composition API + `<script setup>`)
- **构建工具**: Vite 7
- **状态管理**: Pinia
- **路由**: Vue Router (Hash 模式)
- **样式**: Tailwind CSS 4 + 自定义毛玻璃效果
- **UI 组件**: shadcn-vue
- **图标**: lucide-vue-next
- **数据存储**: IndexedDB (用于设置持久化)

## 构建与运行

```bash
# 开发模式
npm run dev

# 普通构建
npm run build

# 构建Chrome扩展 (生成到 dist 目录)
npm run build:extension
```

### 加载扩展

1. 运行 `npm run build:extension`
2. 打开 Chrome，访问 `chrome://extensions/`
3. 开启「开发者模式」
4. 点击「加载已解压的扩展程序」，选择 `dist` 目录
5. 打开新标签页即可看到扩展界面

## 项目结构

```
src/
├── main.js                    # index.html 入口 (开发预览用)
├── style.css                  # 全局样式和 Tailwind 主题变量
├── App.vue                    # index.html 根组件
├── components/                # 共享组件
│   └── HelloWorld.vue
└── newtab/                    # 新标签页应用 (扩展核心)
    ├── main.ts                # 入口文件
    ├── App.vue                # 根组件 (RouterView)
    ├── router/
    │   └── index.js           # 路由配置
    ├── views/
    │   └── HomeView.vue       # 主页面
    ├── components/
    │   ├── Header.vue         # 顶部导航
    │   ├── Bookmarks.vue      # 书签展示
    │   ├── Modal.vue          # 弹窗组件
    │   └── SettingsDialog.vue # 设置对话框
    ├── composables/           # Vue 组合式函数
    │   ├── useBingImage.js    # Bing 壁纸获取
    │   ├── useSearch.js       # 搜索功能
    │   └── useSettings.js     # 设置管理
    ├── lib/
    │   └── db.js              # IndexedDB 封装
    └── styles/
        └── aero.css           # 毛玻璃效果样式
```

## 核心功能

### 1. 背景模式
- **Bing 每日壁纸**: 自动获取 Bing 首页每日图片
- **在线图片**: 使用用户指定的在线图片 URL
- **本地上传**: 上传本地图片作为背景

### 2. 搜索引擎
- 支持多搜索引擎切换
- 默认引擎可配置
- 搜索状态通过 Pinia + IndexedDB 持久化

### 3. 书签管理
- 展示用户书签
- 支持搜索过滤

## 开发约定

### 代码风格
- 使用 Vue 3 Composition API + `<script setup>` 语法
- 新标签页相关代码放在 `src/newtab/` 目录下
- 组合式函数放在 `composables/` 目录，以 `use` 前缀命名
- 使用中文注释

### 样式规范
- 使用 Tailwind CSS 工具类优先
- 毛玻璃效果使用 `.aero-glass`、`.aero-border`、`.aero-text` 自定义类
- 主题颜色在 `src/style.css` 的 `@theme` 中定义

### 数据存储
- 用户设置存储在 IndexedDB
- 会话状态可使用 localStorage (如 `lastVisitDate`)

## 注意事项

- 扩展 manifest 版本为 V3
- Vite 配置使用多入口构建 (`index.html` + `newtab.html`)
- 开发模式下 `/bing-api` 代理到 Bing 图片接口