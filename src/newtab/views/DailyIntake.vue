<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import DatePicker from '../components/DatePicker.vue'
import NutrientProgress from '../components/NutrientProgress.vue'
import MealSection from '../components/MealSection.vue'
import CalorieTrend from '../components/CalorieTrend.vue'
import FoodSelector from '../components/FoodSelector.vue'
import IntakeForm from '../components/IntakeForm.vue'
import {
  getIntakeRecordsByDate,
  getIntakeRecordsByDateRange,
  addIntakeRecord,
  deleteIntakeRecord,
  getIntakeLimits,
  setIntakeLimit
} from '../lib/intakeDb.js'
import { getAppSetting, setAppSetting } from '../lib/db.js'

// 当前选择的日期
const selectedDate = ref(new Date().toISOString().split('T')[0])

// 摄入限制
const limits = ref({
  carbs: 300,
  protein: 150,
  fat: 80
})

// 当前日期的摄入记录
const todayRecords = ref([])

// 所有记录（用于趋势图）
const allRecords = ref([])

// 食物选择器状态
const isFoodSelectorOpen = ref(false)
const currentMealType = ref('')

// 热量单位
const caloriesUnit = ref('kJ') // 'kJ' | 'kcal'

// 计算热量上限（根据碳蛋脂上限）
const caloriesLimit = computed(() => {
  return Math.round(limits.value.carbs * 17 + limits.value.protein * 17 + limits.value.fat * 37)
})

// 加载摄入限制
const loadLimits = async () => {
  const savedLimits = await getIntakeLimits()
  limits.value = { ...limits.value, ...savedLimits }
  // 加载热量单位
  const savedUnit = await getAppSetting('caloriesUnit')
  if (savedUnit) {
    caloriesUnit.value = savedUnit
  }
}

// 更新摄入限制
const updateLimit = async (key, value) => {
  await setIntakeLimit(key, value)
  limits.value[key] = value
}

// 切换热量单位
const toggleCaloriesUnit = () => {
  caloriesUnit.value = caloriesUnit.value === 'kJ' ? 'kcal' : 'kJ'
  setAppSetting('caloriesUnit', caloriesUnit.value)
}

// 加载指定日期的记录
const loadRecords = async (date) => {
  todayRecords.value = await getIntakeRecordsByDate(date)
  // 加载 30 天记录用于趋势图
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)
  allRecords.value = await getIntakeRecordsByDateRange(
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  )
}

// 计算当前摄入总量（碳蛋脂从记录累加，热量根据碳蛋脂计算）
const currentIntake = computed(() => {
  const carbs = todayRecords.value.reduce((sum, r) => sum + (isNaN(r.carbs) ? 0 : r.carbs), 0)
  const protein = todayRecords.value.reduce((sum, r) => sum + (isNaN(r.protein) ? 0 : r.protein), 0)
  const fat = todayRecords.value.reduce((sum, r) => sum + (isNaN(r.fat) ? 0 : r.fat), 0)
  // 热量计算：碳水 17kJ/g + 蛋白质 17kJ/g + 脂肪 37kJ/g
  const calories = Math.round(carbs * 17 + protein * 17 + fat * 37)

  // 碳蛋脂保留一位小数（截取方式）
  return {
    carbs: Math.trunc(carbs * 10) / 10,
    protein: Math.trunc(protein * 10) / 10,
    fat: Math.trunc(fat * 10) / 10,
    calories
  }
})

// 按餐次分组的食物
const meals = computed(() => {
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
  const result = {}

  mealTypes.forEach(type => {
    result[type] = todayRecords.value
      .filter(r => r.mealType === type)
      .map(r => ({
        recordId: r.id,
        id: r.foodId,
        name: r.foodName,
        image: r.foodImage,
        quantity: r.quantity,
        unit: r.unit,
        carbs: r.carbs,
        protein: r.protein,
        fat: r.fat,
        calories: r.calories
      }))
  })

  return result
})

// 打开食物选择器
const openFoodSelector = (mealType) => {
  currentMealType.value = mealType
  isFoodSelectorOpen.value = true
}

// 添加食物
const handleAddFood = async ({ food, quantity, mealType }) => {
  const ratio = quantity / (food.quantity || 100)
  const carbs = Math.round(food.carbs * ratio * 10) / 10
  const protein = Math.round(food.protein * ratio * 10) / 10
  const fat = Math.round(food.fat * ratio * 10) / 10
  // 热量计算：碳水 17kJ/g + 蛋白质 17kJ/g + 脂肪 37kJ/g
  const calories = Math.round(carbs * 17 + protein * 17 + fat * 37)
  
  await addIntakeRecord({
    date: selectedDate.value,
    mealType,
    foodId: food.id,
    foodName: food.name,
    foodImage: food.image,
    quantity,
    unit: food.unit,
    carbs,
    protein,
    fat,
    calories
  })
  await loadRecords(selectedDate.value)
}

// 删除食物
const handleRemoveFood = async (recordId) => {
  await deleteIntakeRecord(recordId)
  await loadRecords(selectedDate.value)
}

// 更新数量
const handleUpdateQuantity = async (recordId, quantity) => {
  const record = todayRecords.value.find(r => r.id === recordId)
  if (record) {
    // 空值或无效输入按 0 处理
    const newQuantity = parseFloat(quantity)
    if (isNaN(newQuantity) || newQuantity <= 0) {
      // 数量为 0 或负数时删除记录
      await deleteIntakeRecord(recordId)
      await loadRecords(selectedDate.value)
      return
    }
    
    const originalQuantity = record.quantity
    // 防止除以 0 或 NaN
    if (!originalQuantity || isNaN(originalQuantity) || originalQuantity <= 0) {
      // 原数量为 0 或无效时，直接使用新数量，不重新计算营养
      await deleteIntakeRecord(recordId)
      await addIntakeRecord({
        date: selectedDate.value,
        mealType: record.mealType,
        foodId: record.foodId,
        foodName: record.foodName,
        foodImage: record.foodImage,
        quantity: newQuantity,
        unit: record.unit,
        carbs: record.carbs,
        protein: record.protein,
        fat: record.fat,
        calories: record.calories
      })
      await loadRecords(selectedDate.value)
      return
    }
    
    const ratio = newQuantity / originalQuantity
    await deleteIntakeRecord(recordId)
    await addIntakeRecord({
      date: selectedDate.value,
      mealType: record.mealType,
      foodId: record.foodId,
      foodName: record.foodName,
      foodImage: record.foodImage,
      quantity: newQuantity,
      unit: record.unit,
      carbs: Math.round(record.carbs * ratio * 10) / 10,
      protein: Math.round(record.protein * ratio * 10) / 10,
      fat: Math.round(record.fat * ratio * 10) / 10,
      calories: Math.round(record.calories * ratio)
    })
    await loadRecords(selectedDate.value)
  }
}

// 监听日期变化
watch(selectedDate, (newDate) => {
  loadRecords(newDate)
})

onMounted(() => {
  loadLimits()
  loadRecords(selectedDate.value)
})
</script>

<template>
  <main class="h-full">
    <div class="max-w-6xl mx-auto px-4 pt-24 pb-8 space-y-6">
      <!-- 日期选择 -->
      <div class="flex items-center justify-center">
        <DatePicker v-model="selectedDate" />
      </div>

      <!-- 营养摄入概览 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <NutrientProgress
          label="碳水"
          :current="currentIntake.carbs"
          :limit="limits.carbs"
          unit="g"
          editable
          @update:limit="updateLimit('carbs', $event)"
        />
        <NutrientProgress
          label="蛋白质"
          :current="currentIntake.protein"
          :limit="limits.protein"
          unit="g"
          editable
          @update:limit="updateLimit('protein', $event)"
        />
        <NutrientProgress
          label="脂肪"
          :current="currentIntake.fat"
          :limit="limits.fat"
          unit="g"
          editable
          @update:limit="updateLimit('fat', $event)"
        />
        <NutrientProgress
          label="热量"
          :current="currentIntake.calories"
          :limit="caloriesLimit"
          unit="kJ"
          :is-calories="true"
          :calories-unit="caloriesUnit"
          @toggle-calories-unit="toggleCaloriesUnit"
        />
      </div>

      <!-- 餐次管理 -->
      <div class="grid md:grid-cols-2 gap-4">
        <MealSection
          meal-type="breakfast"
          :foods="meals.breakfast"
          @add-food="openFoodSelector"
          @remove-food="handleRemoveFood"
          @update-quantity="handleUpdateQuantity"
        />
        <MealSection
          meal-type="lunch"
          :foods="meals.lunch"
          @add-food="openFoodSelector"
          @remove-food="handleRemoveFood"
          @update-quantity="handleUpdateQuantity"
        />
        <MealSection
          meal-type="dinner"
          :foods="meals.dinner"
          @add-food="openFoodSelector"
          @remove-food="handleRemoveFood"
          @update-quantity="handleUpdateQuantity"
        />
        <MealSection
          meal-type="snack"
          :foods="meals.snack"
          @add-food="openFoodSelector"
          @remove-food="handleRemoveFood"
          @update-quantity="handleUpdateQuantity"
        />
      </div>

      <!-- 热量趋势图 -->
      <CalorieTrend :records="allRecords" :calories-limit="caloriesLimit" />
    </div>

    <!-- 食物选择器 -->
    <FoodSelector
      :open="isFoodSelectorOpen"
      @update:open="isFoodSelectorOpen = $event"
      :meal-type="currentMealType"
      @add-food="handleAddFood"
    />
  </main>
</template>