<script setup>
import { computed } from 'vue'
import { Clock, DollarSign, CheckCircle, XCircle } from 'lucide-vue-next'

const props = defineProps({
  /**
   * 物品数据
   * @type {{ id: string, name: string, image: string, price: number, purchaseDate: string, inService: boolean }}
   */
  item: {
    type: Object,
    required: true,
  },
  /**
   * 服役天数计算函数
   */
  serviceDays: {
    type: Number,
    required: true,
  },
  /**
   * 平均成本计算函数
   */
  avgCost: {
    type: [Number, String],
    required: true,
  },
})

const emit = defineEmits(['edit', 'delete'])

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '未知'
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// 格式化价格
const formatPrice = (price) => {
  if (!price) return '¥0.00'
  return `¥${Number(price).toFixed(2)}`
}

// 平均成本格式化
const formatAvgCost = (cost) => {
  if (!cost || cost === '0.00') return '¥0.00/天'
  return `¥${Number(cost).toFixed(2)}/天`
}
</script>

<template>
  <div class="group relative aero-glass aero-border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/30 hover:scale-[1.02] cursor-pointer">
    <!-- 图片区域 -->
    <div class="relative h-48 overflow-hidden bg-black/20">
      <img
        v-if="item.image"
        :src="item.image"
        :alt="item.name"
        class="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
        @error="$event.target.style.display = 'none'"
      />
      <div
        v-else
        class="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-white/5"
      >
        <span class="text-white/40 text-4xl">📦</span>
      </div>

      <!-- 服役状态标签 -->
      <div
        class="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium aero-glass aero-border flex items-center gap-1.5"
        :class="item.inService ? 'bg-green-500/30 text-green-100 border-green-300/30' : 'bg-gray-500/30 text-gray-200 border-gray-400/30'"
      >
        <CheckCircle v-if="item.inService" class="w-3.5 h-3.5" />
        <XCircle v-else class="w-3.5 h-3.5" />
        {{ item.inService ? '服役中' : '已退役' }}
      </div>

      <!-- 悬停操作按钮 -->
      <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
        <button
          class="px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-all aero-border hover:scale-105"
          @click.stop="emit('edit', item)"
        >
          编辑
        </button>
        <button
          class="px-4 py-2 rounded-full bg-red-500/80 hover:bg-red-600 text-white text-sm font-medium transition-all hover:scale-105"
          @click.stop="emit('delete', item)"
        >
          删除
        </button>
      </div>
    </div>

    <!-- 信息区域 -->
    <div class="p-4 space-y-3">
      <!-- 名称 -->
      <h3 class="text-lg font-semibold text-white truncate" :title="item.name">
        {{ item.name }}
      </h3>

      <!-- 购入信息 -->
      <div class="flex items-center gap-2 text-white/70 text-sm">
        <DollarSign class="w-4 h-4" />
        <span>购入价格：</span>
        <span class="text-white font-medium">{{ formatPrice(item.price) }}</span>
      </div>

      <div class="flex items-center gap-2 text-white/70 text-sm">
        <Clock class="w-4 h-4" />
        <span>购入时间：</span>
        <span class="text-white">{{ formatDate(item.purchaseDate) }}</span>
      </div>

      <!-- 分隔线 -->
      <div class="border-t border-white/10"></div>

      <!-- 统计信息 -->
      <div class="grid grid-cols-2 gap-3">
        <div class="text-center p-2 rounded-lg bg-white/5 aero-border">
          <div class="text-xs text-white/60 mb-1">服役时间</div>
          <div class="text-sm font-semibold text-white">{{ serviceDays }} 天</div>
        </div>
        <div class="text-center p-2 rounded-lg bg-white/5 aero-border">
          <div class="text-xs text-white/60 mb-1">平均成本</div>
          <div class="text-sm font-semibold text-white">{{ formatAvgCost(avgCost) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '../styles/aero.css';
</style>
