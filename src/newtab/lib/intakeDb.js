import { openDB } from './db.js'

const SETTINGS_STORE = 'settings'
const INTAKE_STORE = 'intakeRecords'
const LIMITS_STORE = 'intakeLimits'
const FOOD_LIBRARY_STORE = 'foodLibrary'

// ============ 摄入记录操作 ============

// 生成唯一 ID
export function generateId() {
  return `intake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 添加摄入记录
export async function addIntakeRecord(record) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(INTAKE_STORE, 'readwrite')
    const store = transaction.objectStore(INTAKE_STORE)
    const newRecord = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      ...record
    }
    const request = store.add(newRecord)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(newRecord)
  })
}

// 获取指定日期的所有摄入记录
export async function getIntakeRecordsByDate(date) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(INTAKE_STORE, 'readonly')
    const index = transaction.objectStore(INTAKE_STORE).index('date')
    const request = index.getAll(date)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

// 删除摄入记录
export async function deleteIntakeRecord(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(INTAKE_STORE, 'readwrite')
    const store = transaction.objectStore(INTAKE_STORE)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// 更新摄入记录
export async function updateIntakeRecord(id, updates) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(INTAKE_STORE, 'readwrite')
    const store = transaction.objectStore(INTAKE_STORE)
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const record = getRequest.result
      if (record) {
        const updatedRecord = { ...record, ...updates }
        const putRequest = store.put(updatedRecord)
        putRequest.onsuccess = () => resolve(updatedRecord)
        putRequest.onerror = () => reject(putRequest.error)
      } else {
        reject(new Error('Record not found'))
      }
    }
    getRequest.onerror = () => reject(getRequest.error)
  })
}

// 获取日期范围内的摄入记录
export async function getIntakeRecordsByDateRange(startDate, endDate) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(INTAKE_STORE, 'readonly')
    const store = transaction.objectStore(INTAKE_STORE)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const records = request.result || []
      const filtered = records.filter(r => r.date >= startDate && r.date <= endDate)
      resolve(filtered)
    }
  })
}

// ============ 摄入限制操作 ============

// 获取摄入限制
export async function getIntakeLimits() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LIMITS_STORE, 'readonly')
    const store = transaction.objectStore(LIMITS_STORE)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const limits = { carbs: 300, protein: 150, fat: 80, calories: 8000 }
      request.result?.forEach(item => {
        limits[item.id] = item.value
      })
      resolve(limits)
    }
  })
}

// 设置摄入限制
export async function setIntakeLimit(key, value) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(LIMITS_STORE, 'readwrite')
    const store = transaction.objectStore(LIMITS_STORE)
    const request = store.put({ id: key, value })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// ============ Settings 操作（复用原有） ============

export async function getSetting(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SETTINGS_STORE, 'readonly')
    const store = transaction.objectStore(SETTINGS_STORE)
    const request = store.get(key)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result?.value)
  })
}

export async function setSetting(key, value) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SETTINGS_STORE, 'readwrite')
    const store = transaction.objectStore(SETTINGS_STORE)
    const request = store.put({ id: key, value: JSON.parse(JSON.stringify(value)) })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getAllSettings() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SETTINGS_STORE, 'readonly')
    const store = transaction.objectStore(SETTINGS_STORE)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const result = {}
      request.result.forEach(item => {
        result[item.id] = item.value
      })
      resolve(result)
    }
  })
}

// ============ 食物库操作 ============

// 生成食物 ID
export function generateFoodId() {
  return `food_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 获取所有食物
export async function getAllFoods() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FOOD_LIBRARY_STORE, 'readonly')
    const store = transaction.objectStore(FOOD_LIBRARY_STORE)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

// 添加食物
export async function addFood(food) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FOOD_LIBRARY_STORE, 'readwrite')
    const store = transaction.objectStore(FOOD_LIBRARY_STORE)
    const newFood = {
      id: generateFoodId(),
      createdAt: new Date().toISOString(),
      ...food
    }
    const request = store.add(newFood)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(newFood)
  })
}

// 更新食物
export async function updateFood(id, updates) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FOOD_LIBRARY_STORE, 'readwrite')
    const store = transaction.objectStore(FOOD_LIBRARY_STORE)
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const food = getRequest.result
      if (food) {
        const updatedFood = { ...food, ...updates }
        const putRequest = store.put(updatedFood)
        putRequest.onsuccess = () => resolve(updatedFood)
        putRequest.onerror = () => reject(putRequest.error)
      } else {
        reject(new Error('Food not found'))
      }
    }
    getRequest.onerror = () => reject(getRequest.error)
  })
}

// 删除食物
export async function deleteFood(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(FOOD_LIBRARY_STORE, 'readwrite')
    const store = transaction.objectStore(FOOD_LIBRARY_STORE)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// 导出所有摄入相关数据（记录 + 限制 + 食物库）
export async function exportAllIntakeData() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SETTINGS_STORE, INTAKE_STORE, LIMITS_STORE, FOOD_LIBRARY_STORE], 'readonly')

    const settingsStore = transaction.objectStore(SETTINGS_STORE)
    const intakeStore = transaction.objectStore(INTAKE_STORE)
    const limitsStore = transaction.objectStore(LIMITS_STORE)
    const foodStore = transaction.objectStore(FOOD_LIBRARY_STORE)

    const settingsRequest = settingsStore.getAll()
    const intakeRequest = intakeStore.getAll()
    const limitsRequest = limitsStore.getAll()
    const foodRequest = foodStore.getAll()

    let settings = {}, intakeRecords = [], limits = {}, foods = []

    settingsRequest.onsuccess = () => {
      settingsRequest.result?.forEach(item => {
        settings[item.id] = item.value
      })
    }
    settingsRequest.onerror = () => reject(settingsRequest.error)

    intakeRequest.onsuccess = () => {
      intakeRecords = intakeRequest.result || []
    }
    intakeRequest.onerror = () => reject(intakeRequest.error)

    limitsRequest.onsuccess = () => {
      limitsRequest.result?.forEach(item => {
        limits[item.id] = item.value
      })
    }
    limitsRequest.onerror = () => reject(limitsRequest.error)

    foodRequest.onsuccess = () => {
      foods = foodRequest.result || []
    }
    foodRequest.onerror = () => reject(foodRequest.error)

    transaction.oncomplete = () => {
      resolve({
        settings,
        intakeRecords,
        limits,
        foods
      })
    }
    transaction.onerror = () => reject(transaction.error)
  })
}

// 导入所有摄入相关数据
export async function importAllIntakeData(data) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SETTINGS_STORE, INTAKE_STORE, LIMITS_STORE, FOOD_LIBRARY_STORE], 'readwrite')

    const settingsStore = transaction.objectStore(SETTINGS_STORE)
    const intakeStore = transaction.objectStore(INTAKE_STORE)
    const limitsStore = transaction.objectStore(LIMITS_STORE)
    const foodStore = transaction.objectStore(FOOD_LIBRARY_STORE)

    // 导入设置
    if (data.settings) {
      Object.entries(data.settings).forEach(([key, value]) => {
        settingsStore.put({ id: key, value })
      })
    }

    // 导入摄入记录
    if (data.intakeRecords) {
      data.intakeRecords.forEach(record => {
        intakeStore.put(record)
      })
    }

    // 导入限制
    if (data.limits) {
      Object.entries(data.limits).forEach(([key, value]) => {
        limitsStore.put({ id: key, value })
      })
    }

    // 导入食物库
    if (data.foods) {
      data.foods.forEach(food => {
        foodStore.put(food)
      })
    }

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

// ============ 数据迁移 ============

// 从 localStorage 迁移食物库数据和书签到 IndexedDB
export async function migrateFoodLibraryFromLocalStorage() {
  const savedFoodLibrary = localStorage.getItem('foodLibrary')
  const savedBookmarks = localStorage.getItem('bookmarks')
  const savedBookmarkGroups = localStorage.getItem('bookmarkGroups')
  const savedLastVisitDate = localStorage.getItem('lastVisitDate')

  let migrated = false

  // 迁移食物库
  if (savedFoodLibrary) {
    try {
      const foods = JSON.parse(savedFoodLibrary)
      if (Array.isArray(foods) && foods.length > 0) {
        // 检查是否已经迁移过
        const existingFoods = await getAllFoods()
        if (existingFoods.length === 0) {
          // 迁移数据
          const db = await openDB()
          await new Promise((resolve, reject) => {
            const transaction = db.transaction(FOOD_LIBRARY_STORE, 'readwrite')
            const store = transaction.objectStore(FOOD_LIBRARY_STORE)

            foods.forEach(food => {
              if (!food.id) food.id = generateFoodId()
              if (!food.createdAt) food.createdAt = new Date().toISOString()
              store.put(food)
            })

            transaction.oncomplete = () => resolve()
            transaction.onerror = () => reject(transaction.error)
          })
          migrated = true
          console.log(`成功迁移 ${foods.length} 个食物到 IndexedDB`)
        }
      }
    } catch (e) {
      console.error('食物库数据迁移失败:', e)
    }
  }

  // 迁移书签数据到 IndexedDB
  if (savedBookmarks || savedBookmarkGroups || savedLastVisitDate) {
    try {
      const { setAppSetting } = await import('./db.js')

      if (savedBookmarks) {
        const bookmarks = JSON.parse(savedBookmarks)
        await setAppSetting('bookmarks', bookmarks)
        migrated = true
      }
      if (savedBookmarkGroups) {
        const groups = JSON.parse(savedBookmarkGroups)
        await setAppSetting('bookmarkGroups', groups)
        migrated = true
      }
      if (savedLastVisitDate) {
        await setAppSetting('lastVisitDate', savedLastVisitDate)
        migrated = true
      }

      console.log('成功迁移书签数据到 IndexedDB')
    } catch (e) {
      console.error('书签数据迁移失败:', e)
    }
  }

  // 迁移成功后清除 localStorage
  if (migrated) {
    if (savedFoodLibrary) localStorage.removeItem('foodLibrary')
    if (savedBookmarks) localStorage.removeItem('bookmarks')
    if (savedBookmarkGroups) localStorage.removeItem('bookmarkGroups')
    if (savedLastVisitDate) localStorage.removeItem('lastVisitDate')
  }

  return migrated
}
