import { openDB } from './db.js'

const STORE_NAME = 'weightRecords'

/**
 * 生成唯一 ID
 */
function generateId() {
  return `weight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 获取所有体重记录（按日期倒序）
 */
export async function getAllWeightRecords() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const records = request.result || []
      // 按日期倒序排序
      resolve(records.sort((a, b) => new Date(b.date) - new Date(a.date)))
    }
  })
}

/**
 * 添加体重记录
 */
export async function addWeightRecord(record) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const newRecord = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      ...record
    }
    const request = store.add(newRecord)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(newRecord.id)
  })
}

/**
 * 更新体重记录
 */
export async function updateWeightRecord(record) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(record)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * 删除体重记录
 */
export async function deleteWeightRecord(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

/**
 * 根据日期范围获取记录（正序）
 */
export async function getWeightRecordsByDateRange(startDate, endDate) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const records = request.result || []
      const filtered = records.filter(r => r.date >= startDate && r.date <= endDate)
      // 按日期正序排序
      resolve(filtered.sort((a, b) => new Date(a.date) - new Date(b.date)))
    }
  })
}

/**
 * 获取指定日期的记录
 */
export async function getWeightRecordByDate(date) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const records = request.result || []
      resolve(records.find(r => r.date === date))
    }
  })
}

/**
 * 导出所有体重记录
 */
export async function exportAllWeightData() {
  const records = await getAllWeightRecords()
  return {
    version: 8,
    records
  }
}

/**
 * 导入体重记录
 */
export async function importAllWeightData(data) {
  if (!data || !Array.isArray(data.records)) {
    throw new Error('无效的体重数据格式')
  }

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    // 先清空现有数据
    const clearRequest = store.clear()
    clearRequest.onsuccess = () => {
      // 导入新数据
      data.records.forEach(record => {
        store.put(record)
      })
      resolve()
    }
    clearRequest.onerror = () => reject(clearRequest.error)
  })
}
