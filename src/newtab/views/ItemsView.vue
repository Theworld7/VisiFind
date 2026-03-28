<script setup>
import { ref, computed } from 'vue'
import { Plus, Search, Package } from 'lucide-vue-next'
import { useItems } from '../composables/useItems'
import ItemCard from '../components/ItemCard.vue'
import ItemModal from '../components/ItemModal.vue'

const {
  items,
  loading,
  createItem,
  editItem,
  removeItem,
  calculateServiceDays,
  calculateAverageCost,
} = useItems()

// 搜索关键词
const searchQuery = ref('')

// 编辑中的物品
const editingItem = ref(null)

// 弹窗显示状态
const modalOpen = ref(false)

// 过滤后的物品列表
const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) return items.value

  const query = searchQuery.value.toLowerCase()
  return items.value.filter((item) =>
    item.name.toLowerCase().includes(query)
  )
})

// 统计信息
const stats = computed(() => {
  const total = items.value.length
  const inService = items.value.filter((i) => i.inService).length
  const retired = total - inService
  const totalValue = items.value.reduce((sum, i) => sum + (i.price || 0), 0)
  return { total, inService, retired, totalValue }
})

// 打开新增弹窗
function handleAddItem() {
  editingItem.value = null
  modalOpen.value = true
}

// 打开编辑弹窗
function handleEditItem(item) {
  editingItem.value = { ...item }
  modalOpen.value = true
}

// 保存物品（新增或编辑）
async function handleSaveItem(itemData) {
  let success = false

  if (editingItem.value) {
    // 编辑模式
    success = await editItem(editingItem.value.id, itemData)
  } else {
    // 新增模式
    success = await createItem(itemData)
  }

  if (success) {
    modalOpen.value = false
    editingItem.value = null
  }
}

// 删除物品
async function handleDeleteItem(item) {
  const confirmed = confirm(`确定要删除物品"${item.name}"吗？`)
  if (confirmed) {
    await removeItem(item.id)
  }
}
</script>

<template>
  <main class="min-h-screen px-4 pt-24 pb-8">
    <div class="max-w-7xl mx-auto">
      <!-- 页面标题 -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-white mb-2">物品管理</h1>
        <p class="text-white/60 text-sm">记录和管理您的个人物品，追踪使用成本</p>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="aero-glass aero-border rounded-xl p-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="p-2 rounded-lg bg-blue-500/20">
              <Package class="w-5 h-5 text-blue-400" />
            </div>
            <span class="text-white/60 text-sm">总物品数</span>
          </div>
          <div class="text-2xl font-bold text-white">{{ stats.total }}</div>
        </div>
        <div class="aero-glass aero-border rounded-xl p-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="p-2 rounded-lg bg-white/20">
              <Package class="w-5 h-5 text-white" />
            </div>
            <span class="text-white/60 text-sm">服役中</span>
          </div>
          <div class="text-2xl font-bold text-white">{{ stats.inService }}</div>
        </div>
        <div class="aero-glass aero-border rounded-xl p-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="p-2 rounded-lg bg-gray-500/20">
              <Package class="w-5 h-5 text-gray-400" />
            </div>
            <span class="text-white/60 text-sm">已退役</span>
          </div>
          <div class="text-2xl font-bold text-white">{{ stats.retired }}</div>
        </div>
        <div class="aero-glass aero-border rounded-xl p-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="p-2 rounded-lg bg-yellow-500/20">
              <Package class="w-5 h-5 text-yellow-400" />
            </div>
            <span class="text-white/60 text-sm">总价值</span>
          </div>
          <div class="text-2xl font-bold text-white">¥{{ stats.totalValue.toFixed(2) }}</div>
        </div>
      </div>

      <!-- 搜索和操作栏 -->
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <!-- 搜索框 -->
        <div class="flex-1 flex items-center gap-3 aero-glass aero-border rounded-full px-4 py-2.5">
          <Search class="w-5 h-5 text-white/60" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索物品名称..."
            class="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none text-sm"
          />
        </div>

        <!-- 添加按钮 -->
        <button
          class="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full aero-glass aero-border bg-white/20 hover:bg-white/30 text-white font-medium transition-all hover:scale-105"
          @click="handleAddItem"
        >
          <Plus class="w-5 h-5" />
          <span>添加物品</span>
        </button>
      </div>

      <!-- 物品列表 -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="text-white/60">加载中...</div>
      </div>

      <div
        v-else-if="filteredItems.length === 0"
        class="flex flex-col items-center justify-center py-20 text-center"
      >
        <Package class="w-16 h-16 text-white/20 mb-4" />
        <p class="text-white/60 text-lg mb-2">
          {{ searchQuery ? '没有找到匹配的物品' : '还没有物品' }}
        </p>
        <p class="text-white/40 text-sm">
          {{ searchQuery ? '试试其他关键词' : '点击上方按钮添加您的第一个物品' }}
        </p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <ItemCard
          v-for="item in filteredItems"
          :key="item.id"
          :item="item"
          :service-days="calculateServiceDays(item.purchaseDate)"
          :avg-cost="calculateAverageCost(item.price, item.purchaseDate)"
          @edit="handleEditItem"
          @delete="handleDeleteItem"
        />
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <ItemModal
      v-model:open="modalOpen"
      :item="editingItem"
      @save="handleSaveItem"
    />
  </main>
</template>

<style scoped>
@import '../styles/aero.css';
</style>
