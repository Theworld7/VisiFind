<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Pencil, X, Save } from 'lucide-vue-next'
import DocumentTree from '../components/DocumentTree.vue'
import DocumentList from '../components/DocumentList.vue'
import DocumentReader from '../components/DocumentReader.vue'
import {
  getAllCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getDocumentsByCategory,
  addDocument,
  updateDocument,
  deleteDocument,
  generateId
} from '../lib/documents'

// 分类数据
const categories = ref([])

// 文档数据
const documents = ref([])

// 当前选中的分类 ID
const selectedCategoryId = ref(null)

// 文档阅读器状态
const isReaderOpen = ref(false)
const currentDocument = ref(null)

// 分类编辑弹窗
const isCategoryModalOpen = ref(false)
const isEditingCategory = ref(false)
const editingCategory = ref(null)
const categoryForm = ref({
  name: '',
  parentId: null
})

// 上传文档弹窗
const isUploadModalOpen = ref(false)
const uploadingDocument = ref({
  title: '',
  html: ''
})

// 选中分类的名称
const selectedCategoryName = computed(() => {
  if (!selectedCategoryId.value) return '全部文档'
  const category = categories.value.find(c => c.id === selectedCategoryId.value)
  return category ? category.name : '全部文档'
})

// 加载所有分类
const loadCategories = async () => {
  categories.value = await getAllCategories()
}

// 加载指定分类的文档
const loadDocuments = async (categoryId) => {
  documents.value = await getDocumentsByCategory(categoryId)
}

// 选择分类
const handleSelectCategory = async (categoryId) => {
  selectedCategoryId.value = categoryId
  await loadDocuments(categoryId)
}

// 打开添加分类弹窗
const handleAddCategory = async (parentId) => {
  isEditingCategory.value = false
  editingCategory.value = null
  categoryForm.value = {
    name: '',
    parentId
  }
  isCategoryModalOpen.value = true
}

// 打开编辑分类弹窗
const handleEditCategory = (category) => {
  isEditingCategory.value = true
  editingCategory.value = category
  categoryForm.value = {
    name: category.name,
    parentId: category.parentId
  }
  isCategoryModalOpen.value = true
}

// 删除分类
const handleDeleteCategory = async (category) => {
  await deleteCategory(category.id)
  await loadCategories()
  if (selectedCategoryId.value === category.id) {
    selectedCategoryId.value = null
    await loadDocuments(null)
  }
}

// 保存分类
const handleSaveCategory = async () => {
  if (!categoryForm.value.name.trim()) {
    alert('请输入分类名称')
    return
  }

  try {
    if (isEditingCategory.value) {
      // 更新分类
      await updateCategory(editingCategory.value.id, {
        name: categoryForm.value.name
      })
    } else {
      // 添加分类
      await addCategory({
        id: generateId(),
        name: categoryForm.value.name,
        parentId: categoryForm.value.parentId,
        order: categories.value.length
      })
    }

    isCategoryModalOpen.value = false
    await loadCategories()
  } catch (error) {
    console.error('保存分类失败:', error)
    alert('保存分类失败，请重试')
  }
}

// 处理上传文档
const handleUploadDocument = (docData) => {
  uploadingDocument.value = {
    title: docData.title,
    markdown: docData.markdown
  }
  isUploadModalOpen.value = true
}

// 保存上传文档
const handleSaveUpload = async () => {
  if (!uploadingDocument.value) return

  try {
    await addDocument({
      id: generateId(),
      title: uploadingDocument.value.title,
      categoryId: selectedCategoryId.value,
      markdown: uploadingDocument.value.markdown
    })

    isUploadModalOpen.value = false
    uploadingDocument.value = {
      title: '',
      markdown: ''
    }
    await loadDocuments(selectedCategoryId.value)
  } catch (error) {
    console.error('保存文档失败:', error)
    alert('保存文档失败，请重试')
  }
}

// 选择文档阅读
const handleSelectDocument = (doc) => {
  currentDocument.value = doc
  isReaderOpen.value = true
}

// 删除文档
const handleDeleteDocument = async (doc) => {
  try {
    await deleteDocument(doc.id)
    await loadDocuments(selectedCategoryId.value)
  } catch (error) {
    console.error('删除文档失败:', error)
    alert('删除文档失败，请重试')
  }
}

// 关闭分类弹窗
const closeCategoryModal = () => {
  isCategoryModalOpen.value = false
  editingCategory.value = null
  categoryForm.value = { name: '', parentId: null }
}

// 关闭上传弹窗
const closeUploadModal = () => {
  isUploadModalOpen.value = false
  uploadingDocument.value = {
    title: '',
    html: ''
  }
}

onMounted(async () => {
  await loadCategories()
  await loadDocuments(null)
})
</script>

<template>
  <div class="documents-view">
    <!-- 左侧树状菜单 -->
    <aside class="tree-sidebar aero-glass aero-border">
      <DocumentTree
        :categories="categories"
        :selected-category-id="selectedCategoryId"
        @select-category="handleSelectCategory"
        @add-category="handleAddCategory"
        @edit-category="handleEditCategory"
        @delete-category="handleDeleteCategory"
      />
    </aside>

    <!-- 右侧文档列表 -->
    <main class="doc-main">
      <DocumentList
        :documents="documents"
        :category-name="selectedCategoryName"
        @select-document="handleSelectDocument"
        @upload-document="handleUploadDocument"
        @delete-document="handleDeleteDocument"
      />
    </main>

    <!-- 文档阅读器 -->
    <DocumentReader
      v-model:open="isReaderOpen"
      :document="currentDocument"
    />

    <!-- 分类编辑/新增弹窗 -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div
          v-if="isCategoryModalOpen"
          class="modal-overlay"
          @click.self="closeCategoryModal"
        >
          <transition name="modal-scale">
            <div class="modal-content aero-glass aero-border">
              <h3 class="modal-title">
                {{ isEditingCategory ? '编辑分类' : '新增分类' }}
              </h3>

              <div class="modal-body">
                <div>
                  <label class="form-label">分类名称</label>
                  <input
                    v-model="categoryForm.name"
                    type="text"
                    class="form-input"
                    placeholder="请输入分类名称"
                    @keyup.enter="handleSaveCategory"
                  />
                </div>
                <div v-if="categoryForm.parentId" class="form-hint">
                  将作为子分类添加到父分类下
                </div>
              </div>

              <div class="modal-footer">
                <button class="btn-cancel" @click="closeCategoryModal">
                  <X class="w-4 h-4" />
                  取消
                </button>
                <button class="btn-save" @click="handleSaveCategory">
                  <Save class="w-4 h-4" />
                  保存
                </button>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </Teleport>

    <!-- 上传文档确认弹窗 -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div
          v-if="isUploadModalOpen"
          class="modal-overlay"
          @click.self="closeUploadModal"
        >
          <transition name="modal-scale">
            <div class="modal-content aero-glass aero-border">
              <h3 class="modal-title">上传文档</h3>

              <div class="modal-body">
                <div>
                  <label class="form-label">文档标题</label>
                  <input
                    v-model="uploadingDocument.title"
                    type="text"
                    class="form-input"
                    placeholder="请输入文档标题"
                    @keyup.enter="handleSaveUpload"
                  />
                </div>
                <div class="form-hint">
                  文档将上传到 "{{ selectedCategoryName }}" 分类
                </div>
              </div>

              <div class="modal-footer">
                <button class="btn-cancel" @click="closeUploadModal">
                  <X class="w-4 h-4" />
                  取消
                </button>
                <button class="btn-save" @click="handleSaveUpload">
                  <Save class="w-4 h-4" />
                  保存
                </button>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<style scoped>
.documents-view {
  display: flex;
  height: calc(100vh - 80px);
  margin-top: 80px;
  gap: 16px;
  padding: 0 16px 16px;
  box-sizing: border-box;
}

.tree-sidebar {
  width: 260px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.06);
}

.doc-main {
  flex: 1;
  min-width: 0;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-content {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
  padding: 24px;
  background: rgba(30, 30, 40, 0.9);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 20px;
}

.modal-body {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.form-input:focus {
  border-color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.12);
}

.form-hint {
  margin-top: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel,
.btn-save {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
}

.btn-save {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.95);
}

.btn-save:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 弹窗过渡动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-scale-enter-from,
.modal-scale-leave-to {
  transform: scale(0.95);
  opacity: 0;
}
</style>
