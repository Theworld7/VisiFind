# VisiFind 双语 README 设计规范

## 概述

为 VisiFind (寻迹) Chrome 扩展编写中英双语 README.md，格式为左右对照（中文在上、英文在下），截图位置用 HTML 注释占位。

## 格式规范

- 布局：每个大节内，中文段落先写，英文段落紧随其后
- 标题分隔：使用 `## 中文标题 / English Title` 格式
- 子标题：使用 `### 中文 / English` 格式
- 截图占位：纯 HTML 注释 `<!-- 截图：描述 -->`，标注需要补充的截图内容
- 无需为每个页面单独截图，由用户判断需要哪些截图

## 内容结构

### 1. 项目标题 + 徽章

```
# VisiFind (寻迹)
<!-- 截图：扩展图标 + 新标签页整体效果 -->
```

### 2. 项目概述 / Project Overview

中文段落介绍 VisiFind 定位：一款 Chrome 新标签页扩展，提供搜索、壁纸、书签及健康数据追踪功能。

英文段落翻译对齐。

**截图占位：** `<!-- 截图：新标签页整体效果 — Bing 壁纸 + 搜索框 + 书签 -->`

### 3. 核心功能 / Features

按路由介绍 7 个功能页面：

| 路由 | 中文功能名 | English Name |
|------|-----------|--------------|
| `/` | 首页 — 搜索、壁纸、书签 | Home — Search, Wallpaper, Bookmarks |
| `/intake/daily` | 每日摄入记录 | Daily Intake |
| `/intake/food-library` | 食物库 | Food Library |
| `/weight` | 体重记录 | Weight Tracking |
| `/documents` | 文档管理 | Document Management |
| `/items` | 物品管理 | Items |
| `/series` | 系列管理 | Series |

**截图占位：** `<!-- 截图：各功能页面入口或代表性界面 -->`

### 4. 技术栈 / Tech Stack

纯文字列表，无需截图。

- 框架：Vue 3 (Composition API + `<script setup>`)
- 构建工具：Vite 7
- 状态管理：Pinia
- 路由：Vue Router (Hash 模式)
- 样式：Tailwind CSS 4 + 自定义毛玻璃效果
- 图标：lucide-vue-next
- 数据存储：IndexedDB

### 5. 安装与加载 / Installation & Loading

中英对照的安装步骤。

**截图占位：** `<!-- 截图：chrome://extensions 加载步骤 -->`

```bash
# 开发模式 / Development
npm run dev

# 普通构建 / Build
npm run build

# 构建 Chrome 扩展 / Build Extension
npm run build:extension
```

### 6. 项目结构 / Project Structure

目录树，中英双语标注。

```
src/
├── main.js                    # index.html 入口 (开发预览用) / Dev preview entry
├── style.css                  # 全局样式 / Global styles
├── App.vue                    # 根组件 / Root component
├── components/                # 共享组件 / Shared components
├── lib/                       # 工具库 / Utilities
└── newtab/                    # 新标签页应用核心 / New tab app core
    ├── main.ts                # 入口文件 / Entry point
    ├── App.vue                # 根组件 / Root component
    ├── router/                # 路由配置 / Router config
    ├── views/                 # 页面视图 / Page views
    ├── components/            # 组件 / Components
    ├── composables/           # 组合式函数 / Composables
    ├── stores/                # Pinia 状态 / State store
    ├── lib/                   # IndexedDB 等 / DB utilities
    └── styles/                # 样式 / Styles
```

### 7. 开发指南 / Development

npm 命令、代码风格、提交规范。

**截图占位：** `<!-- 截图：开发模式预览效果 -->`

## 输出位置

文件写入项目根目录 `README.md`，覆盖现有文件。

## 截图清单（供用户参考）

以下为建议截图位置，用户自行补充：

1. `<!-- 截图：扩展图标 + 新标签页整体效果 -->`
   - 文件路径建议：`docs/screenshots/01-hero.png`
   - 内容：扩展图标 + 新标签页整体效果

2. `<!-- 截图：各功能页面入口或代表性界面 -->`
   - 文件路径建议：`docs/screenshots/02-features.png`
   - 内容：各功能页面入口或代表性界面

3. `<!-- 截图：chrome://extensions 加载步骤 -->`
   - 文件路径建议：`docs/screenshots/03-installation.png`
   - 内容：Chrome 扩展加载步骤

4. `<!-- 截图：开发模式预览效果 -->`
   - 文件路径建议：`docs/screenshots/04-dev-preview.png`
   - 内容：开发模式预览效果
