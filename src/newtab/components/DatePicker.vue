<script setup>
import { ref, computed, watch } from 'vue'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-vue-next'

const props = defineProps({
  modelValue: {
    type: String,
    default: () => new Date().toISOString().split('T')[0]
  }
})

const emit = defineEmits(['update:modelValue'])

const currentDate = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  currentDate.value = val
})

watch(currentDate, (val) => {
  emit('update:modelValue', val)
})

// 格式化显示日期
const displayDate = computed(() => {
  const date = new Date(currentDate.value)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
  return `${year}年${month}月${day}日 ${weekday}`
})

// 判断是否是今天
const isToday = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return currentDate.value === today
})

// 前一天
const prevDay = () => {
  const date = new Date(currentDate.value)
  date.setDate(date.getDate() - 1)
  currentDate.value = date.toISOString().split('T')[0]
}

// 后一天
const nextDay = () => {
  const date = new Date(currentDate.value)
  date.setDate(date.getDate() + 1)
  currentDate.value = date.toISOString().split('T')[0]
}

// 回到今天
const goToToday = () => {
  currentDate.value = new Date().toISOString().split('T')[0]
}
</script>

<template>
  <div class="flex items-center gap-2">
    <button
      class="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/70 hover:text-white"
      @click="prevDay"
    >
      <ChevronLeft class="w-5 h-5" />
    </button>
    
    <div class="flex items-center gap-2 px-3 py-1.5 rounded-md aero-glass aero-border">
      <Calendar class="w-4 h-4 text-white/60" />
      <span class="text-white font-medium min-w-[140px] text-center">{{ displayDate }}</span>
      <button
        v-if="!isToday"
        class="text-xs px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
        @click="goToToday"
      >
        今天
      </button>
    </div>
    
    <button
      class="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/70 hover:text-white"
      @click="nextDay"
    >
      <ChevronRight class="w-5 h-5" />
    </button>
  </div>
</template>

<style scoped>
@import '../styles/aero.css';
</style>