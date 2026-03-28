<script setup>
import { computed, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps({
  trendData: {
    type: Array,
    default: () => []
  },
  period: {
    type: String,
    default: 'week' // 'week' | 'month' | 'year'
  },
  unit: {
    type: String,
    default: 'kg'
  }
})

const emit = defineEmits(['update:period'])

// 图表数据
const chartData = computed(() => {
  const data = props.trendData
  if (!Array.isArray(data) || data.length === 0) {
    return {
      labels: [],
      datasets: []
    }
  }

  const now = new Date()
  const labels = []
  const weights = []

  // 周视图：显示本周一到周日
  if (props.period === 'week') {
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset)
    monday.setHours(0, 0, 0, 0)

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      const dateStr = toLocalDateString(date)
      const record = data.find(r => r.date === dateStr)

      labels.push(formatDateLabel(date, props.period))
      weights.push(record ? record.weight : null)
    }
  }

  // 月视图：显示本月 1 号到月底
  if (props.period === 'month') {
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = toLocalDateString(date)
      const record = data.find(r => r.date === dateStr)

      labels.push(String(day))
      weights.push(record ? record.weight : null)
    }
  }

  // 年视图：显示今年 1 月到 12 月
  if (props.period === 'year') {
    const year = now.getFullYear()

    for (let month = 0; month < 12; month++) {
      const monthRecords = data.filter(r => {
        const recordDate = new Date(r.date)
        return recordDate.getFullYear() === year && recordDate.getMonth() === month
      })

      let avgWeight = null
      if (monthRecords.length > 0) {
        const sum = monthRecords.reduce((acc, r) => acc + r.weight, 0)
        avgWeight = sum / monthRecords.length
      }

      labels.push(`${month + 1}月`)
      weights.push(avgWeight)
    }
  }

  // 检查是否有有效数据（当前周期内）
  const validWeights = weights.filter(w => w !== null)

  if (validWeights.length === 0) {
    return {
      labels: [],
      datasets: []
    }
  }

  const minWeight = Math.min(...validWeights)
  const maxWeight = Math.max(...validWeights)
  const padding = (maxWeight - minWeight) * 0.15 || 5

  // 确定趋势颜色
  const trendColor = trendDirection.value === 'down'
    ? { line: '#22c55e', fill: '34, 197, 94' }
    : trendDirection.value === 'up'
    ? { line: '#ef4444', fill: '239, 68, 68' }
    : { line: '#94a3b8', fill: '148, 163, 184' }

  return {
    labels,
    datasets: [
      {
        label: '体重',
        data: weights,
        borderColor: trendColor.line,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx
          const gradient = ctx.createLinearGradient(0, 0, 0, 300)
          gradient.addColorStop(0, `rgba(${trendColor.fill}, 0.25)`)
          gradient.addColorStop(1, `rgba(${trendColor.fill}, 0)`)
          return gradient
        },
        borderWidth: 2,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: trendColor.line,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4
      }
    ]
  }
})

// 图表选项
const chartOptions = computed(() => {
  const now = new Date()

  // 根据周期计算当前范围内的有效数据（逻辑与 chartData 保持一致）
  let validWeights = []

  if (props.period === 'week') {
    const dayOfWeek = now.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset)
    monday.setHours(0, 0, 0, 0)

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      const dateStr = toLocalDateString(date)
      const record = props.trendData.find(r => r.date === dateStr)
      if (record && record.weight !== null) {
        validWeights.push(record.weight)
      }
    }
  } else if (props.period === 'month') {
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = toLocalDateString(date)
      const record = props.trendData.find(r => r.date === dateStr)
      if (record && record.weight !== null) {
        validWeights.push(record.weight)
      }
    }
  } else if (props.period === 'year') {
    const year = now.getFullYear()
    validWeights = props.trendData
      .filter(r => {
        const recordDate = new Date(r.date)
        return recordDate.getFullYear() === year && r.weight !== null
      })
      .map(r => r.weight)
  }

  // 检查当前周期是否有有效数据
  let minWeight = 0
  let maxWeight = 100
  if (validWeights.length > 0) {
    minWeight = Math.min(...validWeights)
    maxWeight = Math.max(...validWeights)
  }

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(20, 20, 20, 0.85)',
        backdropFilter: 'blur(20px)',
        titleColor: 'rgba(255, 255, 255, 0.9)',
        bodyColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y
            if (value === null) return null
            const unitLabel = props.unit === 'kg' ? '公斤' : '斤'
            return `${value.toFixed(1)} ${unitLabel}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.4)',
          font: {
            size: 11
          },
          maxRotation: 0,
          minRotation: 0
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.4)',
          font: {
            size: 11
          },
          callback: (value) => `${value.toFixed(0)}`
        },
        min: minWeight - 5,
        max: maxWeight + 5
      }
    }
  }
})

// 获取趋势方向
const trendDirection = computed(() => {
  const validData = props.trendData.filter(r => r.weight !== null)
  if (validData.length < 2) return 'stable'

  const first = validData[0]?.weight
  const last = validData[validData.length - 1]?.weight

  if (last > first) return 'up'
  if (last < first) return 'down'
  return 'stable'
})

// 趋势图标
const trendIcon = computed(() => {
  switch (trendDirection.value) {
    case 'up': return TrendingUp
    case 'down': return TrendingDown
    default: return Minus
  }
})

// 趋势颜色
const trendColor = computed(() => {
  switch (trendDirection.value) {
    case 'up': return 'text-red-400'
    case 'down': return 'text-green-400'
    default: return 'text-white/40'
  }
})

// 转换为本地日期字符串（避免时区问题）
function toLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化日期标签
function formatDateLabel(date, period) {
  const month = date.getMonth() + 1
  const day = date.getDate()

  if (period === 'year') {
    return `${month}月`
  }
  return `${month}/${day}`
}

// 检查是否有数据（当前周期内有有效数据）
const hasData = computed(() => {
  return chartData.value.datasets.length > 0
})
</script>

<template>
  <div class="aero-glass rounded-lg p-4 aero-border">
    <!-- 标题和切换 -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <component :is="trendIcon" :class="['w-5 h-5', trendColor]" />
        <h3 class="text-white font-semibold">体重趋势</h3>
      </div>
      <div class="flex gap-1">
        <button
          :class="[
            'px-3 py-1 rounded text-sm font-medium transition-colors',
            period === 'week' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
          ]"
          @click="emit('update:period', 'week')"
        >
          周
        </button>
        <button
          :class="[
            'px-3 py-1 rounded text-sm font-medium transition-colors',
            period === 'month' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
          ]"
          @click="emit('update:period', 'month')"
        >
          月
        </button>
        <button
          :class="[
            'px-3 py-1 rounded text-sm font-medium transition-colors',
            period === 'year' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
          ]"
          @click="emit('update:period', 'year')"
        >
          年
        </button>
      </div>
    </div>

    <!-- 图表 -->
    <div class="h-48 relative">
      <div v-if="!hasData" class="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
        暂无体重数据，点击上方按钮添加记录
      </div>
      <Line
        v-else
        :data="chartData"
        :options="chartOptions"
        height="100%"
      />
    </div>
  </div>
</template>

<style scoped>
@import '../styles/aero.css';
</style>
