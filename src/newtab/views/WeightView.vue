<script setup>
import { ref, computed, onMounted } from 'vue'
import { useWeightStore } from '../stores/weight'
import WeightTrend from '../components/WeightTrend.vue'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, X, Save, RefreshCw } from 'lucide-vue-next'

const weightStore = useWeightStore()

// 加载状态
const isLoading = ref(true)

// 编辑/新增模式
const isEditing = ref(false)
const isAdding = ref(false)

// 当前编辑的记录
const editingRecord = ref(null)

// 新增/编辑表单
const form = ref({
  date: new Date().toISOString().split('T')[0],
  weight: '',
  note: ''
})

// 展开详情
const expandedRecordId = ref(null)

// 单位标签
const unitLabel = computed(() => weightStore.unit === 'kg' ? '公斤' : '斤')

// 统计卡片
const statsCards = computed(() => {
  const { latest, min, max, change } = weightStore.stats
  
  return [
    { label: '最新体重', value: latest, suffix: unitLabel.value, icon: 'current' },
    { label: '最低体重', value: min, suffix: unitLabel.value, icon: 'min' },
    { label: '最高体重', value: max, suffix: unitLabel.value, icon: 'max' },
    { 
      label: '较上次变化', 
      value: change !== null ? (change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1)) : '--', 
      suffix: unitLabel.value,
      icon: change > 0 ? 'up' : change < 0 ? 'down' : 'stable'
    }
  ]
})

// 打开新增对话框
const openAddModal = () => {
  form.value = {
    date: new Date().toISOString().split('T')[0],
    weight: '',
    note: ''
  }
  isAdding.value = true
}

// 打开编辑对话框
const openEditModal = (record) => {
  editingRecord.value = record
  form.value = {
    date: record.date,
    weight: weightStore.convertWeight(record.weight).toFixed(1),
    note: record.note || ''
  }
  isEditing.value = true
}

// 保存新增
const handleSaveAdd = async () => {
  if (!form.value.weight) return

  await weightStore.addRecord({
    date: form.value.date,
    weight: parseFloat(form.value.weight),
    note: form.value.note
  })

  isAdding.value = false
  expandedRecordId.value = null
  form.value = { date: '', weight: '', note: '' }
}

// 保存编辑
const handleSaveEdit = async () => {
  if (!form.value.weight || !editingRecord.value) return

  await weightStore.updateRecord({
    id: editingRecord.value.id,
    date: form.value.date,
    weight: parseFloat(form.value.weight),
    note: form.value.note
  })

  isEditing.value = false
  editingRecord.value = null
  expandedRecordId.value = null
  form.value = { date: '', weight: '', note: '' }
}

// 删除记录
const handleDelete = async (record) => {
  if (confirm(`确定要删除 ${record.date} 的体重记录吗？`)) {
    await weightStore.deleteRecord(record.id)
  }
}

// 切换展开详情
const toggleExpand = (recordId) => {
  expandedRecordId.value = expandedRecordId.value === recordId ? null : recordId
}

// 取消操作
const cancelEdit = () => {
  isEditing.value = false
  editingRecord.value = null
  form.value = { date: '', weight: '', note: '' }
}

const cancelAdd = () => {
  isAdding.value = false
  form.value = { date: '', weight: '', note: '' }
}

// 获取趋势数据
const trendData = computed(() => {
  return weightStore.getTrendData(weightStore.trendPeriod)
})

onMounted(async () => {
  await weightStore.loadUnit()
  await weightStore.loadRecords()
  isLoading.value = false
})
</script>

<template>
  <main class="h-full">
    <div class="max-w-6xl mx-auto px-4 pt-[62px] pb-4 space-y-6 h-full overflow-y-auto box-border">
      <!-- 操作按钮 -->
      <div class="flex items-center justify-end">
        <div class="flex gap-2">
          <button
            @click="openAddModal"
            class="aero-glass px-4 py-2 rounded-lg aero-border flex items-center gap-2 text-white/80 hover:text-white transition-colors hover:bg-white/10"
          >
            <Plus class="w-4 h-4" />
            <span>添加记录</span>
          </button>
          <button
            @click="weightStore.toggleUnit"
            class="aero-glass px-4 py-2 rounded-lg aero-border flex items-center gap-2 text-white/80 hover:text-white transition-colors hover:bg-white/10"
          >
            <RefreshCw class="w-4 h-4" />
            <span>{{ unitLabel }}</span>
          </button>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          v-for="stat in statsCards"
          :key="stat.label"
          class="aero-glass rounded-lg p-4 aero-border"
        >
          <div class="text-white/50 text-xs mb-1">{{ stat.label }}</div>
          <div class="text-white text-xl font-bold">
            {{ stat.value !== null ? stat.value : '--' }}
            <span class="text-sm font-normal text-white/50 ml-1">{{ stat.suffix }}</span>
          </div>
          <div
            v-if="stat.icon === 'up'"
            class="text-red-400 text-xs mt-1 flex items-center gap-1"
          >
            <ChevronUp class="w-3 h-3" /> 上升
          </div>
          <div
            v-else-if="stat.icon === 'down'"
            class="text-green-400 text-xs mt-1 flex items-center gap-1"
          >
            <ChevronDown class="w-3 h-3" /> 下降
          </div>
        </div>
      </div>

      <!-- 体重趋势图 -->
      <WeightTrend
        :trend-data="trendData"
        :period="weightStore.trendPeriod"
        :unit="weightStore.unit"
        @update:period="(v) => weightStore.trendPeriod = v"
      />

      <!-- 体重列表 -->
      <div class="aero-glass rounded-lg aero-border overflow-hidden">
        <div class="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h3 class="text-white font-semibold">记录列表</h3>
          <span class="text-white/40 text-sm">{{ weightStore.records.length }} 条记录</span>
        </div>

        <div v-if="weightStore.records.length === 0" class="p-8 text-center text-white/40">
          暂无记录，点击上方按钮添加第一条体重记录
        </div>

        <div v-else>
          <div
            v-for="record in weightStore.records"
            :key="record.id"
            class="border-b border-white/5 last:border-b-0"
          >
            <!-- 列表项 -->
            <div
              class="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
              @click="toggleExpand(record.id)"
            >
              <div class="flex items-center gap-3">
                <div class="text-white/40">
                  <ChevronDown
                    class="w-4 h-4 transition-transform"
                    :class="{ 'rotate-180': expandedRecordId && expandedRecordId.value === record.id }"
                  />
                </div>
                <div>
                  <div class="text-white font-medium">{{ record.date }}</div>
                  <div v-if="record.note" class="text-white/40 text-xs truncate max-w-[200px]">
                    {{ record.note }}
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="text-white text-lg font-bold">
                  {{ weightStore.convertWeight(record.weight).toFixed(1) }}
                  <span class="text-sm font-normal text-white/50">{{ unitLabel }}</span>
                </div>
                <div class="flex items-center gap-1" @click.stop>
                  <button
                    @click="openEditModal(record)"
                    class="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded transition-colors"
                    title="编辑"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    @click="handleDelete(record)"
                    class="p-1.5 text-white/60 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                    title="删除"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- 展开详情 -->
            <div
              v-show="expandedRecordId && expandedRecordId.value === record.id"
              class="px-4 py-3 bg-white/5 border-t border-white/5"
            >
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-white/40">创建时间：</span>
                  <span class="text-white/70">{{ new Date(record.createdAt).toLocaleString('zh-CN') }}</span>
                </div>
                <div v-if="record.note">
                  <span class="text-white/40">备注：</span>
                  <span class="text-white/70">{{ record.note }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div
      v-if="isAdding || isEditing"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="isAdding ? cancelAdd() : cancelEdit()"
    >
      <div class="aero-glass rounded-lg aero-border p-6 w-full max-w-md">
        <h3 class="text-xl font-bold text-white mb-4">
          {{ isAdding ? '添加体重记录' : '编辑体重记录' }}
        </h3>

        <div class="space-y-4">
          <!-- 日期 -->
          <div>
            <label class="block text-white/60 text-sm mb-1">日期</label>
            <input
              v-model="form.date"
              type="date"
              class="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-white/40 transition-colors"
            />
          </div>

          <!-- 体重 -->
          <div>
            <label class="block text-white/60 text-sm mb-1">体重（{{ unitLabel }}）</label>
            <input
              v-model="form.weight"
              type="number"
              step="0.1"
              placeholder="请输入体重"
              class="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-white/40 transition-colors"
            />
          </div>

          <!-- 备注 -->
          <div>
            <label class="block text-white/60 text-sm mb-1">备注（可选）</label>
            <textarea
              v-model="form.note"
              placeholder="记录当时状态，如空腹、饭后等"
              rows="2"
              class="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-white/40 transition-colors resize-none"
            ></textarea>
          </div>
        </div>

        <!-- 按钮 -->
        <div class="flex gap-3 mt-6">
          <button
            @click="isAdding ? cancelAdd() : cancelEdit()"
            class="flex-1 px-4 py-2 rounded bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
          >
            <X class="w-4 h-4" />
            取消
          </button>
          <button
            @click="isAdding ? handleSaveAdd() : handleSaveEdit()"
            class="flex-1 px-4 py-2 rounded bg-white/20 text-white hover:bg-white/30 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Save class="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
@import '../styles/aero.css';
</style>
