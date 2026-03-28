<script setup>
import { computed } from 'vue'
import { Utensils, Coffee, Sun, Moon, Plus } from 'lucide-vue-next'

const props = defineProps({
  mealType: {
    type: String,
    required: true // 'breakfast', 'lunch', 'dinner', 'snack'
  },
  foods: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['add-food', 'remove-food', 'update-quantity'])

// 餐次配置
const mealConfig = {
  breakfast: { label: '早餐', icon: Coffee, color: 'from-orange-500/20 to-yellow-500/20' },
  lunch: { label: '午餐', icon: Sun, color: 'from-yellow-500/20 to-red-500/20' },
  dinner: { label: '晚餐', icon: Moon, color: 'from-purple-500/20 to-blue-500/20' },
  snack: { label: '加餐', icon: Utensils, color: 'from-green-500/20 to-teal-500/20' }
}

const config = mealConfig[props.mealType] || mealConfig.snack
const IconComponent = config.icon

// 计算当前餐次的热量（根据碳蛋脂）
const mealCalories = computed(() => {
  const carbs = props.foods.reduce((sum, food) => sum + (isNaN(food.carbs) ? 0 : food.carbs), 0)
  const protein = props.foods.reduce((sum, food) => sum + (isNaN(food.protein) ? 0 : food.protein), 0)
  const fat = props.foods.reduce((sum, food) => sum + (isNaN(food.fat) ? 0 : food.fat), 0)
  // 热量计算：碳水 17kJ/g + 蛋白质 17kJ/g + 脂肪 37kJ/g
  return Math.round(carbs * 17 + protein * 17 + fat * 37)
})

// 计算当前餐次的营养素
const mealNutrients = computed(() => {
  return props.foods.reduce((acc, food) => ({
    carbs: acc.carbs + (isNaN(food.carbs) ? 0 : food.carbs),
    protein: acc.protein + (isNaN(food.protein) ? 0 : food.protein),
    fat: acc.fat + (isNaN(food.fat) ? 0 : food.fat)
  }), { carbs: 0, protein: 0, fat: 0 })
})

const handleAddFood = () => {
  emit('add-food', props.mealType)
}

const handleRemoveFood = (recordId) => {
  emit('remove-food', recordId)
}

const handleUpdateQuantity = (recordId, quantity) => {
  emit('update-quantity', recordId, quantity)
}
</script>

<template>
  <div class="aero-glass rounded-lg overflow-hidden aero-border flex flex-col">
    <!-- 餐次头部 -->
    <div class="flex items-center justify-between p-4 border-b border-white/10">
      <div class="flex items-center gap-3">
        <div :class="`p-2 rounded-lg bg-gradient-to-br ${config.color}`">
          <IconComponent class="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 class="text-white font-semibold">{{ config.label }}</h3>
          <p class="text-xs text-white/50">
            {{ mealNutrients.carbs.toFixed(1) }}g 碳水 · {{ mealNutrients.protein.toFixed(1) }}g 蛋白质 · {{ mealNutrients.fat.toFixed(1) }}g 脂肪
          </p>
        </div>
      </div>
      <div class="text-right">
        <div class="text-2xl font-bold text-white">{{ mealCalories }}</div>
        <div class="text-xs text-white/50">千焦</div>
      </div>
    </div>

    <!-- 食物列表 -->
    <div class="p-4 flex-1">
      <div v-if="foods.length === 0" class="text-center py-6 text-white/40 text-sm">
        暂无食物，点击右上角添加
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="food in foods"
          :key="food.id"
          class="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        >
          <!-- 食物图片 -->
          <div class="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-white/10">
            <img
              v-if="food.image"
              :src="food.image"
              :alt="food.name"
              class="w-full h-full object-cover"
            />
            <span v-else class="w-full h-full flex items-center justify-center text-xs text-white/40">无图</span>
          </div>

          <!-- 食物信息 -->
          <div class="flex-1 min-w-0">
            <div class="text-white text-sm font-medium truncate">{{ food.name }}</div>
            <div class="text-xs text-white/50">
              {{ food.quantity }}{{ food.unit }} · {{ food.carbs }}g 碳 · {{ food.protein }}g 蛋 · {{ food.fat }}g 脂
            </div>
          </div>

          <!-- 数量调整 -->
          <div class="flex items-center gap-2">
            <input
              type="number"
              :value="food.quantity"
              @input="handleUpdateQuantity(food.recordId, $event.target.value)"
              class="w-16 px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-sm text-center focus:outline-none"
            />
            <button
              class="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
              @click="handleRemoveFood(food.recordId)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加按钮 -->
    <div class="p-3 border-t border-white/10">
      <button
        class="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-sm font-medium transition-colors"
        @click="handleAddFood"
      >
        <Plus class="w-4 h-4" />
        添加食物
      </button>
    </div>
  </div>
</template>

<style scoped>
@import '../styles/aero.css';
</style>