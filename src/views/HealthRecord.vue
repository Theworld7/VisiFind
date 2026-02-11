<script setup lang="ts">
import { h } from 'vue'
import type { DataTableColumn } from 'naive-ui'
import { NButton, NDataTable, NImage, NTabs, NTabPane } from 'naive-ui'

interface FoodItem {
  image: string
  name: string
  weight: number
  carbs: number
  protein: number
  fat: number
  calories: number
}

const columns: DataTableColumn<FoodItem>[] = [
  {
    title: '图片',
    key: 'image',
    align: 'center',
    width: 80,
    render: (row) => {
      return h(NImage, {
        src: row.image,
        objectFit: 'cover',
        width: 50,
        height: 50,
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
    title: '单位克重',
    key: 'weight',
    align: 'center',
    width: 100,
  },
  {
    title: '碳水',
    key: 'carbs',
    align: 'center',
    width: 80,
  },
  {
    title: '蛋白质',
    key: 'protein',
    align: 'center',
    width: 80,
  },
  {
    title: '脂肪',
    key: 'fat',
    align: 'center',
    width: 80,
  },
  {
    title: '热量（千焦/大卡）',
    key: 'calories',
    align: 'center',
    width: 140,
  },
]

const data: FoodItem[] = []
</script>

<template>
  <div class="health-page">
    <n-tabs :closable="false" animated placement="top" class="tabs-container">
      <n-tab-pane name="intake" tab="摄入记录">
        <div class="intake-content"></div>
      </n-tab-pane>
      <n-tab-pane name="food-library" tab="食物库">
        <div class="table-header">
          <n-button type="primary" round>新增</n-button>
        </div>
        <n-data-table
          :columns="columns"
          :data="data"
          :bordered="false"
          :striped="true"
          :single-line="false"
          :pagination="false"
          size="medium"
        />
      </n-tab-pane>
    </n-tabs>
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
  background: var(--bg-gray-15);
  border-radius: 16px;
  overflow: hidden;
}

:deep(.n-data-table .n-data-table-th) {
  background: var(--bg-gray-25) !important;
  color: #f3f4f6;
}

:deep(.n-data-table .n-data-table-td) {
  background: var(--bg-gray-10);
}

:deep(.n-data-table .n-data-table-tr--striped .n-data-table-td) {
  background: transparent;
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

:deep(.n-data-table .n-data-table-tr:hover .n-data-table-td) {
  background: rgba(107, 114, 128, 0.25) !important;
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
