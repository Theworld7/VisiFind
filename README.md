# VisiFind

A clean and beautiful browser start page extension.

一个简洁美观的浏览器起始页扩展。

## Features 功能特点

- **Multi-Search Engine Support** - Switch between Bing, Google, Baidu, and Sogou.
- **多搜索引擎支持** - 支持切换必应、谷歌、百度、搜狗。

- **Bookmark Management** - Add, edit, and delete bookmarks with IndexedDB storage.
- **书签管理** - 使用 IndexedDB 存储，支持添加、编辑、删除书签。

- **Custom Background** - Upload images or use URL for custom backgrounds.
- **自定义背景** - 支持上传图片或使用 URL 设置背景。

- **Data Import/Export** - Backup and restore your bookmarks.
- **数据导入导出** - 备份和恢复书签数据。

- **Responsive Design** - Works on desktop and mobile devices.
- **响应式设计** - 支持桌面端和移动端。

## Tech Stack 技术栈

- Vue 3 + Composition API
- TypeScript
- Vite
- Pinia (State Management)
- Vue Router
- IndexedDB

## Getting Started 快速开始

```bash
# Install dependencies
# 安装依赖
pnpm install

# Development server
# 开发服务器
pnpm dev

# Build for production
# 构建生产版本
pnpm build
```

## Extension Installation 扩展安装

1. Run `pnpm build` to build the extension.
2. Open `chrome://extensions/` in your browser.
3. Enable Developer Mode.
4. Click "Load unpacked" and select the `dist` directory.

## Open Source License 开源协议

This project is licensed under the MIT License.

本项目采用 MIT 协议开源。

MIT License

Copyright (c) 2024 VisiFind Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
