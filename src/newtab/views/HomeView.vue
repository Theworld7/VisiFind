<script setup>
import { inject } from 'vue'
import { Search } from 'lucide-vue-next'
import Bookmarks from '../components/Bookmarks.vue'

const searchState = inject('searchState')

// 保持响应性引用
const searchEngines = searchState.searchEngines
const searchEngine = searchState.searchEngine
const searchQuery = searchState.searchQuery
const isLoaded = searchState.isLoaded
const { handleSearch, switchEngine } = searchState

const handleSwitchEngine = async (engineId) => {
  await switchEngine(engineId)
}
</script>

<template>
  <main class="min-h-screen flex flex-col items-center px-4 relative pt-20">
    <!-- Search Box -->
    <form class="w-full max-w-2xl pt-[20vh]" @submit.prevent="handleSearch">
      <!-- Engine Selector -->
      <div class="mb-2 flex gap-2 justify-start" style="padding-left: 1px;">
        <template v-if="isLoaded">
          <button
            v-for="engine in searchEngines"
            :key="engine.id"
            :class="[
              'px-4 py-1.5 rounded-full text-xs font-medium transition-all aero-glass aero-border aero-text',
              searchEngine === engine.id
                ? 'bg-white/40 text-white shadow-lg border-white/40 scale-105'
                : 'hover:bg-white/25 text-white/70 border-white/20'
            ]"
            type="button"
            @click="handleSwitchEngine(engine.id)"
          >
            {{ engine.name }}
          </button>
        </template>
        <div v-else class="h-8"></div>
      </div>

      <!-- Search Input -->
      <div class="flex aero-glass rounded-full overflow-hidden aero-border">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索..."
          class="flex-1 h-11 px-5 bg-transparent text-white placeholder-white/60 focus:outline-none text-sm"
          @keyup.enter="handleSearch"
        />

        <!-- Search Button -->
        <button
          type="submit"
          class="h-11 px-5 bg-white/20 hover:bg-white/30 transition-colors flex items-center gap-2 aero-border"
          @click="handleSearch"
        >
          <Search class="w-4 h-4 text-white" />
        </button>
      </div>
    </form>

    <!-- Bookmarks -->
    <Bookmarks class="mt-6 w-full max-w-2xl" :search-query="searchQuery" />
  </main>
</template>