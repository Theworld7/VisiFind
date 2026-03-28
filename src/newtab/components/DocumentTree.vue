<script setup>
import { ref, computed, watch } from 'vue'
import { Plus } from 'lucide-vue-next'
import { buildCategoryTree } from '../lib/documents'
import TreeNode from './TreeNode.vue'

const props = defineProps({
  categories: {
    type: Array,
    default: () => []
  },
  selectedCategoryId: {
    type: [String, null],
    default: null
  }
})

const emit = defineEmits(['select-category', 'add-category', 'edit-category', 'delete-category'])

// 构建树状结构
const treeData = computed(() => {
  return buildCategoryTree(props.categories)
})

const categoryTree = computed(() => treeData.value.tree)

// 展开状态 - 自动展开有子节点的父节点
const expandedIds = ref(new Set())

// 监听分类变化，自动展开有子节点的节点
watch(() => props.categories, () => {
  const { nodesWithChildren } = treeData.value
  // 保留原有的展开状态，同时展开有新子节点的父节点
  nodesWithChildren.forEach(id => {
    expandedIds.value.add(id)
  })
  expandedIds.value = new Set(expandedIds.value)
}, { immediate: true })

// 切换展开状态
const toggleExpand = (id) => {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  } else {
    expandedIds.value.add(id)
  }
  expandedIds.value = new Set(expandedIds.value)
}

// 选择分类
const selectCategory = (categoryId) => {
  emit('select-category', categoryId)
}

// 添加根分类
const addRootCategory = () => {
  emit('add-category', null)
}
</script>

<template>
  <div class="document-tree">
    <!-- 根分类按钮 -->
    <div class="tree-header">
      <span class="tree-title">分类</span>
      <button class="add-root-btn" @click="addRootCategory" title="添加根分类">
        <Plus class="w-4 h-4" />
      </button>
    </div>

    <!-- 树状列表 -->
    <div class="tree-content">
      <TreeNode
        v-for="node in categoryTree"
        :key="node.id"
        :node="node"
        :level="0"
        :selected-category-id="selectedCategoryId"
        :expanded-ids="expandedIds"
        @select-category="selectCategory"
        @add-category="(parentId) => emit('add-category', parentId)"
        @edit-category="(cat) => emit('edit-category', cat)"
        @delete-category="(cat) => emit('delete-category', cat)"
        @toggle-expand="toggleExpand"
      />
    </div>
  </div>
</template>

<style scoped>
.document-tree {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tree-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.add-root-btn {
  padding: 4px;
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-root-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}
</style>
