import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getAllWeightRecords,
  addWeightRecord,
  updateWeightRecord,
  deleteWeightRecord,
  getWeightRecordsByDateRange
} from '../lib/weightDb.js'
import { getAppSetting, setAppSetting } from '../lib/db.js'

export const useWeightStore = defineStore('weight', () => {
  // 体重记录列表（按日期倒序）
  const records = ref([])
  
  // 体重单位：'kg' | 'jin'
  const unit = ref('kg')
  
  // 趋势图时间维度：'week' | 'month' | 'year'
  const trendPeriod = ref('week')

  // 加载所有记录
  async function loadRecords() {
    records.value = await getAllWeightRecords()
  }

  // 加载单位设置
  async function loadUnit() {
    const savedUnit = await getAppSetting('weightUnit')
    if (savedUnit) {
      unit.value = savedUnit
    }
  }

  // 保存单位设置
  async function setUnit(newUnit) {
    unit.value = newUnit
    await setAppSetting('weightUnit', newUnit)
  }

  // 切换单位
  async function toggleUnit() {
    const newUnit = unit.value === 'kg' ? 'jin' : 'kg'
    await setUnit(newUnit)
  }

  // 转换体重值（kg 为基准存储）
  function convertWeight(kg, toUnit = unit.value) {
    if (toUnit === 'jin') {
      return Math.round(kg * 2 * 10) / 10 // 1kg = 2 斤
    }
    return kg
  }

  // 添加记录
  async function addRecord({ date, weight, note }) {
    // 存储时统一转换为 kg
    const weightInKg = unit.value === 'jin' ? weight / 2 : weight
    
    await addWeightRecord({
      date,
      weight: weightInKg,
      note: note || ''
    })
    await loadRecords()
  }

  // 更新记录
  async function updateRecord({ id, date, weight, note }) {
    // 存储时统一转换为 kg
    const weightInKg = unit.value === 'jin' ? weight / 2 : weight
    
    await updateWeightRecord({
      id,
      date,
      weight: weightInKg,
      note: note || '',
      createdAt: records.value.find(r => r.id === id)?.createdAt
    })
    await loadRecords()
  }

  // 删除记录
  async function deleteRecord(id) {
    await deleteWeightRecord(id)
    await loadRecords()
  }

  // 获取趋势数据（同步版本，从已加载的记录中筛选）
  function getTrendData(period = trendPeriod.value) {
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    // 使用本地日期字符串避免时区问题
    function toLocalDateStr(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const startStr = toLocalDateStr(startDate)
    const endStr = toLocalDateStr(now)

    // 从已加载的记录中筛选（records 已经是倒序，需要转为正序）
    return records.value
      .filter(r => r.date >= startStr && r.date <= endStr)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  // 计算统计信息
  const stats = computed(() => {
    if (records.value.length === 0) {
      return { latest: null, min: null, max: null, change: null }
    }
    
    const weights = records.value.map(r => r.weight)
    const latest = weights[0]
    const min = Math.min(...weights)
    const max = Math.max(...weights)
    
    // 计算与上次相比的变化
    let change = null
    if (weights.length >= 2) {
      change = latest - weights[1]
    }
    
    return {
      latest: convertWeight(latest),
      min: convertWeight(min),
      max: convertWeight(max),
      change: change !== null ? convertWeight(change) : null
    }
  })

  return {
    records,
    unit,
    trendPeriod,
    stats,
    loadRecords,
    loadUnit,
    setUnit,
    toggleUnit,
    convertWeight,
    addRecord,
    updateRecord,
    deleteRecord,
    getTrendData
  }
})
