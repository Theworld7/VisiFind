import { ref } from 'vue'

export interface FoodItem {
  id?: number
  image: string
  name: string
  category: string
  quantity: number
  unit: string
  carbs: number
  protein: number
  fat: number
  calories: number
}

const db = ref<IDBDatabase | null>(null)

export function useFoodLibrary() {
  const foods = ref<FoodItem[]>([])

  const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FoodLibraryDB', 1)

      request.onerror = () => reject(request.error)

      request.onsuccess = () => {
        db.value = request.result
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result
        if (!database.objectStoreNames.contains('foods')) {
          database.createObjectStore('foods', { keyPath: 'id', autoIncrement: true })
        }
      }
    })
  }

  const loadFoods = (): Promise<FoodItem[]> => {
    return new Promise((resolve, reject) => {
      if (!db.value) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = db.value.transaction('foods', 'readonly')
      const store = transaction.objectStore('foods')
      const request = store.getAll()

      request.onsuccess = () => {
        foods.value = request.result
        resolve(request.result)
      }

      request.onerror = () => reject(request.error)
    })
  }

  const addFood = (food: Omit<FoodItem, 'id'>): Promise<number> => {
    return new Promise((resolve, reject) => {
      if (!db.value) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = db.value.transaction('foods', 'readwrite')
      const store = transaction.objectStore('foods')
      const request = store.add(food)

      request.onsuccess = () => {
        resolve(request.result as number)
      }

      request.onerror = () => reject(request.error)
    })
  }

  const deleteFood = (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!db.value) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = db.value.transaction('foods', 'readwrite')
      const store = transaction.objectStore('foods')
      const request = store.delete(id)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => reject(request.error)
    })
  }

  const updateFood = (food: FoodItem): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!db.value) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = db.value.transaction('foods', 'readwrite')
      const store = transaction.objectStore('foods')
      const request = store.put(food)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = () => reject(request.error)
    })
  }

  const exportFoods = () => {
    return foods.value
  }

  const importFoods = async (data: FoodItem[]): Promise<number> => {
    if (!data || !Array.isArray(data)) return 0

    const existingNames = new Set(foods.value.map((f) => f.name.toLowerCase()))
    let importCount = 0

    for (const food of data) {
      if (!existingNames.has(food.name.toLowerCase())) {
        const { id, ...foodWithoutId } = food
        await addFood(foodWithoutId)
        existingNames.add(food.name.toLowerCase())
        importCount++
      }
    }

    return importCount
  }

  return {
    db,
    foods,
    initDB,
    loadFoods,
    addFood,
    deleteFood,
    updateFood,
    exportFoods,
    importFoods,
  }
}
