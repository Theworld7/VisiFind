<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FormInst } from 'naive-ui'

interface Bookmark {
  id?: number
  name: string
  url: string
  customIcon?: string
  group?: string
  description?: string
}

interface Props {
  show: boolean
  mode: 'add' | 'edit'
  bookmark?: Bookmark | null
}

interface Emits {
  (e: 'update:show', value: boolean): void
  (e: 'save', data: Partial<Bookmark>): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 本地状态同步 show
const localShow = ref(props.show)

// 监听外部 show 变化同步到本地
watch(
  () => props.show,
  (val) => {
    localShow.value = val
  },
)

// 监听本地 show 变化，通知外部
const updateShow = (value: boolean) => {
  localShow.value = value
  emit('update:show', value)
}

const formRef = ref<FormInst | null>(null)

// 表单数据
const formValue = ref({
  name: '',
  url: '',
  group: '',
  icon: '',
  description: '',
})

// 图标相关状态
const iconInputMode = ref<'none' | 'upload' | 'url'>('none')
const iconFileInput = ref<HTMLInputElement | null>(null)

// 标题
const modalTitle = computed(() => (props.mode === 'add' ? '新增书签' : '编辑书签'))

// 监听弹窗打开，同步初始值
watch(
  () => props.show,
  (val) => {
    if (val) {
      if (props.mode === 'edit' && props.bookmark) {
        formValue.value.name = props.bookmark.name || ''
        formValue.value.url = props.bookmark.url || ''
        formValue.value.group = props.bookmark.group || ''
        formValue.value.icon = props.bookmark.customIcon || ''
        formValue.value.description = props.bookmark.description || ''
        iconInputMode.value = props.bookmark.customIcon ? 'upload' : 'none'
      } else {
        formValue.value.name = ''
        formValue.value.url = ''
        formValue.value.group = ''
        formValue.value.icon = ''
        formValue.value.description = ''
        iconInputMode.value = 'none'
      }
    }
  },
)

// 清除自定义图标
const clearCustomIcon = () => {
  formValue.value.icon = ''
  iconInputMode.value = 'none'
}

// 设置图标模式为 URL
const setIconUrlMode = () => {
  iconInputMode.value = 'url'
}

// 触发文件选择
const triggerIconFileInput = () => {
  iconFileInput.value?.click()
}

// 处理图标上传
const handleIconUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      formValue.value.icon = e.target?.result as string
      iconInputMode.value = 'upload'
    }
    reader.readAsDataURL(file)
  }
}

// 取消
const cancel = () => {
  emit('cancel')
  updateShow(false)
}

// 保存
const save = () => {
  const data: Partial<Bookmark> = {
    name: formValue.value.name,
    url: formValue.value.url,
    group: formValue.value.group || undefined,
    customIcon: formValue.value.icon || undefined,
    description: formValue.value.description || undefined,
  }
  if (props.mode === 'edit' && props.bookmark?.id) {
    data.id = props.bookmark.id
  }
  emit('save', data)
  updateShow(false)
}
</script>

<template>
  <n-modal
    :show="localShow"
    preset="card"
    :title="modalTitle"
    style="width: 420px"
    @update:show="updateShow"
  >
    <n-form ref="formRef" :model="formValue">
      <n-form-item label="名称" path="name" :rule="{ required: true, message: '请输入名称' }">
        <n-input v-model:value="formValue.name" placeholder="输入名称" />
      </n-form-item>
      <n-form-item label="网址" path="url" :rule="{ required: true, message: '请输入网址' }">
        <n-input v-model:value="formValue.url" placeholder="https://..." />
      </n-form-item>
      <n-form-item label="分组" path="group">
        <n-input v-model:value="formValue.group" placeholder="输入分组名称（可选）" />
      </n-form-item>
      <n-form-item label="描述" path="description">
        <n-input
          v-model:value="formValue.description"
          type="textarea"
          placeholder="输入描述（可选）"
          :rows="2"
        />
      </n-form-item>
      <n-form-item label="图标" path="icon">
        <div class="icon-input-container">
          <div class="icon-mode-tabs">
            <n-button
              size="small"
              :type="iconInputMode === 'none' ? 'primary' : 'default'"
              @click="clearCustomIcon"
            >
              不使用
            </n-button>
            <n-button
              size="small"
              :type="iconInputMode === 'url' ? 'primary' : 'default'"
              @click="setIconUrlMode"
            >
              在线图片
            </n-button>
            <n-button
              size="small"
              :type="iconInputMode === 'upload' ? 'primary' : 'default'"
              @click="triggerIconFileInput"
            >
              上传图片
            </n-button>
            <input
              ref="iconFileInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleIconUpload"
            />
          </div>
          <div v-if="iconInputMode === 'url'" class="icon-url-input">
            <n-input v-model:value="formValue.icon" placeholder="输入图片URL（如 https://...）" />
            <div v-if="formValue.icon" class="icon-preview">
              <img :src="formValue.icon" alt="预览" @error="clearCustomIcon" />
            </div>
          </div>
          <div v-else-if="formValue.icon" class="icon-preview">
            <img :src="formValue.icon" alt="预览" @error="clearCustomIcon" />
          </div>
        </div>
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space reverse>
        <n-button type="primary" @click="save">保存</n-button>
        <n-button @click="cancel">取消</n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<style scoped>
.icon-input-container {
  width: 100%;
}

.icon-mode-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.icon-url-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.icon-preview {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-light);
  margin-top: 8px;
}

.icon-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
