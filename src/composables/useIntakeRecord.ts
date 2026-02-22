import { ref, toRaw } from 'vue'

export interface IntakeRecord {
  id?: number
  foodId: number
  foodName: string
  foodImage: string
  quantity: number
  unit: string
  carbs: number
  protein: number
  fat: number
  calories: number
  mealType: 'breakfast' | 'lunch' | 'dinner'
  date: string
}

export interface DailyLimits {
  carbs: number
  protein: number
  fat: number
}

const db = ref<IDBDatabase | null>(null)

export function useIntakeRecord() {
  const records = ref<IntakeRecord[]>([])
  const dailyLimits = ref<DailyLimits>({
    carbs: 300,
    protein: 60,
    fat: 60,
  })

  const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('IntakeRecordDB', 2)

      request.onerror = () => reject(request.error)

      request.onsuccess = () => {
        db.value = request.result
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result
        if (!database.objectStoreNames.contains('records')) {
          const store = database.createObjectStore('records', {
            keyPath: 'id',
            autoIncrement: true,
          })
          store.createIndex('date', 'date', { unique: false })
          store.createIndex('mealType', 'mealType', { unique: false })
        }
        if (!database.objectStoreNames.contains('settings')) {
          database.createObjectStore('settings', { keyPath: 'key' })
        }
      }
    })
  }

  const loadDailyLimits = (): Promise<DailyLimits> => {
    return new Promise((resolve, reject) => {
      if (!db.value) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = db.value.transaction('settings', 'readonly')
      const store = transaction.objectStore('settings')
      const request = store.get('dailyLimits')

      request.onsuccess = () => {
        if (request.result) {
          dailyLimits.value = request.result.value
        }
        resolve(dailyLimits.value)
      }

      request.onerror = () => reject(request.error)
    })
  }

  const saveDailyLimits = (limits: DailyLimits): Promise<void> => {
    const rawLimits = toRaw(limits)
    return new Promise((resolve, reject) => {
      if (!db.value) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = db.value.transaction('settings', 'readwrite')
      const store = transaction.objectStore('settings')
      store.put({ key: 'dailyLimits', value: rawLimits })

      transaction.oncomplete = () => {
        dailyLimits.value = rawLimits
        resolve()
      }

      transaction.onerror = () => reject(transaction.error)
    })
  }

  const loadAllRecords = (): Promise<IntakeRecord[]> => {
    return new Promise((resolve, reject) => {
      if (!db.value) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = db.value.transaction('records', 'readonly')
      const store = transaction.objectStore('records')
      const request = store.getAll()

      request.onsuccess = () => {
        records.value = request.result
        resolve(request.result)
      }

      request.onerror = () => reject(request.error)
    })
  }

  const loadRecordsByDate = (date: string): Promise<IntakeRecord[]> => {
    return new Promise((resolve, reject) => {
      if (!db.value) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = db.value.transaction('records', 'readonly')
      const store = transaction.objectStore('records')
      const index = store.index('date')
      const request = index.getAll(date)

      request.onsuccess = () => {
        records.value = request.result
        resolve(request.result)
      }

      request.onerror = () => reject(request.error)
    })
  }

  const addRecord = (record: Omit<IntakeRecord, 'id'>): Promise<number> => {
    return new Promise((resolve, reject) => {
      if (!db.value) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = db.value.transaction('records', 'readwrite')
      const store = transaction.objectStore('records')
      const request = store.add(record)

      request.onsuccess = () => {
        resolve(request.result as number)
      }

      request.onerror = () => reject(request.error)
    })
  }

  const deleteRecord = (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!db.value) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = db.value.transaction('records', 'readwrite')
      const store = transaction.objectStore('records')
      const request = store.delete(id)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => reject(request.error)
    })
  }

  const calculateDailyTotals = (date: string) => {
    if (!records.value) return { carbs: 0, protein: 0, fat: 0, calories: 0 }
    const dailyRecords = records.value.filter((r) => r.date === date)
    return dailyRecords.reduce(
      (acc, record) => ({
        carbs: acc.carbs + record.carbs,
        protein: acc.protein + record.protein,
        fat: acc.fat + record.fat,
        calories: acc.calories + record.calories,
      }),
      { carbs: 0, protein: 0, fat: 0, calories: 0 },
    )
  }

  const getRecordsByMealType = (date: string, mealType: IntakeRecord['mealType']) => {
    if (!records.value) return []
    return records.value.filter((r) => r.date === date && r.mealType === mealType)
  }

  const loadRecordsByDateRange = (startDate: string, endDate: string): Promise<IntakeRecord[]> => {
    return new Promise((resolve, reject) => {
      if (!db.value) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = db.value.transaction('records', 'readonly')
      const store = transaction.objectStore('records')
      const request = store.getAll()

      request.onsuccess = () => {
        const allRecords = request.result
        const filteredRecords = allRecords.filter((r) => r.date >= startDate && r.date <= endDate)
        records.value = filteredRecords
        resolve(filteredRecords)
      }

      request.onerror = () => reject(request.error)
    })
  }

  const calculateRangeTotals = (startDate: string, endDate: string) => {
    if (!records.value) return { carbs: 0, protein: 0, fat: 0, calories: 0 }
    const rangeRecords = records.value.filter((r) => r.date >= startDate && r.date <= endDate)
    return rangeRecords.reduce(
      (acc, record) => ({
        carbs: acc.carbs + record.carbs,
        protein: acc.protein + record.protein,
        fat: acc.fat + record.fat,
        calories: acc.calories + record.calories,
      }),
      { carbs: 0, protein: 0, fat: 0, calories: 0 },
    )
  }

  const getDailyTotalsForRange = (startDate: string, endDate: string) => {
    if (!records.value) return []
    const result: { date: string; carbs: number; protein: number; fat: number }[] = []

    const start = new Date(startDate)
    const end = new Date(endDate)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]!
      const dayRecords = records.value.filter((r) => r.date === dateStr)
      const totals = dayRecords.reduce(
        (acc, record) => ({
          carbs: acc.carbs + record.carbs,
          protein: acc.protein + record.protein,
          fat: acc.fat + record.fat,
        }),
        { carbs: 0, protein: 0, fat: 0 },
      )
      result.push({ date: dateStr, ...totals })
    }

    return result
  }

  const exportRecords = () => records.value

  const importRecords = async (importedRecords: IntakeRecord[]) => {
    if (!importedRecords || !Array.isArray(importedRecords)) return 0
    let count = 0
    for (const record of importedRecords) {
      await addRecord(record)
      count++
    }
    return count
  }

  return {
    records,
    dailyLimits,
    initDB,
    loadRecordsByDate,
    loadRecordsByDateRange,
    loadAllRecords,
    addRecord,
    deleteRecord,
    calculateDailyTotals,
    calculateRangeTotals,
    getDailyTotalsForRange,
    getRecordsByMealType,
    exportRecords,
    importRecords,
    loadDailyLimits,
    saveDailyLimits,
  }
}
