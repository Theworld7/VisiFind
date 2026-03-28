<script setup>
import { ref, computed, watch } from 'vue'
import { TrendingUp } from 'lucide-vue-next'

const props = defineProps({
  records: {
    type: Array,
    default: () => []
  },
  caloriesLimit: {
    type: Number,
    default: 8000
  }
})

const viewMode = ref('week') // 'week' | 'month'

// 计算日期范围内的每日热量（根据碳蛋脂计算）
const dailyCalories = computed(() => {
  const now = new Date()
  const days = viewMode.value === 'week' ? 7 : 30
  const result = []

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    // 查找这一天的记录
    const dayRecords = props.records.filter(r => r.date === dateStr)
    const totalCarbs = dayRecords.reduce((sum, r) => sum + (isNaN(r.carbs) ? 0 : r.carbs), 0)
    const totalProtein = dayRecords.reduce((sum, r) => sum + (isNaN(r.protein) ? 0 : r.protein), 0)
    const totalFat = dayRecords.reduce((sum, r) => sum + (isNaN(r.fat) ? 0 : r.fat), 0)
    // 热量计算：碳水 17kJ/g + 蛋白质 17kJ/g + 脂肪 37kJ/g
    const totalCalories = Math.round(totalCarbs * 17 + totalProtein * 17 + totalFat * 37)

    result.push({
      date: dateStr,
      day: date.getDate(),
      weekday: ['日', '一', '二', '三', '四', '五', '六'][date.getDay()],
      calories: totalCalories
    })
  }

  return result
})

// 计算最大热量值用于图表缩放
const maxCalories = computed(() => {
  const max = Math.max(...dailyCalories.value.map(d => d.calories), 2000)
  return Math.ceil(max / 1000) * 1000
})

// 检查是否有数据
const hasData = computed(() => {
  return dailyCalories.value.some(d => d.calories > 0)
})

// 检查是否超过上限
const isOverLimit = (calories) => {
  return calories > props.caloriesLimit
}

// 格式化日期显示
const dateRangeLabel = computed(() => {
  const now = new Date()
  const days = viewMode.value === 'week' ? 7 : 30
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - days + 1)

  const startMonth = startDate.getMonth() + 1
  const startDay = startDate.getDate()
  const endMonth = now.getMonth() + 1
  const endDay = now.getDate()

  return `${startMonth}/${startDay} - ${endMonth}/${endDay}`
})
</script>

<template>
  <div class="aero-glass rounded-lg p-4 aero-border">
    <!-- 标题和切换 -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <TrendingUp class="w-5 h-5 text-white/60" />
        <h3 class="text-white font-semibold">摄入趋势</h3>
      </div>
      <div class="flex gap-1">
        <button
          :class="[
            'px-3 py-1 rounded text-sm font-medium transition-colors',
            viewMode === 'week' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
          ]"
          @click="viewMode = 'week'"
        >
          周
        </button>
        <button
          :class="[
            'px-3 py-1 rounded text-sm font-medium transition-colors',
            viewMode === 'month' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'
          ]"
          @click="viewMode = 'month'"
        >
          月
        </button>
      </div>
    </div>

    <!-- 图表 -->
    <div class="h-56 flex items-end gap-2 pb-6 relative">
      <div v-if="!hasData" class="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
        暂无摄入数据，开始记录第一餐吧
      </div>
      <div
        v-for="day in dailyCalories"
        :key="day.date"
        class="flex-1 flex flex-col items-center justify-end h-full"
      >
        <!-- 热量柱 -->
        <div class="w-full flex items-end justify-center h-full relative">
          <div
            :class="[
              'rounded-t-sm transition-all duration-300 relative',
              isOverLimit(day.calories) 
                ? 'bg-gradient-to-t from-red-500/80 to-red-400/50' 
                : 'bg-gradient-to-t from-white/60 to-white/30'
            ]"
            :style="{ 
              height: `${Math.max((day.calories / maxCalories) * 100, day.calories > 0 ? 4 : 1)}%`,
              width: viewMode === 'week' ? '24px' : '16px'
            }"
          >
            <div
              v-if="day.calories > 0"
              class="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-white/80 whitespace-nowrap font-medium"
              :class="{ 'text-red-400': isOverLimit(day.calories) }"
            >
              {{ day.calories }}
            </div>
          </div>
        </div>
        <!-- 日期标签 -->
        <div class="text-xs text-white/50 text-center mt-2">
          <div>{{ day.day }}</div>
          <div class="text-[10px]">{{ day.weekday }}</div>
        </div>
      </div>
    </div>

    <!-- 日期范围 -->
    <div class="text-center text-xs text-white/40 mt-3">
      {{ dateRangeLabel }}
    </div>
  </div>
</template>

<style scoped>
@import '../styles/aero.css';
</style>