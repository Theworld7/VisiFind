import { ref, computed, onMounted } from 'vue'
import { getAllSeries, addSeries, updateSeries, deleteSeries } from '../lib/seriesDb'

/**
 * Series management composable
 */
export function useSeries() {
  const series = ref([])
  const loading = ref(false)
  const error = ref(null)
  const selectedCategory = ref('全部')
  const searchQuery = ref('')

  async function loadSeries() {
    loading.value = true
    error.value = null
    try {
      series.value = await getAllSeries()
    } catch (err) {
      error.value = err.message
      console.error('Load series failed:', err)
    } finally {
      loading.value = false
    }
  }

  async function createSeries(seriesData) {
    try {
      await addSeries(seriesData)
      await loadSeries()
      return true
    } catch (err) {
      error.value = err.message
      console.error('Add series failed:', err)
      return false
    }
  }

  async function editSeries(id, updates) {
    try {
      await updateSeries(id, updates)
      await loadSeries()
      return true
    } catch (err) {
      error.value = err.message
      console.error('Update series failed:', err)
      return false
    }
  }

  async function removeSeries(id) {
    try {
      await deleteSeries(id)
      await loadSeries()
      return true
    } catch (err) {
      error.value = err.message
      console.error('Delete series failed:', err)
      return false
    }
  }

  // All unique categories
  const categories = computed(() => {
    const categorySet = new Set(series.value.map(s => s.category).filter(c => c))
    return ['全部', ...Array.from(categorySet)]
  })

  // Filtered series by category and search
  const filteredSeries = computed(() => {
    let result = series.value

    if (selectedCategory.value !== '全部') {
      result = result.filter(s => s.category === selectedCategory.value)
    }

    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(s => s.name.toLowerCase().includes(query))
    }

    return result
  })

  // Statistics
  const stats = computed(() => {
    const total = series.value.length
    const watching = series.value.filter(s => s.status === 'watching').length
    const completed = series.value.filter(s => s.status === 'completed').length
    const dropped = series.value.filter(s => s.status === 'dropped').length
    return { total, watching, completed, dropped }
  })

  onMounted(() => {
    loadSeries()
  })

  return {
    series,
    loading,
    error,
    selectedCategory,
    searchQuery,
    categories,
    filteredSeries,
    stats,
    loadSeries,
    createSeries,
    editSeries,
    removeSeries,
  }
}
