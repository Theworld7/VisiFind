<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search } from 'lucide-vue-next'
import Modal from './Modal.vue'
import { getAllFoods } from '../lib/intakeDb.js'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  mealType: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:open', 'add-food'])

const searchQuery = ref('')
const selectedFood = ref(null)
const quantity = ref(100)

// 食物库
const foodLibrary = ref([])

// 从 IndexedDB 加载食物库
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

const handleClose = () => {
  emit('update:open', false)
  searchQuery.value = ''
  selectedFood.value = null
  quantity.value = 100
}

const selectFood = (food) => {
  selectedFood.value = food
  // 默认数量为食物的单位数量（如 100g）
  quantity.value = food.quantity || 100
}

const confirmAdd = () => {
  if (selectedFood.value) {
    emit('add-food', {
      food: selectedFood.value,
      quantity: quantity.value,
      mealType: props.mealType
    })
    handleClose()
  }
}
</script>

<template>
  <Modal :open="open" @update:open="$emit('update:open', $event)" title="添加食物">
    <div class="space-y-4">
      <!-- 搜索框 -->
      <div class="relative">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索食物..."
          class="w-full pl-10 pr-4 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
        />
      </div>

      <!-- 食物列表 -->
      <div class="max-h-60 overflow-y-auto space-y-2">
        <div
          v-for="food in filteredFoods"
          :key="food.id"
          :class="[
            'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors',
            selectedFood?.id === food.id ? 'bg-white/20 border border-white/30' : 'bg-white/5 hover:bg-white/10 border border-transparent'
          ]"
          @click="selectFood(food)"
        >
          <div class="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-white/10">
            <img
              v-if="food.image"
              :src="food.image"
              :alt="food.name"
              class="w-full h-full object-cover"
            />
            <span v-else class="w-full h-full flex items-center justify-center text-xs text-white/40">无图</span>
          </div>
          <div class="flex-1">
            <div class="text-white text-sm font-medium">{{ food.name }}</div>
            <div class="text-xs text-white/50">
              {{ food.carbs }}g 碳水 · {{ food.protein }}g 蛋白质 · {{ food.fat }}g 脂肪 · {{ food.calories }}kJ
            </div>
          </div>
        </div>
        <div v-if="filteredFoods.length === 0" class="text-center py-8 text-white/40 text-sm">
          暂无食物数据
        </div>
      </div>

      <!-- 数量输入 -->
      <div v-if="selectedFood">
        <label class="block text-sm font-medium text-white/80 mb-1">摄入量</label>
        <div class="flex items-center gap-2">
          <input
            v-model.number="quantity"
            type="number"
            min="0"
            step="0.1"
            class="flex-1 px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <span class="text-white/60 w-12">{{ selectedFood.unit }}</span>
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
          :disabled="!selectedFood"
          class="px-4 py-2 rounded-md bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:text-white/30 text-white font-medium transition-colors"
          @click="confirmAdd"
        >
          添加
        </button>
      </div>
    </div>
  </Modal>
</template>