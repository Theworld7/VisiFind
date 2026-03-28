<script setup>
import { ref, watch, computed } from 'vue'
import { Pencil, Check, X } from 'lucide-vue-next'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  current: {
    type: Number,
    default: 0
  },
  limit: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    default: 'g'
  },
  editable: {
    type: Boolean,
    default: false
  },
  // 是否是热量项（不可编辑，由碳蛋脂计算）
  isCalories: {
    type: Boolean,
    default: false
  },
  // 热量单位：kJ 或 kcal
  caloriesUnit: {
    type: String,
    default: 'kJ'
  }
})

const emit = defineEmits(['update:limit', 'toggle-calories-unit'])

const isEditing = ref(false)
const editValue = ref(props.limit)

// 监听 limit 变化更新编辑值（只在非编辑状态下更新）
watch(() => props.limit, (val) => {
  if (!isEditing.value) {
    editValue.value = val
  }
})

const startEdit = () => {
  editValue.value = props.limit
  isEditing.value = true
}

const saveEdit = () => {
  emit('update:limit', editValue.value)
  isEditing.value = false
}

const cancelEdit = () => {
  isEditing.value = false
}

// 计算进度百分比
const progress = computed(() => {
  if (props.limit <= 0) return 0
  return Math.min((props.current / props.limit) * 100, 100)
})

// 根据进度返回颜色类
const progressColor = computed(() => {
  const ratio = props.current / props.limit
  if (ratio >= 1) return 'bg-red-500'
  if (ratio >= 0.8) return 'bg-yellow-500'
  return 'bg-green-500'
})

// 显示的值（热量根据单位转换）
const displayCurrent = computed(() => {
  if (props.isCalories && props.caloriesUnit === 'kcal') {
    return Math.round(props.current / 4.184)
  }
  return props.current
})

const displayLimit = computed(() => {
  if (props.isCalories && props.caloriesUnit === 'kcal') {
    return Math.round(props.limit / 4.184)
  }
  return props.limit
})

const displayUnit = computed(() => {
  if (props.isCalories) {
    return props.caloriesUnit === 'kJ' ? '千焦' : '大卡'
  }
  return props.unit
})
</script>

<template>
  <div class="aero-glass rounded-lg p-4 aero-border">
    <div class="flex items-center justify-between mb-2">
      <span class="text-white/80 text-sm font-medium">{{ label }}</span>
      <template v-if="isCalories">
        <div class="flex items-center gap-2">
          <span class="text-white font-semibold">{{ displayCurrent }} / {{ displayLimit }} {{ displayUnit }}</span>
          <button
            class="text-xs px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
            @click="$emit('toggle-calories-unit')"
          >
            {{ caloriesUnit === 'kJ' ? '大卡' : '千焦' }}
          </button>
        </div>
      </template>
      <template v-else-if="isEditing">
        <div class="flex items-center gap-1">
          <input
            v-model.number="editValue"
            type="number"
            class="w-20 px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-sm focus:outline-none"
          />
          <button class="p-1 rounded hover:bg-white/10 text-green-400" @click="saveEdit">
            <Check class="w-4 h-4" />
          </button>
          <button class="p-1 rounded hover:bg-white/10 text-white/60" @click="cancelEdit">
            <X class="w-4 h-4" />
          </button>
        </div>
      </template>
      <template v-else>
        <span class="text-white font-semibold">{{ current }} / {{ limit }} {{ unit }}</span>
        <button
          v-if="editable"
          class="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white"
          @click="startEdit"
        >
          <Pencil class="w-4 h-4" />
        </button>
      </template>
    </div>
    <div class="h-2 bg-white/10 rounded-full overflow-hidden">
      <div
        class="h-full transition-all duration-300"
        :class="progressColor"
        :style="{ width: `${progress}%` }"
      />
    </div>
  </div>
</template>

<style scoped>
@import '../styles/aero.css';
</style>