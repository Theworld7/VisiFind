import { openDB } from './db'
import { marked } from 'marked'
import hljs from 'highlight.js'
import mermaid from 'mermaid'

// 初始化 mermaid - 精致美观主题配置
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    // ========== 基础设置 ==========
    darkMode: false,
    background: '#ffffff',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", sans-serif',
    fontSize: '16px',
    
    // ========== 主色调 - 现代蓝紫系 ==========
    primaryColor: '#e8eaff',
    primaryTextColor: '#1e293b',
    primaryBorderColor: '#6366f1',
    
    // ========== 次要色 - 青绿色系 ==========
    secondaryColor: '#ecfdf5',
    secondaryTextColor: '#064e3b',
    secondaryBorderColor: '#10b981',
    
    // ========== 第三色 - 暖橙色系 ==========
    tertiaryColor: '#fff7ed',
    tertiaryTextColor: '#7c2d12',
    tertiaryBorderColor: '#f97316',
    
    // ========== 注释样式 ==========
    noteBkgColor: '#fef9c3',
    noteTextColor: '#854d0e',
    noteBorderColor: '#eab308',
    noteTextColor: '#854d0e',
    
    // ========== 线条与文本 ==========
    lineColor: '#94a3b8',
    textColor: '#334155',
    
    // ========== 流程图专用 ==========
    mainBkg: '#f8fafc',
    nodeBorder: '#cbd5e1',
    clusterBkg: '#f1f5f9',
    clusterBorder: '#94a3b8',
    titleColor: '#1e293b',
    edgeLabelBackground: '#ffffff',
    nodeTextColor: '#0f172a',
    
    // ========== 序列图专用 ==========
    actorBkg: '#f8fafc',
    actorBorder: '#6366f1',
    actorTextColor: '#1e293b',
    actorLineColor: '#94a3b8',
    actorFontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", sans-serif',
    actorFontSize: '15',
    actorFontWeight: '600',
    signalColor: '#475569',
    signalTextColor: '#1e293b',
    labelBoxBkgColor: '#f1f5f9',
    labelBoxBorderColor: '#cbd5e1',
    labelTextColor: '#334155',
    loopTextColor: '#1e293b',
    activationBorderColor: '#6366f1',
    activationBkgColor: '#e0e7ff',
    sequenceNumberColor: '#64748b',
    messageFontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", sans-serif',
    messageFontSize: '14',
    noteFontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", sans-serif',
    noteFontSize: '14',
    noteAlign: 'center',
    
    // ========== 类图专用 ==========
    classText: '#1e293b',
    classBorder: '#6366f1',
    classBkg: '#ffffff',
    
    // ========== 饼图专用 ==========
    pie1: '#6366f1',
    pie2: '#10b981',
    pie3: '#f59e0b',
    pie4: '#ef4444',
    pie5: '#8b5cf6',
    pie6: '#06b6d4',
    pie7: '#ec4899',
    pie8: '#84cc16',
    pieTitleTextSize: '20px',
    pieTitleTextColor: '#1e293b',
    pieSectionTextSize: '14px',
    pieSectionTextColor: '#334155',
    pieStrokeColor: '#ffffff',
    pieStrokeWidth: '2px',
    pieOuterStrokeWidth: '3px',
    pieOuterStrokeColor: '#e2e8f0',
    pieOpacity: '0.85',
    
    // ========== 甘特图专用 ==========
    taskBkgColor: '#e0e7ff',
    taskTextColor: '#1e293b',
    taskBorderColor: '#6366f1',
    taskTextLightColor: '#ffffff',
    taskTextDarkColor: '#1e293b',
    taskTextOutsideColor: '#475569',
    taskTextClickableColor: '#2563eb',
    activeTaskBkgColor: '#fef3c7',
    activeTaskBorderColor: '#f59e0b',
    doneTaskBkgColor: '#d1fae5',
    doneTaskBorderColor: '#10b981',
    critTaskBkgColor: '#fee2e2',
    critTaskBorderColor: '#ef4444',
    todayLineColor: '#ef4444',
    todayLineWidth: '3px',
    
    // ========== 错误样式 ==========
    errorBkgColor: '#fee2e2',
    errorTextColor: '#991b1b',
  },
  flowchart: {
    curve: 'basis',
    nodeSpacing: 40,
    rankSpacing: 60,
    padding: 10,
    diagramMarginX: 20,
    diagramMarginY: 20,
    nodeRadius: 8,
    defaultRenderer: 'dagre',
  },
  sequence: {
    diagramMarginX: 40,
    diagramMarginY: 20,
    boxTextMargin: 8,
    noteMargin: 12,
    messageMargin: 35,
    mirrorActors: false,
    showSequenceNumbers: true,
    actorFontSize: '15',
    messageFontSize: '14',
    noteFontSize: '14',
    actorPadding: 10,
    messageFontWeight: '400',
  },
  class: {
    hideEmptyMembersBox: true,
    diagramMarginX: 30,
    diagramMarginY: 30,
    nodeSpacing: 30,
    rankSpacing: 40,
  },
  gantt: {
    titleTopMargin: 25,
    barHeight: 24,
    barGap: 4,
    topPadding: 60,
    rightPadding: 60,
    leftPadding: 60,
    gridLineStartPadding: 10,
    fontSize: 13,
    sectionFontSize: 16,
    numberSectionStyles: 3,
    axisFormat: '%Y-%m-%d',
    tickInterval: '1week',
    topAxis: true,
    weekday: 'monday',
  },
  pie: {
    useMaxWidth: true,
    textPosition: 0.75,
    pieTitleTextSize: '18px',
    pieSectionTextSize: '14px',
  },
  state: {
    dividerMargin: 10,
    padding: 12,
    textHeight: 14,
    titleShift: 0,
    titleMargin: 8,
    fontSize: 15,
  },
  mindmap: {
    padding: 12,
    maxNodeWidth: 240,
    nodeSpacing: 30,
    useMaxWidth: false,
  },
  securityLevel: 'loose',
  altFontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans TC", sans-serif',
  look: 'classic',
})

const CATEGORY_STORE = 'documentCategories'
const DOCUMENT_STORE = 'documents'

// 生成唯一 ID
export function generateId() {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 配置 marked 渲染器
const renderer = new marked.Renderer()

// 自定义代码块渲染
renderer.code = ({ text, lang }) => {
  // 检测是否是 mermaid 图表
  if (lang === 'mermaid') {
    const id = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    return `<div class="mermaid-diagram" data-mermaid-id="${id}">${text}</div>`
  }
  
  // 普通代码高亮
  const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
  const highlighted = hljs.highlight(text, { language: validLang }).value
  return `<pre><code class="hljs language-${validLang}">${highlighted}</code></pre>`
}

// 自定义行内代码渲染
renderer.codespan = ({ text }) => {
  return `<code class="inline-code">${text}</code>`
}

marked.setOptions({
  breaks: true,
  gfm: true,
  renderer
})

// ============ 分类操作 ============

// 添加分类
export async function addCategory({ id, name, parentId = null, order = 0 }) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CATEGORY_STORE, 'readwrite')
    const store = transaction.objectStore(CATEGORY_STORE)
    const request = store.add({
      id,
      name,
      parentId,
      order,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

// 更新分类
export async function updateCategory(id, updates) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CATEGORY_STORE, 'readwrite')
    const store = transaction.objectStore(CATEGORY_STORE)
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const category = getRequest.result
      if (!category) {
        reject(new Error('分类不存在'))
        return
      }

      const updated = {
        ...category,
        ...updates,
        id,
        updatedAt: Date.now()
      }

      const putRequest = store.put(updated)
      putRequest.onerror = () => reject(putRequest.error)
      putRequest.onsuccess = () => resolve(putRequest.result)
    }

    getRequest.onerror = () => reject(getRequest.error)
  })
}

// 删除分类
export async function deleteCategory(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CATEGORY_STORE, DOCUMENT_STORE], 'readwrite')
    const categoryStore = transaction.objectStore(CATEGORY_STORE)
    const documentStore = transaction.objectStore(DOCUMENT_STORE)

    // 先删除该分类下的所有文档
    const docIndex = documentStore.index('categoryId')
    const deleteDocRequest = docIndex.openCursor(IDBKeyRange.only(id))

    deleteDocRequest.onsuccess = (event) => {
      const cursor = event.target.result
      if (cursor) {
        documentStore.delete(cursor.primaryKey)
        cursor.continue()
      } else {
        // 文档删除完成后删除分类
        const deleteCategoryRequest = categoryStore.delete(id)
        deleteCategoryRequest.onerror = () => reject(deleteCategoryRequest.error)
        deleteCategoryRequest.onsuccess = () => resolve()
      }
    }

    deleteDocRequest.onerror = () => reject(deleteDocRequest.error)
  })
}

// 获取所有分类
export async function getAllCategories() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(CATEGORY_STORE, 'readonly')
    const store = transaction.objectStore(CATEGORY_STORE)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      // 按 order 排序
      const categories = request.result.sort((a, b) => a.order - b.order)
      resolve(categories)
    }
  })
}

// 构建树状结构
export function buildCategoryTree(categories) {
  const categoryMap = new Map()
  const tree = []
  const nodesWithChildren = new Set()

  // 初始化所有节点
  categories.forEach(cat => {
    categoryMap.set(cat.id, { ...cat, children: [] })
  })

  // 构建树结构
  categories.forEach(cat => {
    const node = categoryMap.get(cat.id)
    if (cat.parentId === null || cat.parentId === undefined) {
      tree.push(node)
    } else {
      const parent = categoryMap.get(cat.parentId)
      if (parent) {
        parent.children.push(node)
        nodesWithChildren.add(cat.parentId) // 记录有子节点的父节点
      } else {
        // 父节点不存在时作为根节点
        tree.push(node)
      }
    }
  })

  return { tree, nodesWithChildren }
}

// 判断是否有子节点
export function hasChildren(node) {
  return node.children && node.children.length > 0
}

// ============ 文档操作 ============

// 添加文档
export async function addDocument({ id, title, categoryId, markdown }) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DOCUMENT_STORE, 'readwrite')
    const store = transaction.objectStore(DOCUMENT_STORE)
    const request = store.add({
      id,
      title,
      categoryId,
      markdown,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

// 更新文档
export async function updateDocument(id, updates) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DOCUMENT_STORE, 'readwrite')
    const store = transaction.objectStore(DOCUMENT_STORE)
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const document = getRequest.result
      if (!document) {
        reject(new Error('文档不存在'))
        return
      }

      const updated = {
        ...document,
        ...updates,
        id,
        updatedAt: Date.now()
      }

      const putRequest = store.put(updated)
      putRequest.onerror = () => reject(putRequest.error)
      putRequest.onsuccess = () => resolve(putRequest.result)
    }

    getRequest.onerror = () => reject(getRequest.error)
  })
}

// 删除文档
export async function deleteDocument(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DOCUMENT_STORE, 'readwrite')
    const store = transaction.objectStore(DOCUMENT_STORE)
    const request = store.delete(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// 根据分类获取文档
export async function getDocumentsByCategory(categoryId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DOCUMENT_STORE, 'readonly')
    const store = transaction.objectStore(DOCUMENT_STORE)
    
    if (categoryId === null || categoryId === undefined) {
      // 获取所有文档
      const request = store.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const docs = request.result.sort((a, b) => b.updatedAt - a.updatedAt)
        resolve(docs)
      }
    } else {
      // 获取指定分类的文档
      const index = store.index('categoryId')
      const request = index.getAll(IDBKeyRange.only(categoryId))
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const docs = request.result.sort((a, b) => b.updatedAt - a.updatedAt)
        resolve(docs)
      }
    }
  })
}

// 获取单个文档
export async function getDocument(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DOCUMENT_STORE, 'readonly')
    const store = transaction.objectStore(DOCUMENT_STORE)
    const request = store.get(id)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

// 获取所有文档
export async function getAllDocuments() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DOCUMENT_STORE, 'readonly')
    const store = transaction.objectStore(DOCUMENT_STORE)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const docs = request.result.sort((a, b) => b.updatedAt - a.updatedAt)
      resolve(docs)
    }
  })
}

// ============ Markdown 渲染 ============

// 使用 marked 库渲染 Markdown 为 HTML
export function renderMarkdown(markdown) {
  if (!markdown) return ''
  return marked(markdown)
}

// 渲染 mermaid 图表
export async function renderMermaidDiagrams(container) {
  if (!container) return
  
  const diagrams = container.querySelectorAll('.mermaid-diagram')
  
  for (const diagram of diagrams) {
    const id = diagram.getAttribute('data-mermaid-id')
    const code = diagram.textContent
    
    try {
      const { svg } = await mermaid.render(id, code)
      diagram.innerHTML = svg
      diagram.classList.add('mermaid-rendered')
    } catch (error) {
      console.error('Mermaid render error:', error)
      diagram.innerHTML = `<pre class="mermaid-error">图表渲染失败: ${error.message}</pre>`
    }
  }
}

// 从文件读取 Markdown
export function readMarkdownFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const markdown = e.target.result
      resolve({ markdown })
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

// ============ 文档数据导出/导入 ============

// 导出所有文档和分类数据
export async function exportAllDocumentsData() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CATEGORY_STORE, DOCUMENT_STORE], 'readonly')
    const categoryStore = transaction.objectStore(CATEGORY_STORE)
    const documentStore = transaction.objectStore(DOCUMENT_STORE)

    const categoriesRequest = categoryStore.getAll()
    const documentsRequest = documentStore.getAll()

    let categories = []
    let documents = []

    categoriesRequest.onsuccess = () => {
      categories = categoriesRequest.result || []
    }
    categoriesRequest.onerror = () => reject(categoriesRequest.error)

    documentsRequest.onsuccess = () => {
      documents = documentsRequest.result || []
    }
    documentsRequest.onerror = () => reject(documentsRequest.error)

    transaction.oncomplete = () => {
      resolve({
        version: 1,
        categories,
        documents
      })
    }
    transaction.onerror = () => reject(transaction.error)
  })
}

// 导入文档和分类数据
export async function importAllDocumentsData(data) {
  if (!data || !Array.isArray(data.categories) || !Array.isArray(data.documents)) {
    throw new Error('无效的文档数据格式')
  }

  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CATEGORY_STORE, DOCUMENT_STORE], 'readwrite')
    const categoryStore = transaction.objectStore(CATEGORY_STORE)
    const documentStore = transaction.objectStore(DOCUMENT_STORE)

    // 先清空现有数据
    const clearCategoriesRequest = categoryStore.clear()
    clearCategoriesRequest.onsuccess = () => {
      const clearDocumentsRequest = documentStore.clear()
      clearDocumentsRequest.onsuccess = () => {
        // 导入分类
        data.categories.forEach(category => {
          categoryStore.put(category)
        })
        // 导入文档
        data.documents.forEach(document => {
          documentStore.put(document)
        })
        resolve()
      }
      clearDocumentsRequest.onerror = () => reject(clearDocumentsRequest.error)
    }
    clearCategoriesRequest.onerror = () => reject(clearCategoriesRequest.error)
  })
}
