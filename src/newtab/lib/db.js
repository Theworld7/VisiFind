const DB_NAME = 'VisiFindDB'
const DB_VERSION = 10
const STORE_NAME = 'settings'

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('intakeRecords')) {
        const intakeStore = db.createObjectStore('intakeRecords', { keyPath: 'id' })
        intakeStore.createIndex('date', 'date', { unique: false })
        intakeStore.createIndex('mealType', 'mealType', { unique: false })
      }
      if (!db.objectStoreNames.contains('intakeLimits')) {
        db.createObjectStore('intakeLimits', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('foodLibrary')) {
        const foodStore = db.createObjectStore('foodLibrary', { keyPath: 'id' })
        foodStore.createIndex('name', 'name', { unique: false })
      }
      // 新增：应用设置存储
      if (!db.objectStoreNames.contains('appSettings')) {
        db.createObjectStore('appSettings', { keyPath: 'id' })
      }
      // 体重记录存储
      if (!db.objectStoreNames.contains('weightRecords')) {
        const weightStore = db.createObjectStore('weightRecords', { keyPath: 'id', autoIncrement: true })
        weightStore.createIndex('date', 'date', { unique: false })
      }
      // 文档分类存储
      if (!db.objectStoreNames.contains('documentCategories')) {
        const categoryStore = db.createObjectStore('documentCategories', { keyPath: 'id' })
        categoryStore.createIndex('parentId', 'parentId', { unique: false })
      }
      // 文档存储
      if (!db.objectStoreNames.contains('documents')) {
        const docStore = db.createObjectStore('documents', { keyPath: 'id' })
        docStore.createIndex('categoryId', 'categoryId', { unique: false })
        docStore.createIndex('updatedAt', 'updatedAt', { unique: false })
      }
      // 物品存储
      if (!db.objectStoreNames.contains('items')) {
        const itemStore = db.createObjectStore('items', { keyPath: 'id' })
        itemStore.createIndex('name', 'name', { unique: false })
        itemStore.createIndex('inService', 'inService', { unique: false })
        itemStore.createIndex('purchaseDate', 'purchaseDate', { unique: false })
      }
      // 漫剧记录存储
      if (!db.objectStoreNames.contains('series')) {
        const seriesStore = db.createObjectStore('series', { keyPath: 'id' })
        seriesStore.createIndex('name', 'name', { unique: false })
        seriesStore.createIndex('category', 'category', { unique: false })
        seriesStore.createIndex('status', 'status', { unique: false })
      }
    }
  })
}

export async function getSetting(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(key)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result?.value)
  })
}

export async function setSetting(key, value) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    // 使用 JSON 序列化来克隆数据，避免 DataCloneError
    const request = store.put({ id: key, value: JSON.parse(JSON.stringify(value)) })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function getAllSettings() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
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

export async function exportAllData() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
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

export async function importAllData(data) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    Object.entries(data).forEach(([key, value]) => {
      store.put({ id: key, value })
    })

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

// ============ 应用设置操作（替代 localStorage） ============

const APP_SETTINGS_STORE = 'appSettings'

// 获取应用设置
export async function getAppSetting(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(APP_SETTINGS_STORE, 'readonly')
    const store = transaction.objectStore(APP_SETTINGS_STORE)
    const request = store.get(key)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result?.value)
  })
}

// 设置应用设置
export async function setAppSetting(key, value) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(APP_SETTINGS_STORE, 'readwrite')
    const store = transaction.objectStore(APP_SETTINGS_STORE)
    const request = store.put({ id: key, value: JSON.parse(JSON.stringify(value)) })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// 获取所有应用设置
export async function getAllAppSettings() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(APP_SETTINGS_STORE, 'readonly')
    const store = transaction.objectStore(APP_SETTINGS_STORE)
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

// ============ 物品管理操作 ============

const ITEMS_STORE = 'items'

// 获取所有物品
export async function getAllItems() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ITEMS_STORE, 'readonly')
    const store = transaction.objectStore(ITEMS_STORE)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

// 获取单个物品
export async function getItem(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ITEMS_STORE, 'readonly')
    const store = transaction.objectStore(ITEMS_STORE)
    const request = store.get(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

// 添加物品
export async function addItem(item) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ITEMS_STORE, 'readwrite')
    const store = transaction.objectStore(ITEMS_STORE)
    const request = store.add({
      ...item,
      id: item.id || Date.now().toString(),
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

// 更新物品
export async function updateItem(id, updates) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ITEMS_STORE, 'readwrite')
    const store = transaction.objectStore(ITEMS_STORE)
    const request = store.get(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const existing = request.result
      if (!existing) {
        reject(new Error('物品不存在'))
        return
      }
      const updated = {
        ...existing,
        ...updates,
        id,
        updatedAt: new Date().toISOString(),
      }
      const putRequest = store.put(updated)
      putRequest.onerror = () => reject(putRequest.error)
      putRequest.onsuccess = () => resolve(putRequest.result)
    }
  })
}

// 删除物品
export async function deleteItem(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ITEMS_STORE, 'readwrite')
    const store = transaction.objectStore(ITEMS_STORE)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// ============ 物品数据导出/导入 ============

// 导出所有物品数据
export async function exportAllItemsData() {
  const items = await getAllItems()
  return {
    version: DB_VERSION,
    items
  }
}

// 导入物品数据
export async function importAllItemsData(data) {
  if (!data || !Array.isArray(data.items)) {
    throw new Error('无效的物品数据格式')
  }

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(ITEMS_STORE, 'readwrite')
    const store = transaction.objectStore(ITEMS_STORE)

    // 先清空现有数据
    const clearRequest = store.clear()
    clearRequest.onsuccess = () => {
      // 导入新数据
      data.items.forEach(item => {
        store.put(item)
      })
      resolve()
    }
    clearRequest.onerror = () => reject(clearRequest.error)
  })
}
