<script setup lang="ts">
// TODO: 健康记录功能待完善
// - 摄入记录功能
// - 食物库 CRUD 操作
// - 数据持久化

import { h, onMounted, reactive, ref, toRaw } from 'vue'
import type { DataTableColumn, UploadFileInfo } from 'naive-ui'
import { useMessage } from 'naive-ui'
import {
  NButton,
  NDataTable,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NImage,
  NInput,
  NInputNumber,
  NSpace,
  NTabs,
  NTabPane,
  NUpload,
} from 'naive-ui'
import { useFoodLibrary, type FoodItem } from '@/composables/useFoodLibrary'

interface FoodItemWithId extends FoodItem {
  id: number
}

const { initDB, loadFoods, addFood, deleteFood, foods } = useFoodLibrary()
const message = useMessage()

const data = ref<FoodItemWithId[]>([])

onMounted(async () => {
  await initDB()
  const loadedFoods = await loadFoods()
  data.value = loadedFoods as FoodItemWithId[]
})

const columns: DataTableColumn<FoodItemWithId>[] = [
  {
    title: '图片',
    key: 'image',
    align: 'center',
    width: 80,
    render: (row) => {
      return h(NImage, {
        src: row.image,
        objectFit: 'cover',
        width: 40,
        height: 40,
        round: true,
      })
    },
  },
  {
    title: '食物',
    key: 'name',
    align: 'left',
    ellipsis: true,
  },
  {
    title: '类别',
    key: 'category',
    align: 'center',
  },
  {
    title: '数量/单位',
    key: 'quantity',
    align: 'center',
    render: (row: FoodItem) => {
      return `${row.quantity}${row.unit}`
    },
  },
  {
    title: '碳水(g)',
    key: 'carbs',
    align: 'center',
  },
  {
    title: '蛋白质(g)',
    key: 'protein',
    align: 'center',
  },
  {
    title: '脂肪(g)',
    key: 'fat',
    align: 'center',
  },
  {
    title: '热量(kcal)',
    key: 'calories',
    align: 'center',
  },
  {
    title: '操作',
    key: 'actions',
    align: 'center',
    width: 80,
    render: (row: FoodItemWithId) => {
      return h(
        NButton,
        {
          size: 'small',
          type: 'error',
          text: true,
          onClick: async () => {
            try {
              await deleteFood(row.id)
              data.value = data.value.filter((item) => item.id !== row.id)
              message.success('删除成功')
            } catch {
              message.error('删除失败')
            }
          },
        },
        { default: () => '删除' },
      )
    },
  },
]

const drawerVisible = ref(false)
const formData = reactive<FoodItem>({
  image: '',
  name: '',
  category: '',
  quantity: 100,
  unit: 'g',
  carbs: 0,
  protein: 0,
  fat: 0,
  calories: 0,
})

const handleUpload = (options: { file: UploadFileInfo }) => {
  const file = options.file.file
  if (file) {
    const url = URL.createObjectURL(file)
    formData.image = url
  }
}

const openDrawer = () => {
  Object.assign(formData, {
    image: '',
    name: '',
    category: '',
    quantity: 100,
    unit: 'g',
    carbs: 0,
    protein: 0,
    fat: 0,
    calories: 0,
  })
  drawerVisible.value = true
}

const handleSave = async () => {
  try {
    const id = await addFood(toRaw(formData))
    data.value.push({ ...toRaw(formData), id })
    drawerVisible.value = false
    message.success('保存成功')
  } catch {
    message.error('保存失败')
  }
}
</script>

<template>
  <div class="health-page">
    <n-tabs :closable="false" animated placement="top" class="tabs-container">
      <n-tab-pane name="intake" tab="摄入记录">
        <div class="intake-content"></div>
      </n-tab-pane>
      <n-tab-pane name="food-library" tab="食物库">
        <div class="table-header">
          <n-button type="primary" round @click="openDrawer">新增</n-button>
        </div>
        <n-data-table
          :columns="columns"
          :data="data"
          :bordered="false"
          :single-line="false"
          :pagination="false"
          size="medium"
        />
      </n-tab-pane>
    </n-tabs>

    <n-drawer v-model:show="drawerVisible" :width="400" placement="right">
      <n-drawer-content title="新增食物" closable>
        <n-form label-placement="left" label-width="80px">
          <n-form-item label="图片">
            <n-space vertical style="width: 100%">
              <n-upload
                :max="1"
                accept="image/*"
                :custom-request="handleUpload"
                :show-file-list="false"
              >
                <n-button>上传</n-button>
              </n-upload>
              <n-input v-model:value="formData.image" placeholder="或输入图片URL" />
              <n-image
                v-if="formData.image"
                :src="formData.image"
                object-fit="cover"
                width="80"
                height="80"
                style="margin-top: 8px; border-radius: 8px"
              />
            </n-space>
          </n-form-item>
          <n-form-item label="食物名称">
            <n-input v-model:value="formData.name" placeholder="请输入食物名称" />
          </n-form-item>
          <n-form-item label="类别">
            <n-input v-model:value="formData.category" placeholder="请输入类别" />
          </n-form-item>
          <n-form-item label="数量">
            <n-input-number v-model:value="formData.quantity" :min="1" style="width: 100%" />
          </n-form-item>
          <n-form-item label="单位">
            <n-input v-model:value="formData.unit" placeholder="如: g, ml, 个" />
          </n-form-item>
          <n-form-item label="碳水(g)">
            <n-input-number v-model:value="formData.carbs" :min="0" style="width: 100%" />
          </n-form-item>
          <n-form-item label="蛋白质(g)">
            <n-input-number v-model:value="formData.protein" :min="0" style="width: 100%" />
          </n-form-item>
          <n-form-item label="脂肪(g)">
            <n-input-number v-model:value="formData.fat" :min="0" style="width: 100%" />
          </n-form-item>
          <n-form-item label="热量(kcal)">
            <n-input-number v-model:value="formData.calories" :min="0" style="width: 100%" />
          </n-form-item>
        </n-form>
        <template #footer>
          <n-space justify="end">
            <n-button @click="drawerVisible = false">取消</n-button>
            <n-button type="primary" @click="handleSave">保存</n-button>
          </n-space>
        </template>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<style scoped>
.health-page {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 100px 16px 0;
}

.intake-content {
  min-height: 200px;
}

.table-header {
  margin-bottom: 16px;
}

:deep(.n-data-table) {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  overflow: hidden;
}

:deep(.n-data-table .n-data-table-th) {
  background: rgba(255, 255, 255, 0.3) !important;
  color: #333;
}

:deep(.n-data-table .n-data-table-td) {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  vertical-align: middle;
}

:deep(.n-data-table .n-data-table-table) {
  background: transparent !important;
}

:deep(.n-data-table .n-data-table-thead) {
  background: transparent !important;
}

:deep(.n-data-table:not(.n-data-table--single-line) .n-data-table-th) {
  border-color: rgba(107, 114, 128, 0.3);
}

:deep(.n-data-table:not(.n-data-table--single-line) .n-data-table-td) {
  border-color: rgba(107, 114, 128, 0.2);
}

:deep(.n-data-table .n-data-table-thead:hover) {
  background: rgba(107, 114, 128, 0.35) !important;
}

:deep(.n-data-table-tr:hover .n-data-table-td) {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

:deep(.n-data-table .n-data-table-th:hover) {
  background: rgba(107, 114, 128, 0.35) !important;
}

:deep(.n-data-table-th) {
  text-align: center;
  font-weight: 600;
}

:deep(.n-data-table-td) {
  text-align: center;
}
</style>
