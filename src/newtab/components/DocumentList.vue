<script setup>
import { ref, computed } from 'vue'
import { FileText, Upload, Trash2, Calendar, ArrowUpDown } from 'lucide-vue-next'
import { readMarkdownFile } from '../lib/documents'

const props = defineProps({
  documents: {
    type: Array,
    default: () => []
  },
  categoryName: {
    type: String,
    default: '全部文档'
  }
})

const emit = defineEmits(['select-document', 'upload-document', 'delete-document'])

// 排序状态：'asc' | 'desc'
const sortOrder = ref('asc')

// 文件输入引用
const fileInputRef = ref(null)

// 中文数字映射
const chineseNumberMap = {
  '零': 0, '一': 1, '二': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
}

// 解析中文数字为阿拉伯数字
const parseChineseNumber = (str) => {
  if (!str) return 0
  
  // 匹配"第 X 章"格式
  const match = str.match(/第 ([零一二三四五六七八九十 0-9]+) [章编节部分条]/)
  if (!match) return null
  
  const numStr = match[1]
  
  // 纯数字
  if (/^\d+$/.test(numStr)) {
    return parseInt(numStr, 10)
  }
  
  // 单个中文数字
  if (numStr.length === 1) {
    return chineseNumberMap[numStr] || 0
  }
  
  // 处理"十一"、"二十"等
  let result = 0
  let temp = 0
  
  for (let i = 0; i < numStr.length; i++) {
    const char = numStr[i]
    const value = chineseNumberMap[char]
    
    if (char === '十') {
      if (temp === 0) {
        temp = 10
      } else {
        result += temp * 10
        temp = 0
      }
    } else if (value !== undefined) {
      temp += value
    }
  }
  
  result += temp
  return result
}

// 提取标题中的序号
const extractNumberFromTitle = (title) => {
  if (!title) return 0
  
  // 尝试匹配中文数字格式
  const chineseNum = parseChineseNumber(title)
  if (chineseNum !== null) return chineseNum
  
  // 尝试匹配阿拉伯数字格式
  const match = title.match(/(\d+)/)
  if (match) {
    return parseInt(match[1], 10)
  }
  
  return 0
}

// 排序后的文档列表
const sortedDocuments = computed(() => {
  const docs = [...props.documents]
  
  return docs.sort((a, b) => {
    const numA = extractNumberFromTitle(a.title)
    const numB = extractNumberFromTitle(b.title)
    
    // 如果都有序号，按序号排序
    if (numA > 0 && numB > 0) {
      return sortOrder.value === 'asc' ? numA - numB : numB - numA
    }
    
    // 否则按更新时间排序
    const timeA = a.updatedAt || 0
    const timeB = b.updatedAt || 0
    return sortOrder.value === 'asc' ? timeA - timeB : timeB - timeA
  })
})

// 切换排序顺序
const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

// 触发文件选择
const triggerFileUpload = () => {
  fileInputRef.value?.click()
}

// 处理文件上传
const handleFileChange = async (event) => {
  const file = event.target.files[0]
  if (!file || !file.name.endsWith('.md')) {
    alert('请上传 Markdown 文件 (.md)')
    return
  }

  try {
    const { markdown } = await readMarkdownFile(file)
    emit('upload-document', {
      file,
      markdown,
      title: file.name.replace(/\.md$/i, '')
    })
  } catch (error) {
    console.error('读取文件失败:', error)
    alert('读取文件失败，请重试')
  }

  // 清空文件输入
  event.target.value = ''
}

// 删除文档
const handleDelete = (document, event) => {
  event.stopPropagation()
  if (confirm(`确定要删除文档"${document.title}"吗？`)) {
    emit('delete-document', document)
  }
}

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 生成摘要
const generateExcerpt = (content) => {
  if (!content) return '暂无内容'
  // 移除 HTML 标签，获取纯文本
  const text = content.replace(/<[^>]*>/g, '')
  // 截取前 100 个字符
  return text.length > 100 ? text.substring(0, 100) + '...' : text
}
</script>

<template>
  <div class="document-list">
    <!-- 头部 -->
    <div class="list-header">
      <div class="list-title">
        <FileText class="w-5 h-5" />
        <span>{{ categoryName }}</span>
        <span class="doc-count">{{ documents.length }} 篇文档</span>
      </div>
      <div class="list-actions">
        <button class="sort-btn" @click="toggleSortOrder" :title="sortOrder === 'asc' ? '正序排列' : '倒序排列'">
          <ArrowUpDown class="w-4 h-4" :class="{ 'rotate-180': sortOrder === 'desc' }" />
        </button>
        <button class="upload-btn" @click="triggerFileUpload">
          <Upload class="w-4 h-4" />
          <span>上传文档</span>
        </button>
      </div>
      <input
        ref="fileInputRef"
        type="file"
        accept=".md"
        class="hidden"
        @change="handleFileChange"
      />
    </div>

    <!-- 文档列表 -->
    <div class="list-content">
      <div v-if="sortedDocuments.length === 0" class="empty-state">
        <FileText class="w-16 h-16 text-white/20" />
        <p class="empty-text">暂无文档</p>
        <p class="empty-hint">点击上方按钮上传 Markdown 文档</p>
      </div>

      <div v-else class="doc-grid">
        <div
          v-for="doc in sortedDocuments"
          :key="doc.id"
          class="doc-card aero-glass aero-border"
          @click="emit('select-document', doc)"
        >
          <div class="doc-header">
            <FileText class="w-5 h-5 text-white/60" />
            <h3 class="doc-title">{{ doc.title }}</h3>
          </div>

          <p class="doc-excerpt">{{ generateExcerpt(doc.htmlContent) }}</p>

          <div class="doc-footer">
            <div class="doc-date">
              <Calendar class="w-3.5 h-3.5" />
              <span>{{ formatDate(doc.updatedAt) }}</span>
            </div>
            <button
              class="delete-btn"
              @click="handleDelete(doc, $event)"
              title="删除文档"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.document-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  gap: 12px;
}

.list-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.doc-count {
  font-size: 12px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.list-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 0.2s;
}

.sort-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.95);
}

.sort-btn .rotate-180 {
  transform: rotate(180deg);
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.list-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.4);
}

.empty-text {
  margin-top: 16px;
  font-size: 16px;
}

.empty-hint {
  margin-top: 8px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
}

.doc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.doc-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.08);
}

.doc-card:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}

.doc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.doc-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-excerpt {
  flex: 1;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  margin-bottom: 12px;
}

.doc-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.doc-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.delete-btn {
  padding: 4px;
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}
</style>
