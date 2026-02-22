<script setup lang="ts">
import { h, onMounted, reactive, ref, computed, toRaw } from 'vue'
import type { DataTableColumn, UploadFileInfo } from 'naive-ui'
import { useMessage } from 'naive-ui'
import {
  NButton,
  NDataTable,
  NDatePicker,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NImage,
  NInput,
  NInputNumber,
  NInputGroup,
  NSpace,
  NUpload,
  NList,
  NListItem,
  NCalendar,
  NCard,
  NEmpty,
  NModal,
  NSelect,
  NRadioGroup,
  NRadioButton,
} from 'naive-ui'
import { useFoodLibrary, type FoodItem } from '@/composables/useFoodLibrary'
import { useIntakeRecord, type IntakeRecord } from '@/composables/useIntakeRecord'
import CustomTabs from '@/components/CustomTabs.vue'

interface FoodItemWithId extends FoodItem {
  id: number
}

const { initDB, loadFoods, addFood, deleteFood, updateFood, foods } = useFoodLibrary()
const {
  initDB: initIntakeDB,
  loadRecordsByDate,
  addRecord,
  deleteRecord,
  records,
  dailyLimits,
  calculateDailyTotals,
  getRecordsByMealType,
  loadDailyLimits,
  saveDailyLimits,
} = useIntakeRecord()
const message = useMessage()

const data = ref<FoodItemWithId[]>([])
const selectedDate = ref(new Date().toISOString().split('T')[0]!)
const activeTab = ref('intake')

const modalVisible = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const intakeForm = reactive({
  date: new Date().getTime(),
  mealType: 'breakfast' as 'breakfast' | 'lunch' | 'dinner',
  selectedFoods: [] as number[],
  quantity: 100,
})

const selectedFoodUnit = computed(() => {
  if (intakeForm.selectedFoods.length === 0) return 'g'
  const food = data.value.find((f) => f.id === intakeForm.selectedFoods[0])
  return food?.unit || 'g'
})

const mealOptions = [
  { label: '早餐', value: 'breakfast' },
  { label: '午餐', value: 'lunch' },
  { label: '晚餐', value: 'dinner' },
]

const foodOptions = computed(() =>
  data.value.map((food) => ({
    label: food.name,
    value: food.id,
  })),
)

const tabs = [
  { name: 'intake', label: '摄入记录' },
  { name: 'food-library', label: '食物库' },
]

const intakeRecords = computed(() => records.value)

const dailyTotals = computed(() => calculateDailyTotals(selectedDate.value))

const breakfastRecords = computed(() => getRecordsByMealType(selectedDate.value, 'breakfast'))
const lunchRecords = computed(() => getRecordsByMealType(selectedDate.value, 'lunch'))
const dinnerRecords = computed(() => getRecordsByMealType(selectedDate.value, 'dinner'))

onMounted(async () => {
  await initDB()
  const loadedFoods = await loadFoods()
  data.value = loadedFoods as FoodItemWithId[]

  await initIntakeDB()
  await loadRecordsByDate(selectedDate.value)
  await loadDailyLimits()
})

const handleDateChange = async (date: string) => {
  const dateStr = new Date(date).toISOString().split('T')[0]!
  selectedDate.value = dateStr
  await loadRecordsByDate(dateStr)
}

const handleLimitsChange = async () => {
  await saveDailyLimits(dailyLimits.value)
}

const columns: DataTableColumn<FoodItemWithId>[] = [
  {
    title: '图片',
    key: 'image',
    align: 'center',
    width: 80,
    render: (row) => {
      return h(NImage, {
        src: row.image,
        objectFit: 'cover',
        width: 40,
        height: 40,
        round: true,
      })
    },
  },
  {
    title: '食物',
    key: 'name',
    align: 'left',
    ellipsis: true,
  },
  {
    title: '类别',
    key: 'category',
    align: 'center',
  },
  {
    title: '数量/单位',
    key: 'quantity',
    align: 'center',
    render: (row: FoodItem) => {
      return `${row.quantity}${row.unit}`
    },
  },
  {
    title: '碳水(g)',
    key: 'carbs',
    align: 'center',
  },
  {
    title: '蛋白质(g)',
    key: 'protein',
    align: 'center',
  },
  {
    title: '脂肪(g)',
    key: 'fat',
    align: 'center',
  },
  {
    title: '热量(kcal)',
    key: 'calories',
    align: 'center',
  },
  {
    title: '操作',
    key: 'actions',
    align: 'center',
    width: 120,
    render: (row: FoodItemWithId) => {
      return h(
        NSpace,
        { justify: 'center' },
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                text: true,
                type: 'primary',
                onClick: () => openEditDrawer(row),
              },
              { default: () => '编辑' },
            ),
            h(
              NButton,
              {
                size: 'small',
                text: true,
                type: 'error',
                onClick: async () => {
                  try {
                    await deleteFood(row.id)
                    data.value = data.value.filter((item) => item.id !== row.id)
                    message.success('删除成功')
                  } catch {
                    message.error('删除失败')
                  }
                },
              },
              { default: () => '删除' },
            ),
          ],
        },
      )
    },
  },
]

const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit'>('add')
const formData = reactive<FoodItem>({
  image: '',
  name: '',
  category: '',
  quantity: 100,
  unit: 'g',
  carbs: 0,
  protein: 0,
  fat: 0,
  calories: 0,
})

const handleUpload = (options: { file: UploadFileInfo }) => {
  const file = options.file.file
  if (file) {
    const maxSize = 500 * 1024 // 500KB
    if (file.size > maxSize) {
      message.warning('图片大小不能超过 500KB')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      formData.image = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const openDrawer = () => {
  Object.assign(formData, {
    image: '',
    name: '',
    category: '',
    quantity: 100,
    unit: 'g',
    carbs: 0,
    protein: 0,
    fat: 0,
    calories: 0,
  })
  drawerMode.value = 'add'
  drawerVisible.value = true
}

const openEditDrawer = (food: FoodItemWithId) => {
  Object.assign(formData, { ...food })
  drawerMode.value = 'edit'
  drawerVisible.value = true
}

const handleSave = async () => {
  try {
    if (drawerMode.value === 'edit') {
      await updateFood(toRaw(formData))
      const index = data.value.findIndex((item) => item.id === formData.id)
      if (index !== -1) {
        data.value[index] = { ...toRaw(formData), id: formData.id! } as FoodItemWithId
      }
      message.success('更新成功')
    } else {
      const id = await addFood(toRaw(formData))
      data.value.push({ ...toRaw(formData), id })
      message.success('保存成功')
    }
    drawerVisible.value = false
  } catch {
    message.error('保存失败')
  }
}

const openIntakeModal = () => {
  Object.assign(intakeForm, {
    date: new Date(selectedDate.value!).getTime(),
    mealType: 'breakfast',
    selectedFoods: [],
    quantity: 100,
  })
  modalMode.value = 'add'
  modalVisible.value = true
}

const openEditModal = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
  const records =
    mealType === 'breakfast'
      ? breakfastRecords.value
      : mealType === 'lunch'
        ? lunchRecords.value
        : dinnerRecords.value

  Object.assign(intakeForm, {
    date: new Date(selectedDate.value!).getTime(),
    mealType,
    selectedFoods: records.map((r) => r.foodId),
    quantity: 100,
  })
  modalMode.value = 'edit'
  modalVisible.value = true
}

const handleIntakeSubmit = async () => {
  try {
    const dateStr = new Date(intakeForm.date).toISOString().split('T')[0]!

    if (modalMode.value === 'edit') {
      const existingRecords =
        intakeForm.mealType === 'breakfast'
          ? breakfastRecords.value
          : intakeForm.mealType === 'lunch'
            ? lunchRecords.value
            : dinnerRecords.value

      for (const record of existingRecords) {
        if (record.id) {
          await deleteRecord(record.id)
        }
      }
    }

    for (const foodId of intakeForm.selectedFoods) {
      const food = data.value.find((f) => f.id === foodId)
      if (food) {
        const ratio = intakeForm.quantity / food.quantity
        await addRecord({
          foodId: food.id,
          foodName: food.name,
          foodImage: food.image,
          quantity: intakeForm.quantity,
          unit: selectedFoodUnit.value,
          carbs: Math.round(food.carbs * ratio * 10) / 10,
          protein: Math.round(food.protein * ratio * 10) / 10,
          fat: Math.round(food.fat * ratio * 10) / 10,
          calories: Math.round(food.calories * ratio * 10) / 10,
          mealType: intakeForm.mealType,
          date: dateStr,
        })
      }
    }
    modalVisible.value = false
    await loadRecordsByDate(selectedDate.value)
    message.success('保存成功')
  } catch {
    message.error('保存失败')
  }
}
</script>

<template>
  <div class="health-page">
    <custom-tabs :tabs="tabs" v-model="activeTab" class="tabs-container">
      <div v-show="activeTab === 'intake'" class="tab-pane">
        <div class="intake-content">
          <div class="intake-left">
            <n-scrollbar style="max-height: calc(100vh - 200px)">
              <div class="intake-cards">
                <n-card class="stat-card glass-white" :bordered="false" round>
                  <div class="stat-label">碳水</div>
                  <div class="stat-value">
                    <span class="current">{{ dailyTotals?.carbs?.toFixed(1) || '0.0' }}</span>
                    <span class="separator">/</span>
                    <span class="limit">{{ dailyLimits?.carbs || 300 }}g</span>
                  </div>
                </n-card>
                <n-card class="stat-card glass-white" :bordered="false" round>
                  <div class="stat-label">蛋白质</div>
                  <div class="stat-value">
                    <span class="current">{{ dailyTotals?.protein?.toFixed(1) || '0.0' }}</span>
                    <span class="separator">/</span>
                    <span class="limit">{{ dailyLimits?.protein || 60 }}g</span>
                  </div>
                </n-card>
                <n-card class="stat-card glass-white" :bordered="false" round>
                  <div class="stat-label">脂肪</div>
                  <div class="stat-value">
                    <span class="current">{{ dailyTotals?.fat?.toFixed(1) || '0.0' }}</span>
                    <span class="separator">/</span>
                    <span class="limit">{{ dailyLimits?.fat || 60 }}g</span>
                  </div>
                </n-card>
              </div>
              <div class="intake-list glass-white">
                <n-list :hoverable="false">
                  <template #header>
                    <div class="meal-header">
                      <span>早餐</span>
                      <n-button
                        v-if="breakfastRecords.length > 0"
                        text
                        type="primary"
                        size="small"
                        @click="openEditModal('breakfast')"
                      >
                        编辑
                      </n-button>
                    </div>
                  </template>
                  <n-list-item v-if="breakfastRecords.length === 0">
                    <n-empty description="暂无记录" />
                  </n-list-item>
                  <n-list-item v-for="record in breakfastRecords" :key="record.id">
                    <div class="record-item">
                      <div class="record-left">
                        <n-image
                          :src="record.foodImage"
                          object-fit="cover"
                          width="40"
                          height="40"
                          round
                        />
                        <span class="food-name">{{ record.foodName }}</span>
                      </div>
                      <div class="record-right">
                        <span>{{ record.quantity }}{{ record.unit }}</span>
                      </div>
                    </div>
                  </n-list-item>
                </n-list>
                <n-list :hoverable="false">
                  <template #header>
                    <div class="meal-header">
                      <span>午餐</span>
                      <n-button
                        v-if="lunchRecords.length > 0"
                        text
                        type="primary"
                        size="small"
                        @click="openEditModal('lunch')"
                      >
                        编辑
                      </n-button>
                    </div>
                  </template>
                  <n-list-item v-if="lunchRecords.length === 0">
                    <n-empty description="暂无记录" />
                  </n-list-item>
                  <n-list-item v-for="record in lunchRecords" :key="record.id">
                    <div class="record-item">
                      <div class="record-left">
                        <n-image
                          :src="record.foodImage"
                          object-fit="cover"
                          width="40"
                          height="40"
                          round
                        />
                        <span class="food-name">{{ record.foodName }}</span>
                      </div>
                      <div class="record-right">
                        <span>{{ record.quantity }}{{ record.unit }}</span>
                      </div>
                    </div>
                  </n-list-item>
                </n-list>
                <n-list :hoverable="false">
                  <template #header>
                    <div class="meal-header">
                      <span>晚餐</span>
                      <n-button
                        v-if="dinnerRecords.length > 0"
                        text
                        type="primary"
                        size="small"
                        @click="openEditModal('dinner')"
                      >
                        编辑
                      </n-button>
                    </div>
                  </template>
                  <n-list-item v-if="dinnerRecords.length === 0">
                    <n-empty description="暂无记录" />
                  </n-list-item>
                  <n-list-item v-for="record in dinnerRecords" :key="record.id">
                    <div class="record-item">
                      <div class="record-left">
                        <n-image
                          :src="record.foodImage"
                          object-fit="cover"
                          width="40"
                          height="40"
                          round
                        />
                        <span class="food-name">{{ record.foodName }}</span>
                      </div>
                      <div class="record-right">
                        <span>{{ record.quantity }}{{ record.unit }}</span>
                      </div>
                    </div>
                  </n-list-item>
                </n-list>
              </div>
            </n-scrollbar>
          </div>
          <div class="intake-right">
            <n-button
              class="glass-white"
              round
              block
              :bordered="false"
              @click="openIntakeModal"
              style="color: #fff"
              >记录</n-button
            >
            <div class="glass-white date-picker-wrapper">
              <n-date-picker
                v-model:formatted-value="selectedDate"
                type="date"
                panel
                @update:formatted-value="handleDateChange"
              />
            </div>
            <n-card class="glass-white daily-limits-wrapper" :bordered="false" round size="small">
              <template #header>
                <div class="card-header">每日摄入上限</div>
              </template>
              <div class="limits-item">
                <span>碳水</span>
                <n-input-number
                  v-model:value="dailyLimits.carbs"
                  :min="0"
                  size="small"
                  style="width: 100px"
                  :show-button="false"
                  @update:value="handleLimitsChange"
                >
                  <template #suffix>g</template>
                </n-input-number>
              </div>
              <div class="limits-item">
                <span>蛋白质</span>
                <n-input-number
                  v-model:value="dailyLimits.protein"
                  :min="0"
                  size="small"
                  style="width: 100px"
                  :show-button="false"
                  @update:value="handleLimitsChange"
                >
                  <template #suffix>g</template>
                </n-input-number>
              </div>
              <div class="limits-item">
                <span>脂肪</span>
                <n-input-number
                  v-model:value="dailyLimits.fat"
                  :min="0"
                  size="small"
                  style="width: 100px"
                  :show-button="false"
                  @update:value="handleLimitsChange"
                >
                  <template #suffix>g</template>
                </n-input-number>
              </div>
            </n-card>
          </div>
        </div>
      </div>
      <div v-show="activeTab === 'food-library'" class="tab-pane">
        <div class="table-header">
          <n-button type="primary" round @click="openDrawer">新增</n-button>
        </div>
        <n-data-table
          :columns="columns"
          :data="data"
          :bordered="false"
          :single-line="false"
          :pagination="false"
          size="medium"
        />
      </div>
    </custom-tabs>

    <n-modal
      v-model:show="modalVisible"
      preset="card"
      :title="modalMode === 'add' ? '新增记录' : '编辑记录'"
      style="width: 400px"
    >
      <n-form>
        <n-form-item label="日期">
          <n-date-picker v-model:value="intakeForm.date" type="date" style="width: 100%" />
        </n-form-item>
        <n-form-item label="餐次">
          <n-radio-group v-model:value="intakeForm.mealType" button-style="solid">
            <n-radio-button v-for="opt in mealOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </n-radio-button>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="食物">
          <n-select
            v-model:value="intakeForm.selectedFoods"
            :options="foodOptions"
            multiple
            filterable
            placeholder="搜索并选择食物"
          />
        </n-form-item>
        <n-form-item label="数量">
          <n-input-number v-model:value="intakeForm.quantity" :min="1" style="width: 100%">
            <template #suffix>{{ selectedFoodUnit }}</template>
          </n-input-number>
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="modalVisible = false">取消</n-button>
          <n-button type="primary" @click="handleIntakeSubmit">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-drawer v-model:show="drawerVisible" :width="400" placement="right">
      <n-drawer-content :title="drawerMode === 'add' ? '新增食物' : '编辑食物'" closable>
        <n-form label-placement="left" label-width="80px">
          <n-form-item label="图片">
            <n-space vertical style="width: 100%">
              <n-upload
                :max="1"
                accept="image/*"
                :custom-request="handleUpload"
                :show-file-list="false"
              >
                <n-button>上传</n-button>
              </n-upload>
              <n-input v-model:value="formData.image" placeholder="或输入图片URL" />
              <n-image
                v-if="formData.image"
                :src="formData.image"
                object-fit="cover"
                width="80"
                height="80"
                style="margin-top: 8px; border-radius: 8px"
              />
            </n-space>
          </n-form-item>
          <n-form-item label="食物名称">
            <n-input v-model:value="formData.name" placeholder="请输入食物名称" />
          </n-form-item>
          <n-form-item label="类别">
            <n-input v-model:value="formData.category" placeholder="请输入类别" />
          </n-form-item>
          <n-form-item label="数量">
            <n-input-number v-model:value="formData.quantity" :min="1" style="width: 100%" />
          </n-form-item>
          <n-form-item label="单位">
            <n-input v-model:value="formData.unit" placeholder="如: g, ml, 个" />
          </n-form-item>
          <n-form-item label="碳水(g)">
            <n-input-number v-model:value="formData.carbs" :min="0" style="width: 100%" />
          </n-form-item>
          <n-form-item label="蛋白质(g)">
            <n-input-number v-model:value="formData.protein" :min="0" style="width: 100%" />
          </n-form-item>
          <n-form-item label="脂肪(g)">
            <n-input-number v-model:value="formData.fat" :min="0" style="width: 100%" />
          </n-form-item>
          <n-form-item label="热量(kcal)">
            <n-input-number v-model:value="formData.calories" :min="0" style="width: 100%" />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="drawerVisible = false">取消</n-button>
            <n-button type="primary" @click="handleSave">保存</n-button>
          </n-space>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<style scoped>
.health-page {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 100px 16px 0;
  overflow: hidden;
}

.tabs-container {
  width: 100%;
  max-width: 1200px;
  overflow: hidden;
}

.tab-pane {
  width: 100%;
}

.intake-content {
  width: 100%;
  display: flex;
  gap: 24px;
}

.intake-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.intake-right {
  width: 290px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
}

.date-picker-wrapper {
  border-radius: 8px;
}

.daily-limits-wrapper {
  width: 100%;
  background: transparent;
  --n-color: transparent;
  border-radius: 12px;
}

.daily-limits-wrapper :deep(.n-card__header) {
  padding-bottom: 8px;
}

.card-header {
  color: #fff;
  font-size: 14px;
  font-weight: bold;
}

.limits-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  color: #fff;
  font-size: 13px;
}

.limits-item :deep(.n-input-number-suffix) {
  color: #333;
}

.limits-item :deep(.n-input-number-suffix span) {
  color: #333;
}

:deep(.n-date-panel) {
  background: transparent;
  --n-item-color-active: #fff;
  --n-item-text-color-active: #333;
}

:deep(.n-date-panel-date__sup) {
  color: #333 !important;
}

:deep(.n-date-panel-weekdays__day),
:deep(.n-date-panel-month__text) {
  color: #fff !important;
}

.intake-cards {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  text-align: center;
  background: transparent;
  --n-color: transparent;
  border-radius: 16px;
}

.stat-label {
  font-size: 14px;
  color: #fff;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
}

.stat-value .current {
  color: #fff;
}

.stat-value .separator {
  color: #fff;
  margin: 0 4px;
}

.stat-value .limit {
  color: #fff;
}

.intake-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
  border-radius: 12px;
  padding: 12px;
  overflow: auto;
}

:deep(.n-list) {
  flex: 1;
  background: transparent !important;
  --n-color: transparent;
  overflow: auto;
}

.meal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: bold;
  font-size: 16px;
  color: #fff;
  width: 100%;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.record-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.record-left :deep(.n-image) {
  border-radius: 8px;
}

.food-name {
  color: #fff;
  font-size: 14px;
}

.record-right {
  color: #666;
  font-size: 14px;
}

.table-header {
  margin-bottom: 16px;
}

:deep(.n-data-table) {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
}

:deep(.n-data-table .n-data-table-th) {
  background: rgba(255, 255, 255, 0.3) !important;
  color: #333;
}

:deep(.n-data-table .n-data-table-td) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  vertical-align: middle;
}

:deep(.n-data-table .n-data-table-table) {
  background: transparent !important;
}

:deep(.n-data-table .n-data-table-thead) {
  background: transparent !important;
}

:deep(.n-data-table:not(.n-data-table--single-line) .n-data-table-th) {
  border-color: rgba(107, 114, 128, 0.3);
}

:deep(.n-data-table:not(.n-data-table--single-line) .n-data-table-td) {
  border-color: rgba(107, 114, 128, 0.2);
}

:deep(.n-data-table .n-data-table-thead:hover) {
  background: rgba(107, 114, 128, 0.35) !important;
}

:deep(.n-data-table-tr:hover .n-data-table-td) {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

:deep(.n-data-table .n-data-table-th:hover) {
  background: rgba(107, 114, 128, 0.35) !important;
}

:deep(.n-data-table-th) {
  text-align: center;
  font-weight: 600;
}

:deep(.n-data-table-td) {
  text-align: center;
}
</style>
