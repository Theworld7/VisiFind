<script setup>
import { computed } from 'vue'
import { Play, CheckCircle, XCircle } from 'lucide-vue-next'

const props = defineProps({
  series: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['edit', 'delete', 'update-watched', 'update-status'])

// Status configuration
const statusConfig = {
  watching: { label: '追剧中', color: 'bg-blue-500/30 text-blue-100 border-blue-300/30', icon: Play },
  completed: { label: '已看完', color: 'bg-green-500/30 text-green-100 border-green-300/30', icon: CheckCircle },
  dropped: { label: '弃了', color: 'bg-red-500/30 text-red-100 border-red-300/30', icon: XCircle },
}

const statusInfo = computed(() => statusConfig[props.series.status] || statusConfig.watching)
const StatusIcon = computed(() => statusInfo.value.icon)

// Progress percentage
const progressPercent = computed(() => {
  if (!props.series.totalEpisodes || props.series.watchedEpisodes === undefined) return 0
  return Math.min(100, Math.round((props.series.watchedEpisodes / props.series.totalEpisodes) * 100))
})

// Fallback gradient for missing cover
const fallbackGradient = computed(() => {
  const colors = [
    'from-purple-500/30 to-pink-500/30',
    'from-blue-500/30 to-cyan-500/30',
    'from-green-500/30 to-teal-500/30',
    'from-orange-500/30 to-red-500/30',
    'from-indigo-500/30 to-purple-500/30',
  ]
  const index = props.series.name.length % colors.length
  return colors[index]
})
</script>

<template>
  <div
    class="group relative aero-glass aero-border rounded-2xl overflow-hidden transition-all duration-300
           hover:shadow-2xl hover:shadow-black/30 hover:scale-[1.02] cursor-pointer"
  >
    <!-- Cover Image -->
    <div class="relative h-56 overflow-hidden">
      <!-- Bottom gradient for text readability -->
      <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent z-[1] pointer-events-none"></div>
      <!-- Background blur layer -->
      <img
        v-if="series.coverImage"
        :src="series.coverImage"
        :alt="series.name"
        class="absolute inset-0 w-full h-full object-cover blur-sm scale-110 opacity-40"
      />

      <!-- Cover Image (contain) -->
      <img
        v-if="series.coverImage"
        :src="series.coverImage"
        :alt="series.name"
        class="relative w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
        @error="$event.target.style.display = 'none'"
      />
      <div
        v-else
        :class="['relative w-full h-full flex items-center justify-center bg-gradient-to-br', fallbackGradient]"
      >
        <span class="text-white/40 text-4xl">🎬</span>
      </div>

      <!-- Status Badge (clickable to cycle) -->
      <div
        class="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium aero-glass aero-border flex items-center gap-1.5 cursor-pointer hover:scale-105 transition-transform"
        :class="statusInfo.color"
        @click.stop="emit('update-status', series)"
      >
        <StatusIcon class="w-3.5 h-3.5" />
        {{ statusInfo.label }}
      </div>

      <!-- Hover Actions -->
      <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
        <button
          class="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-all aero-border hover:scale-105"
          @click.stop="emit('edit', series)"
        >
          编辑
        </button>
        <button
          class="px-4 py-2 rounded-full bg-red-500/80 hover:bg-red-600 text-white text-sm font-medium transition-all hover:scale-105"
          @click.stop="emit('delete', series)"
        >
          删除
        </button>
      </div>
    </div>

    <!-- Info Area -->
    <div class="p-4 space-y-3">
      <!-- Name -->
      <h3 class="text-base font-semibold text-white truncate" :title="series.name">
        {{ series.name }}
      </h3>

      <!-- Episode Progress (inline editable) -->
      <div class="flex items-center gap-2">
        <input
          type="number"
          :value="series.watchedEpisodes || 0"
          min="0"
          :max="series.totalEpisodes || undefined"
          class="w-10 bg-white/10 border border-white/20 rounded px-1 py-0.5 text-white text-sm text-center focus:outline-none focus:border-white/40"
          @click.stop
          @change.stop="emit('update-watched', series, Number($event.target.value))"
        />
        <span class="text-white/50 text-sm">/ {{ series.totalEpisodes || '?' }} 集</span>
      </div>

      <!-- Progress Bar -->
      <div class="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          class="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
          :class="{
            'bg-blue-400': series.status === 'watching',
            'bg-green-400': series.status === 'completed',
            'bg-red-400': series.status === 'dropped'
          }"
          :style="{ width: `${progressPercent}%` }"
        ></div>
      </div>

      <!-- Category Tag -->
      <div v-if="series.category" class="pt-1">
        <span class="inline-block px-2 py-0.5 rounded text-xs text-white/60 bg-white/10">
          {{ series.category }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '../styles/aero.css';
</style>
