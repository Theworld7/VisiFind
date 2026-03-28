<script setup>
import { ref, computed, onMounted } from 'vue'
import { X, Plus, Save } from 'lucide-vue-next'
import Modal from './Modal.vue'
import DatePicker from './DatePicker.vue'
import { addIntakeRecord, getAllFoods } from '../lib/intakeDb.js'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:open', 'saved'])

// 表单数据
const selectedDate = ref(new Date().toISOString().split('T')[0])
const mealType = ref('breakfast')
const selectedFoods = ref([])

// 食物库
const foodLibrary = ref([])
const searchQuery = ref('')

onMounted(async () => {
  foodLibrary.value = await getAllFoods()
})

// 过滤食物列表
const filteredFoods = computed(() => {
  if (!searchQuery.value) return foodLibrary.value
  const query = searchQuery.value.toLowerCase()
  return foodLibrary.value.filter(food =>
    food.name.toLowerCase().includes(query)
  )
})

// 餐次选项
const mealOptions = [
  { value: 'breakfast', label: '早餐' },
  { value: 'lunch', label: '午餐' },
  { value: 'dinner', label: '晚餐' },
  { value: 'snack', label: '加餐' }
]

// 添加食物到选择列表
const addFoodToSelection = (food) => {
  const exists = selectedFoods.value.find(f => f.id === food.id)
  if (!exists) {
    selectedFoods.value.push({
      ...food,
      quantity: food.quantity || 100
    })
  }
}

// 从选择列表移除
const removeFoodFromSelection = (foodId) => {
  selectedFoods.value = selectedFoods.value.filter(f => f.id !== foodId)
}

// 更新食物数量
const updateFoodQuantity = (foodId, quantity) => {
  const food = selectedFoods.value.find(f => f.id === foodId)
  if (food) {
    food.quantity = parseFloat(quantity) || 0
  }
}

// 关闭表单
const handleClose = () => {
  emit('update:open', false)
  resetForm()
}

// 重置表单
const resetForm = () => {
  selectedDate.value = new Date().toISOString().split('T')[0]
  mealType.value = 'breakfast'
  selectedFoods.value = []
  searchQuery.value = ''
}

// 保存记录
const handleSave = async () => {
  if (selectedFoods.value.length === 0) return

  for (const food of selectedFoods.value) {
    const ratio = food.quantity / (food.quantity || 100)
    const carbs = Math.round(food.carbs * ratio * 10) / 10
    const protein = Math.round(food.protein * ratio * 10) / 10
    const fat = Math.round(food.fat * ratio * 10) / 10
    // 热量计算：碳水 17kJ/g + 蛋白质 17kJ/g + 脂肪 37kJ/g
    const calories = Math.round(carbs * 17 + protein * 17 + fat * 37)
    
    await addIntakeRecord({
      date: selectedDate.value,
      mealType: mealType.value,
      foodId: food.id,
      foodName: food.name,
      foodImage: food.image,
      quantity: food.quantity,
      unit: food.unit,
      carbs,
      protein,
      fat,
      calories
    })
  }

  emit('saved')
  handleClose()
}

// 计算总热量（根据碳蛋脂）
const totalCalories = computed(() => {
  return selectedFoods.value.reduce((sum, food) => {
    const ratio = food.quantity / (food.quantity || 100)
    const carbs = food.carbs * ratio
    const protein = food.protein * ratio
    const fat = food.fat * ratio
    // 热量计算：碳水 17kJ/g + 蛋白质 17kJ/g + 脂肪 37kJ/g
    return sum + Math.round(carbs * 17 + protein * 17 + fat * 37)
  }, 0)
})
</script>

<template>
  <Modal :open="open" @update:open="$emit('update:open', $event)" title="记录摄入">
    <div class="space-y-4">
      <!-- 日期和餐次选择 -->
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-white/80 mb-1">日期</label>
          <DatePicker v-model="selectedDate" />
        </div>
        <div>
          <label class="block text-sm font-medium text-white/80 mb-1">餐次</label>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="option in mealOptions"
              :key="option.value"
              :class="[
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                mealType === option.value
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              ]"
              @click="mealType = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 已选食物列表 -->
      <div v-if="selectedFoods.length > 0" class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-white/80">已选食物</label>
          <span class="text-xs text-white/50">总计：{{ totalCalories }} kJ</span>
        </div>
        <div class="space-y-2 max-h-48 overflow-y-auto">
          <div
            v-for="food in selectedFoods"
            :key="food.id"
            class="flex items-center gap-2 p-2 rounded bg-white/5"
          >
            <div class="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-white/10">
              <img
                v-if="food.image"
                :src="food.image"
                :alt="food.name"
                class="w-full h-full object-cover"
              />
              <span v-else class="w-full h-full flex items-center justify-center text-xs text-white/40">无图</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-white text-sm font-medium truncate">{{ food.name }}</div>
              <div class="text-xs text-white/50">{{ food.carbs }}g 碳 · {{ food.protein }}g 蛋 · {{ food.fat }}g 脂</div>
            </div>
            <input
              type="number"
              :value="food.quantity"
              @input="updateFoodQuantity(food.id, $event.target.value)"
              class="w-16 px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-sm text-center focus:outline-none"
            />
            <span class="text-white/60 text-sm w-8">{{ food.unit }}</span>
            <button
              class="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
              @click="removeFoodFromSelection(food.id)"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- 食物搜索添加 -->
      <div>
        <label class="block text-sm font-medium text-white/80 mb-1">添加食物</label>
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索食物..."
            class="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
        <div class="mt-2 max-h-40 overflow-y-auto space-y-1">
          <div
            v-for="food in filteredFoods"
            :key="food.id"
            class="flex items-center justify-between p-2 rounded hover:bg-white/10 transition-colors"
          >
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-white/10">
                <img
                  v-if="food.image"
                  :src="food.image"
                  :alt="food.name"
                  class="w-full h-full object-cover"
                />
                <span v-else class="w-full h-full flex items-center justify-center text-xs text-white/40">无图</span>
              </div>
              <div>
                <div class="text-white text-sm">{{ food.name }}</div>
                <div class="text-xs text-white/50">{{ food.carbs }}g 碳 · {{ food.protein }}g 蛋 · {{ food.fat }}g 脂</div>
              </div>
            </div>
            <button
              class="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors"
              @click="addFoodToSelection(food)"
            >
              <Plus class="w-4 h-4" />
            </button>
          </div>
          <div v-if="filteredFoods.length === 0" class="text-center py-4 text-white/40 text-sm">
            暂无食物数据
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end gap-2 pt-2">
        <button
          type="button"
          class="px-4 py-2 rounded-md text-white/70 hover:text-white transition-colors"
          @click="handleClose"
        >
          取消
        </button>
        <button
          type="button"
          :disabled="selectedFoods.length === 0"
          class="px-4 py-2 rounded-md bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:text-white/30 text-white font-medium transition-colors flex items-center gap-2"
          @click="handleSave"
        >
          <Save class="w-4 h-4" />
          保存记录
        </button>
      </div>
    </div>
  </Modal>
</template>