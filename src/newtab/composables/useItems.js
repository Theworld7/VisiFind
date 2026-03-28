import { ref, onMounted } from 'vue'
import { getAllItems, addItem, updateItem, deleteItem } from '../lib/db'

/**
 * 物品管理组合式函数
 * @returns {Object} 物品管理相关状态和方法
 */
export function useItems() {
  const items = ref([])
  const loading = ref(false)
  const error = ref(null)

  /**
   * 加载所有物品
   */
  async function loadItems() {
    loading.value = true
    error.value = null
    try {
      items.value = await getAllItems()
    } catch (err) {
      error.value = err.message
      console.error('加载物品失败:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加物品
   * @param {Object} item - 物品数据
   */
  async function createItem(item) {
    try {
      await addItem(item)
      await loadItems()
      return true
    } catch (err) {
      error.value = err.message
      console.error('添加物品失败:', err)
      return false
    }
  }

  /**
   * 更新物品
   * @param {string} id - 物品 ID
   * @param {Object} updates - 更新数据
   */
  async function editItem(id, updates) {
    try {
      await updateItem(id, updates)
      await loadItems()
      return true
    } catch (err) {
      error.value = err.message
      console.error('更新物品失败:', err)
      return false
    }
  }

  /**
   * 删除物品
   * @param {string} id - 物品 ID
   */
  async function removeItem(id) {
    try {
      await deleteItem(id)
      await loadItems()
      return true
    } catch (err) {
      error.value = err.message
      console.error('删除物品失败:', err)
      return false
    }
  }

  /**
   * 计算服役天数
   * @param {string} purchaseDate - 购入日期
   * @returns {number} 服役天数
   */
  function calculateServiceDays(purchaseDate) {
    if (!purchaseDate) return 0
    const purchase = new Date(purchaseDate)
    const now = new Date()
    const diff = now - purchase
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  /**
   * 计算平均成本（每日成本）
   * @param {number} price - 购入价格
   * @param {string} purchaseDate - 购入日期
   * @returns {number} 平均每日成本
   */
  function calculateAverageCost(price, purchaseDate) {
    const days = calculateServiceDays(purchaseDate)
    if (days <= 0 || !price) return 0
    return (price / days).toFixed(2)
  }

  onMounted(() => {
    loadItems()
  })

  return {
    items,
    loading,
    error,
    loadItems,
    createItem,
    editItem,
    removeItem,
    calculateServiceDays,
    calculateAverageCost,
  }
}
