<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Pencil, Trash2, Upload } from 'lucide-vue-next'
import Modal from '../components/Modal.vue'
import { getAllFoods, addFood as addFoodToDb, updateFood as updateFoodInDb, deleteFood as deleteFoodFromDb } from '../lib/intakeDb.js'

// 食物数据结构
// { id, name, image, quantity, unit, carbs, protein, fat, calories }

const foods = ref([])
const isAddModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const editingFood = ref(null)
const deletingFood = ref(null)

// 表单数据
const formData = ref({
  name: '',
  image: '',
  imageType: 'url', // 'url' | 'upload'
  quantity: 100,
  unit: 'g',
  carbs: 0,
  protein: 0,
  fat: 0,
  calories: 0
})

// 从 IndexedDB 加载数据
const loadFoods = async () => {
  const savedFoods = await getAllFoods()
  foods.value = savedFoods
}

// 重置表单
const resetForm = () => {
  formData.value = {
    name: '',
    image: '',
    imageType: 'url',
    quantity: 100,
    unit: 'g',
    carbs: 0,
    protein: 0,
    fat: 0,
    calories: 0
  }
}

// 处理本地图片上传
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      formData.value.image = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// 打开添加模态框
const openAddModal = () => {
  resetForm()
  isAddModalOpen.value = true
}

// 打开编辑模态框
const openEditModal = (food) => {
  editingFood.value = food
  formData.value = {
    ...food,
    imageType: food.image && food.image.startsWith('data:') ? 'upload' : 'url'
  }
  isEditModalOpen.value = true
}

// 打开删除确认框
const openDeleteModal = (food) => {
  deletingFood.value = food
  isDeleteModalOpen.value = true
}

// 添加食物
const addFood = async () => {
  const newFood = {
    name: formData.value.name,
    image: formData.value.image,
    quantity: formData.value.quantity,
    unit: formData.value.unit,
    carbs: formData.value.carbs,
    protein: formData.value.protein,
    fat: formData.value.fat,
    calories: formData.value.calories
  }
  await addFoodToDb(newFood)
  await loadFoods()
  isAddModalOpen.value = false
  resetForm()
}

// 更新食物
const updateFood = async () => {
  const updates = {
    name: formData.value.name,
    image: formData.value.image,
    quantity: formData.value.quantity,
    unit: formData.value.unit,
    carbs: formData.value.carbs,
    protein: formData.value.protein,
    fat: formData.value.fat,
    calories: formData.value.calories
  }
  await updateFoodInDb(editingFood.value.id, updates)
  await loadFoods()
  isEditModalOpen.value = false
  editingFood.value = null
  resetForm()
}

// 删除食物
const deleteFood = async () => {
  await deleteFoodFromDb(deletingFood.value.id)
  await loadFoods()
  isDeleteModalOpen.value = false
  deletingFood.value = null
}

onMounted(() => {
  loadFoods()
})
</script>

<template>
  <main class="h-full">
    <div class="max-w-6xl mx-auto px-4 pt-24 pb-8">
      <!-- 添加按钮 -->
      <div class="flex justify-end mb-4">
        <button
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
          @click="openAddModal"
        >
          <Plus class="w-4 h-4" />
          添加食物
        </button>
      </div>

      <!-- 表格 -->
      <div class="aero-glass rounded-lg overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-white/20">
                <th class="px-4 py-3 text-center font-medium text-white/80">图片</th>
                <th class="px-4 py-3 text-center font-medium text-white/80">名称</th>
                <th class="px-4 py-3 text-center font-medium text-white/80">数量</th>
                <th class="px-4 py-3 text-center font-medium text-white/80">单位</th>
                <th class="px-4 py-3 text-center font-medium text-white/80">碳水 (g)</th>
                <th class="px-4 py-3 text-center font-medium text-white/80">蛋白质 (g)</th>
                <th class="px-4 py-3 text-center font-medium text-white/80">脂肪 (g)</th>
                <th class="px-4 py-3 text-center font-medium text-white/80">热量 (kJ)</th>
                <th class="px-4 py-3 text-center font-medium text-white/80">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="food in foods"
                :key="food.id"
                class="border-b border-white/10 hover:bg-white/5 transition-colors"
              >
                <td class="px-4 py-3">
                  <div class="w-12 h-12 rounded bg-white/10 flex items-center justify-center overflow-hidden mx-auto">
                    <img
                      v-if="food.image"
                      :src="food.image"
                      :alt="food.name"
                      class="w-full h-full object-cover"
                    />
                    <span v-else class="text-white/40 text-xs">无图</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-center text-white">{{ food.name }}</td>
                <td class="px-4 py-3 text-center text-white/70">{{ food.quantity }}</td>
                <td class="px-4 py-3 text-center text-white/70">{{ food.unit }}</td>
                <td class="px-4 py-3 text-center text-white/70">{{ food.carbs }}</td>
                <td class="px-4 py-3 text-center text-white/70">{{ food.protein }}</td>
                <td class="px-4 py-3 text-center text-white/70">{{ food.fat }}</td>
                <td class="px-4 py-3 text-center text-white/70">{{ food.calories }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      class="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="编辑"
                      @click="openEditModal(food)"
                    >
                      <Pencil class="w-4 h-4" />
                    </button>
                    <button
                      class="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-red-400 transition-colors"
                      title="删除"
                      @click="openDeleteModal(food)"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="foods.length === 0">
                <td colspan="9" class="px-4 py-8 text-center text-white/40">
                  暂无食物数据，点击上方按钮添加
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 添加模态框 -->
    <Modal v-model:open="isAddModalOpen" title="添加食物">
      <form @submit.prevent="addFood">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-white/80 mb-1">名称</label>
            <input
              v-model="formData.name"
              type="text"
              required
              class="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="食物名称"
            />
          </div>

          <!-- 图片上传区域 -->
          <div>
            <label class="block text-sm font-medium text-white/80 mb-1">图片</label>
            <div class="flex gap-2 mb-2">
              <button
                type="button"
                class="flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                :class="formData.imageType === 'url' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:text-white'"
                @click="formData.imageType = 'url'; formData.image = ''"
              >
                在线图片
              </button>
              <button
                type="button"
                class="flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                :class="formData.imageType === 'upload' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:text-white'"
                @click="formData.imageType = 'upload'; formData.image = ''"
              >
                本地上传
              </button>
            </div>

            <!-- 在线图片 URL 输入 -->
            <input
              v-if="formData.imageType === 'url'"
              v-model="formData.image"
              type="url"
              class="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="https://..."
            />

            <!-- 本地上传 -->
            <div v-else class="space-y-2">
              <label class="flex items-center justify-center gap-2 px-3 py-6 rounded-md bg-white/10 border border-dashed border-white/30 text-white/60 hover:text-white hover:border-white/50 cursor-pointer transition-colors">
                <Upload class="w-4 h-4" />
                <span class="text-sm">{{ formData.image ? '已选择图片' : '点击选择图片' }}</span>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleImageUpload"
                />
              </label>
              <div v-if="formData.image" class="w-16 h-16 rounded overflow-hidden">
                <img :src="formData.image" alt="预览" class="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-white/80 mb-1">数量</label>
              <input
                v-model.number="formData.quantity"
                type="number"
                min="0"
                step="0.1"
                required
                class="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-white/80 mb-1">单位</label>
              <input
                v-model="formData.unit"
                type="text"
                required
                class="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                placeholder="g, ml, 个，份..."
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-white/80 mb-1">碳水化合物 (g)</label>
              <input
                v-model.number="formData.carbs"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-white/80 mb-1">蛋白质 (g)</label>
              <input
                v-model.number="formData.protein"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-white/80 mb-1">脂肪 (g)</label>
              <input
                v-model.number="formData.fat"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-white/80 mb-1">热量 (kJ)</label>
              <input
                v-model.number="formData.calories"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-4 py-2 rounded-md text-white/70 hover:text-white transition-colors"
              @click="isAddModalOpen = false"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded-md bg-white/20 hover:bg-white/30 text-white font-medium transition-colors"
            >
              添加
            </button>
          </div>
        </div>
      </form>
    </Modal>

    <!-- 编辑模态框 -->
    <Modal v-model:open="isEditModalOpen" title="编辑食物">
      <form @submit.prevent="updateFood">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-white/80 mb-1">名称</label>
            <input
              v-model="formData.name"
              type="text"
              required
              class="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="食物名称"
            />
          </div>

          <!-- 图片上传区域 -->
          <div>
            <label class="block text-sm font-medium text-white/80 mb-1">图片</label>
            <div class="flex gap-2 mb-2">
              <button
                type="button"
                class="flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                :class="formData.imageType === 'url' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:text-white'"
                @click="formData.imageType = 'url'; formData.image = ''"
              >
                在线图片
              </button>
              <button
                type="button"
                class="flex-1 px-3 py-1.5 rounded text-sm font-medium transition-colors"
                :class="formData.imageType === 'upload' ? 'bg-white/20 text-white' : 'bg-white/5 text-white/60 hover:text-white'"
                @click="formData.imageType = 'upload'; formData.image = ''"
              >
                本地上传
              </button>
            </div>

            <!-- 在线图片 URL 输入 -->
            <input
              v-if="formData.imageType === 'url'"
              v-model="formData.image"
              type="url"
              class="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              placeholder="https://..."
            />

            <!-- 本地上传 -->
            <div v-else class="space-y-2">
              <label class="flex items-center justify-center gap-2 px-3 py-6 rounded-md bg-white/10 border border-dashed border-white/30 text-white/60 hover:text-white hover:border-white/50 cursor-pointer transition-colors">
                <Upload class="w-4 h-4" />
                <span class="text-sm">{{ formData.image ? '已选择图片' : '点击选择图片' }}</span>
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleImageUpload"
                />
              </label>
              <div v-if="formData.image" class="w-16 h-16 rounded overflow-hidden">
                <img :src="formData.image" alt="预览" class="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-white/80 mb-1">数量</label>
              <input
                v-model.number="formData.quantity"
                type="number"
                min="0"
                step="0.1"
                required
                class="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-white/80 mb-1">单位</label>
              <input
                v-model="formData.unit"
                type="text"
                required
                class="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
                placeholder="g, ml, 个，份..."
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-white/80 mb-1">碳水化合物 (g)</label>
              <input
                v-model.number="formData.carbs"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-white/80 mb-1">蛋白质 (g)</label>
              <input
                v-model.number="formData.protein"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-white/80 mb-1">脂肪 (g)</label>
              <input
                v-model.number="formData.fat"
                type="number"
                min="0"
                step="0.1"
                class="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-white/80 mb-1">热量 (kJ)</label>
              <input
                v-model.number="formData.calories"
                type="number"
                min="0"
                step="1"
                class="w-full px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-4 py-2 rounded-md text-white/70 hover:text-white transition-colors"
              @click="isEditModalOpen = false"
            >
              取消
            </button>
            <button
              type="submit"
              class="px-4 py-2 rounded-md bg-white/20 hover:bg-white/30 text-white font-medium transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </form>
    </Modal>

    <!-- 删除确认模态框 -->
    <Modal v-model:open="isDeleteModalOpen" title="确认删除">
      <p class="text-white/80 mb-4">确定要删除「{{ deletingFood?.name }}」吗？此操作不可撤销。</p>
      <div class="flex justify-end gap-2">
        <button
          class="px-4 py-2 rounded-md text-white/70 hover:text-white transition-colors"
          @click="isDeleteModalOpen = false"
        >
          取消
        </button>
        <button
          class="px-4 py-2 rounded-md bg-red-500/80 hover:bg-red-500 text-white font-medium transition-colors"
          @click="deleteFood"
        >
          删除
        </button>
      </div>
    </Modal>
  </main>
</template>