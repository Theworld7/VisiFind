import { openDB } from './db.js'

const SERIES_STORE = 'series'

// Generate unique ID
export function generateSeriesId() {
  return `series_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get all series
export async function getAllSeries() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SERIES_STORE, 'readonly')
    const store = transaction.objectStore(SERIES_STORE)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])
  })
}

// Get single series
export async function getSeries(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SERIES_STORE, 'readonly')
    const store = transaction.objectStore(SERIES_STORE)
    const request = store.get(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

// Add series
export async function addSeries(series) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SERIES_STORE, 'readwrite')
    const store = transaction.objectStore(SERIES_STORE)
    const newSeries = {
      id: generateSeriesId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...series,
    }
    const request = store.add(newSeries)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(newSeries)
  })
}

// Update series
export async function updateSeries(id, updates) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SERIES_STORE, 'readwrite')
    const store = transaction.objectStore(SERIES_STORE)
    const getRequest = store.get(id)

    getRequest.onerror = () => reject(getRequest.error)
    getRequest.onsuccess = () => {
      const existing = getRequest.result
      if (!existing) {
        reject(new Error('Series not found'))
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
      putRequest.onsuccess = () => resolve(updated)
    }
  })
}

// Delete series
export async function deleteSeries(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SERIES_STORE, 'readwrite')
    const store = transaction.objectStore(SERIES_STORE)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// Export all series data (for unified backup)
export async function exportAllSeriesData() {
  return await getAllSeries()
}

// Import all series data (for unified backup)
export async function importAllSeriesData(data) {
  if (!data || !Array.isArray(data)) return
  const db = await openDB()
  const transaction = db.transaction(SERIES_STORE, 'readwrite')
  const store = transaction.objectStore(SERIES_STORE)

  // Clear existing data
  store.clear()

  // Import all items
  for (const item of data) {
    store.put(item)
  }
}
