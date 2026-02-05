<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, h } from 'vue'
import { NDropdown } from 'naive-ui'
import addIcon from '@/assets/icon-add.svg'
import editIcon from '@/assets/icon-edit.svg'
import deleteIcon from '@/assets/icon-delete.svg'

interface Bookmark {
  id?: number
  name: string
  url: string
  customIcon?: string
  group?: string
}

const props = defineProps<{
  bookmarks: Bookmark[]
}>()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'edit', bookmark: Bookmark): void
  (e: 'delete', id: number): void
  (e: 'open', url: string): void
  (e: 'reorder', bookmarks: Bookmark[]): void
}>()

const contextMenuVisible = ref(false)
const contextMenuBookmark = ref<Bookmark | null>(null)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const currentGroup = ref('默认')
const containerRef = ref<HTMLElement | null>(null)

const menuOptions = [
  {
    label: '编辑',
    key: 'edit',
    icon: () => h('img', { src: editIcon, style: { width: '16px', height: '16px' } }),
  },
  {
    label: '删除',
    key: 'delete',
    icon: () => h('img', { src: deleteIcon, style: { width: '16px', height: '16px' } }),
    props: { class: 'danger' },
  },
]

// 滚动状态
const isAtTop = ref(true)
const isAtBottom = ref(true)

// 处理滚动
const handleScroll = () => {
  const gridEl = containerRef.value?.querySelector('.bookmark-grid') as HTMLElement
  if (!gridEl) return
  isAtTop.value = gridEl.scrollTop === 0
  isAtBottom.value = gridEl.scrollTop + gridEl.clientHeight >= gridEl.scrollHeight - 1
}

// 动态遮罩样式
const maskStyle = computed(() => {
  const masks: string[] = []

  if (!isAtTop.value) {
    masks.push('linear-gradient(to bottom, transparent 0%, black 12px)')
  }
  if (!isAtBottom.value) {
    masks.push('linear-gradient(to top, transparent 0%, black 12px)')
  }

  if (masks.length === 0) {
    return {}
  }

  return {
    maskImage: masks.join(', '),
    WebkitMaskImage: masks.join(', '),
    maskComposite: 'intersect',
    WebkitMaskComposite: 'intersect',
  }
})

// 拖拽相关状态
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// 开始拖拽
const handleDragStart = (event: DragEvent, index: number) => {
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', index.toString())
  }
}

// 拖拽经过
const handleDragOver = (event: DragEvent, index: number) => {
  event.preventDefault()
  if (draggedIndex.value !== null && draggedIndex.value !== index) {
    dragOverIndex.value = index
  }
}

// 拖拽离开
const handleDragLeave = () => {
  dragOverIndex.value = null
}

// 拖拽结束
const handleDragEnd = () => {
  draggedIndex.value = null
  dragOverIndex.value = null
}

// 放置时更新顺序
const handleDrop = (event: DragEvent, targetIndex: number) => {
  event.preventDefault()
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) {
    handleDragEnd()
    return
  }

  // 复制完整书签数组
  const bookmarks = [...props.bookmarks]
  const currentGroupBookmarks = bookmarks.filter((b) =>
    currentGroup.value === '默认' ? !b.group || !b.group.trim() : b.group === currentGroup.value,
  )

  const draggedBookmark = currentGroupBookmarks[draggedIndex.value]
  if (!draggedBookmark) {
    handleDragEnd()
    return
  }

  // 在当前分组内排序
  currentGroupBookmarks.splice(draggedIndex.value, 1)
  currentGroupBookmarks.splice(targetIndex, 0, draggedBookmark)

  // 将排序后的分组书签放回原位置
  let groupIndex = 0
  bookmarks.forEach((bookmark, i) => {
    const isInCurrentGroup =
      currentGroup.value === '默认'
        ? !bookmark.group || !bookmark.group.trim()
        : bookmark.group === currentGroup.value
    if (isInCurrentGroup && currentGroupBookmarks[groupIndex]) {
      bookmarks[i] = currentGroupBookmarks[groupIndex]!
      groupIndex++
    }
  })

  // 通知父组件更新
  emit('reorder', bookmarks)
  handleDragEnd()
}

// 从书签中提取所有分组
const groups = computed(() => {
  const groupSet = new Set<string>()
  groupSet.add('默认')
  props.bookmarks.forEach((bookmark) => {
    if (bookmark.group && bookmark.group.trim()) {
      groupSet.add(bookmark.group)
    }
  })
  return Array.from(groupSet)
})

// 根据当前分组过滤书签
const filteredBookmarks = computed(() => {
  if (currentGroup.value === '默认') {
    return props.bookmarks.filter((bookmark) => !bookmark.group || !bookmark.group.trim())
  }
  return props.bookmarks.filter((bookmark) => bookmark.group === currentGroup.value)
})

const switchGroup = (group: string) => {
  currentGroup.value = group
}

const openAddModal = () => {
  emit('add')
}

const openEditModal = (bookmark: Bookmark) => {
  emit('edit', bookmark)
  closeContextMenu()
}

const deleteBookmark = (id: number) => {
  emit('delete', id)
  closeContextMenu()
}

const openBookmark = (url: string) => {
  emit('open', url)
}

const showContextMenu = (event: MouseEvent, bookmark: Bookmark) => {
  event.preventDefault()
  event.stopPropagation()
  contextMenuBookmark.value = bookmark
  contextMenuX.value = event.clientX
  contextMenuY.value = event.clientY
  contextMenuVisible.value = true
}

const closeContextMenu = () => {
  contextMenuVisible.value = false
  contextMenuBookmark.value = null
}

const handleContextMenuSelect = (key: string | number) => {
  const bookmark = contextMenuBookmark.value
  if (!bookmark) return

  if (key === 'edit') {
    openEditModal(bookmark)
  } else if (key === 'delete' && bookmark.id) {
    deleteBookmark(bookmark.id)
  }
  closeContextMenu()
}

onMounted(() => {
  const gridEl = containerRef.value?.querySelector('.bookmark-grid') as HTMLElement
  gridEl?.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  const gridEl = containerRef.value?.querySelector('.bookmark-grid') as HTMLElement
  gridEl?.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div ref="containerRef" class="bookmark-wrapper">
    <div class="bookmark-grid-container">
      <div class="bookmark-grid" :style="maskStyle">
        <div class="bookmark-item">
          <div class="bookmark-icon-wrapper add-btn" @click="openAddModal">
            <img :src="addIcon" class="action-icon" alt="新增" />
          </div>
          <span class="bookmark-name">新增</span>
        </div>
        <div
          v-for="(bookmark, index) in filteredBookmarks"
          :key="bookmark.id"
          class="bookmark-item"
          :class="{ dragging: draggedIndex === index, 'drag-over': dragOverIndex === index }"
          draggable="true"
          @dragstart="handleDragStart($event, index)"
          @dragover="handleDragOver($event, index)"
          @dragleave="handleDragLeave"
          @dragend="handleDragEnd"
          @drop="handleDrop($event, index)"
        >
          <div
            class="bookmark-icon-wrapper"
            @click="openBookmark(bookmark.url)"
            @contextmenu="showContextMenu($event, bookmark)"
          >
            <!-- 优先显示自定义图标 -->
            <img
              v-if="bookmark.customIcon"
              :src="bookmark.customIcon"
              class="bookmark-favicon"
              alt=""
            />
            <!-- 默认显示首字符 -->
            <div v-else class="bookmark-icon">
              {{ bookmark.name.charAt(0) }}
            </div>
          </div>
          <span class="bookmark-name">{{ bookmark.name }}</span>
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <NDropdown
      placement="bottom-start"
      trigger="manual"
      :x="contextMenuX"
      :y="contextMenuY"
      :options="menuOptions"
      :show="contextMenuVisible"
      @select="handleContextMenuSelect"
      @clickoutside="closeContextMenu"
    />

    <!-- 分组切换器 -->
    <div class="group-tabs">
      <div class="group-tabs-inner">
        <button
          v-for="group in groups"
          :key="group"
          class="group-tab"
          :class="{ active: currentGroup === group }"
          @click="switchGroup(group)"
        >
          {{ group }}
        </button>
      </div>
    </div>

    <!-- 右键菜单 -->
    <NDropdown
      placement="bottom-start"
      trigger="manual"
      :x="contextMenuX"
      :y="contextMenuY"
      :options="menuOptions"
      :show="contextMenuVisible"
      @select="handleContextMenuSelect"
      @clickoutside="closeContextMenu"
    />
  </div>
</template>

<style scoped>
/* 引入全局 CSS 变量 */

.bookmark-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  z-index: 1;
}

/* 网格容器 - 包含遮罩和网格 */
.bookmark-grid-container {
  position: relative;
  height: 216px;
}

.bookmark-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  grid-auto-rows: 72px;
  gap: 12px;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  /* 隐藏滚动条 */
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}

.bookmark-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition:
    transform 0.2s,
    background 0.2s;
  padding: 4px;
  border-radius: 12px;
}

.bookmark-item:hover {
  transform: translateY(-4px);
}

.bookmark-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.bookmark-item.drag-over {
  transform: scale(1.05);
  background: var(--bg-white-20);
}

.bookmark-icon-wrapper {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: visible;
}

.add-btn {
  background: var(--bg-white-20);
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-btn .action-icon {
  filter: invert(1);
}

.action-icon {
  width: 24px;
  height: 24px;
}

.bookmark-favicon {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  background: var(--bg-white);
}

.bookmark-icon {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-white);
  box-shadow: 0 2px 8px var(--bg-overlay-lighter);
  background: var(--bg-white-20);
}

.bookmark-name {
  font-size: 12px;
  color: var(--text-white);
  text-shadow: 0 1px 4px var(--bg-overlay-lighter);
  text-align: center;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 分组切换器 */
.group-tabs {
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.group-tabs-inner {
  display: flex;
  gap: 8px;
  background: var(--bg-white-20);
  backdrop-filter: blur(4px);
  padding: 6px;
  border-radius: 20px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 80%;
}

.group-tab {
  padding: 8px 16px;
  border-radius: 16px;
  border: none;
  background: transparent;
  color: var(--text-white);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.group-tab:hover {
  background: var(--bg-white-30);
}

.group-tab.active {
  background: var(--bg-white-90);
  color: var(--text-primary);
}

/* 手机适配 */
@media (max-width: 768px) {
  .bookmark-wrapper {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow: hidden;
  }

  .bookmark-grid-container {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .bookmark-grid {
    flex: 1;
    min-height: 0;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 64px;
    gap: 10px;
  }

  .bookmark-icon-wrapper {
    width: 36px;
    height: 36px;
  }

  .bookmark-icon {
    font-size: 14px;
  }

  .bookmark-name {
    font-size: 11px;
    max-width: 60px;
  }

  .group-tabs {
    flex-shrink: 0;
    padding: 4px 0;
  }

  .group-tabs-inner {
    padding: 4px;
    gap: 6px;
    border-radius: 16px;
  }

  .group-tab {
    padding: 6px 10px;
    font-size: 12px;
  }
}
</style>
