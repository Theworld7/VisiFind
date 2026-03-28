<script setup>
import { computed, ref } from 'vue'
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-vue-next'
import { hasChildren as checkHasChildren } from '../lib/documents'

const props = defineProps({
  node: {
    type: Object,
    required: true
  },
  level: {
    type: Number,
    default: 0
  },
  selectedCategoryId: {
    type: [String, null],
    default: null
  },
  expandedIds: {
    type: Set,
    required: true
  }
})

const emit = defineEmits(['select-category', 'add-category', 'edit-category', 'delete-category', 'toggle-expand'])

const isExpanded = computed(() => props.expandedIds.has(props.node.id))
const isSelected = computed(() => props.selectedCategoryId === props.node.id)
const hasChild = checkHasChildren(props.node)

const toggleExpand = (e) => {
  e.stopPropagation()
  emit('toggle-expand', props.node.id)
}
</script>

<template>
  <div class="tree-node">
    <div
      class="tree-node-content"
      :class="{ selected: isSelected }"
      :style="{ paddingLeft: `${level * 16 + 8}px` }"
      @click="emit('select-category', node.id)"
    >
      <!-- 展开/收起按钮 -->
      <button
        class="expand-btn"
        :style="{ visibility: hasChild ? 'visible' : 'hidden' }"
        @click="toggleExpand"
      >
        <ChevronDown v-if="isExpanded" class="w-3.5 h-3.5" />
        <ChevronRight v-else class="w-3.5 h-3.5" />
      </button>

      <!-- 文件夹图标 -->
      <FolderOpen v-if="isExpanded" class="w-4 h-4 text-white/70" />
      <Folder v-else class="w-4 h-4 text-white/70" />

      <!-- 分类名称 -->
      <span class="tree-node-label">{{ node.name }}</span>

      <!-- 操作按钮 -->
      <div class="tree-node-actions">
        <button
          class="action-btn"
          title="添加子分类"
          @click.stop="emit('add-category', node.id)"
        >
          <Plus class="w-3.5 h-3.5" />
        </button>
        <button
          class="action-btn"
          title="编辑分类"
          @click.stop="emit('edit-category', node)"
        >
          <Pencil class="w-3.5 h-3.5" />
        </button>
        <button
          class="action-btn"
          title="删除分类"
          @click.stop="emit('delete-category', node)"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- 子节点 -->
    <div v-if="hasChild && isExpanded" class="tree-node-children">
      <TreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :level="level + 1"
        :selected-category-id="selectedCategoryId"
        :expanded-ids="expandedIds"
        @select-category="(id) => emit('select-category', id)"
        @add-category="(parentId) => emit('add-category', parentId)"
        @edit-category="(cat) => emit('edit-category', cat)"
        @delete-category="(cat) => emit('delete-category', cat)"
        @toggle-expand="(id) => emit('toggle-expand', id)"
      />
    </div>
  </div>
</template>

<style scoped>
.tree-node {
  user-select: none;
}

.tree-node-content {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  margin: 2px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.tree-node-content:hover {
  background: rgba(255, 255, 255, 0.08);
}

.tree-node-content.selected {
  background: rgba(255, 255, 255, 0.2);
}

.tree-node-label {
  flex: 1;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.expand-btn {
  padding: 2px;
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.expand-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.tree-node-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-node-content:hover .tree-node-actions {
  opacity: 1;
}

.action-btn {
  padding: 3px;
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.action-btn:hover:last-child {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.2);
}

.tree-node-children {
  /* 子节点容器 */
}
</style>
