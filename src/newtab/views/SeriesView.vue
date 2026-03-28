<script setup>
import { ref } from 'vue'
import { Plus, Search, Play, CheckCircle, XCircle, Film } from 'lucide-vue-next'
import { useSeries } from '../composables/useSeries'
import SeriesCard from '../components/SeriesCard.vue'
import SeriesModal from '../components/SeriesModal.vue'

const {
  loading,
  selectedCategory,
  searchQuery,
  categories,
  filteredSeries,
  stats,
  createSeries,
  editSeries,
  removeSeries,
} = useSeries()

// Modal state
const modalOpen = ref(false)
const editingSeries = ref(null)

// Open add modal
function handleAddSeries() {
  editingSeries.value = null
  modalOpen.value = true
}

// Open edit modal
function handleEditSeries(series) {
  editingSeries.value = { ...series }
  modalOpen.value = true
}

// Handle save (create or update)
async function handleSaveSeries(seriesData) {
  let success = false
  if (editingSeries.value) {
    success = await editSeries(editingSeries.value.id, seriesData)
  } else {
    success = await createSeries(seriesData)
  }
  if (success) {
    modalOpen.value = false
    editingSeries.value = null
  }
}

// Handle delete
async function handleDeleteSeries(series) {
  const confirmed = confirm(`确定要删除"${series.name}"吗？`)
  if (confirmed) {
    await removeSeries(series.id)
  }
}

// Category filter click
function handleCategoryClick(category) {
  selectedCategory.value = category
}

// Update watched episodes
async function handleUpdateWatched(series, watchedEpisodes) {
  await editSeries(series.id, { watchedEpisodes })
}

// Cycle status (watching → completed → dropped → watching)
async function handleUpdateStatus(series) {
  const statusCycle = { watching: 'completed', completed: 'dropped', dropped: 'watching' }
  const newStatus = statusCycle[series.status] || 'watching'
  await editSeries(series.id, { status: newStatus })
}
</script>

<template>
  <main class="min-h-screen px-4 pt-24 pb-8">
    <div class="max-w-7xl mx-auto">
      <!-- Page Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-white mb-2">漫剧记录</h1>
        <p class="text-white/60 text-sm">追踪你正在追的番剧和电影系列</p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="aero-glass aero-border rounded-xl p-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="p-2 rounded-lg bg-white/20">
              <Film class="w-5 h-5 text-white" />
            </div>
            <span class="text-white/60 text-sm">总系列数</span>
          </div>
          <div class="text-2xl font-bold text-white">{{ stats.total }}</div>
        </div>
        <div class="aero-glass aero-border rounded-xl p-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="p-2 rounded-lg bg-blue-500/20">
              <Play class="w-5 h-5 text-blue-400" />
            </div>
            <span class="text-white/60 text-sm">追剧中</span>
          </div>
          <div class="text-2xl font-bold text-white">{{ stats.watching }}</div>
        </div>
        <div class="aero-glass aero-border rounded-xl p-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="p-2 rounded-lg bg-green-500/20">
              <CheckCircle class="w-5 h-5 text-green-400" />
            </div>
            <span class="text-white/60 text-sm">已看完</span>
          </div>
          <div class="text-2xl font-bold text-white">{{ stats.completed }}</div>
        </div>
        <div class="aero-glass aero-border rounded-xl p-4">
          <div class="flex items-center gap-3 mb-2">
            <div class="p-2 rounded-lg bg-red-500/20">
              <XCircle class="w-5 h-5 text-red-400" />
            </div>
            <span class="text-white/60 text-sm">弃了</span>
          </div>
          <div class="text-2xl font-bold text-white">{{ stats.dropped }}</div>
        </div>
      </div>

      <!-- Search and Add Bar -->
      <div class="flex flex-col sm:flex-row gap-4 mb-6">
        <!-- Search -->
        <div class="flex-1 flex items-center gap-3 aero-glass aero-border rounded-full px-4 py-2.5">
          <Search class="w-5 h-5 text-white/60" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索系列名称..."
            class="flex-1 bg-transparent text-white placeholder-white/40 focus:outline-none text-sm"
          />
        </div>

        <!-- Add Button -->
        <button
          class="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full aero-glass aero-border bg-white/20 hover:bg-white/30 text-white font-medium transition-all hover:scale-105"
          @click="handleAddSeries"
        >
          <Plus class="w-5 h-5" />
          <span class="text-sm">追剧</span>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <div class="text-white/60">加载中...</div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredSeries.length === 0"
        class="flex flex-col items-center justify-center py-20 text-center"
      >
        <Film class="w-16 h-16 text-white/20 mb-4" />
        <p class="text-white/60 text-lg mb-2">
          {{ searchQuery ? '没有找到匹配的结果' : '还没有添加任何系列' }}
        </p>
        <p class="text-white/40 text-sm">
          {{ searchQuery ? '试试其他关键词' : '点击上方按钮添加你的第一个系列' }}
        </p>
      </div>

      <!-- Series Grid -->
      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <SeriesCard
          v-for="s in filteredSeries"
          :key="s.id"
          :series="s"
          @edit="handleEditSeries"
          @delete="handleDeleteSeries"
          @update-watched="handleUpdateWatched"
          @update-status="handleUpdateStatus"
        />
      </div>
    </div>

    <!-- Category Filter Bar (Fixed at bottom, like Bookmarks) -->
    <div class="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none">
      <div class="aero-glass aero-border rounded-full px-3 flex gap-2 flex-wrap justify-center items-center pointer-events-auto h-[44px] max-w-2xl overflow-x-auto scrollbar-hide relative">
        <div class="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/30 to-transparent pointer-events-none rounded-l-full"></div>
        <div class="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/30 to-transparent pointer-events-none rounded-r-full"></div>
        <button
          v-for="cat in categories"
          :key="cat"
          @click="handleCategoryClick(cat)"
          :class="[
            'px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-150 ease-out',
            selectedCategory === cat
              ? 'bg-white/40 text-white shadow-lg aero-border'
              : 'text-white/70 hover:bg-white/20'
          ]"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <SeriesModal
      v-model:open="modalOpen"
      :series="editingSeries"
      :categories="categories"
      @save="handleSaveSeries"
    />
  </main>
</template>

<style scoped>
@import '../styles/aero.css';
</style>
