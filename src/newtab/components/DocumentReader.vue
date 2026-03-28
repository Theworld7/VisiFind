<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { X } from 'lucide-vue-next'
import { renderMarkdown, renderMermaidDiagrams } from '../lib/documents'

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  document: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:open'])

const readerContentRef = ref(null)

const closeReader = () => {
  emit('update:open', false)
}

// 阻止点击内容区域关闭
const stopClose = (event) => {
  event.stopPropagation()
}

// 渲染后的 HTML 内容
const renderedHtml = computed(() => {
  if (!props.document?.markdown) return ''
  return renderMarkdown(props.document.markdown)
})

// 监听打开状态和文档变化，渲染 mermaid 图表
watch([() => props.open, () => props.document], async ([isOpen]) => {
  if (isOpen && props.document?.markdown) {
    await nextTick()
    const contentEl = readerContentRef.value?.querySelector('.markdown-body')
    if (contentEl) {
      await renderMermaidDiagrams(contentEl)
    }
  }
})
</script>

<template>
  <Teleport to="body">
    <transition name="reader-fade">
      <div
        v-if="open"
        class="document-reader-overlay"
        @click="closeReader"
      >
        <transition name="reader-slide">
          <div
            v-if="open"
            class="document-reader aero-glass aero-border"
            @click="stopClose"
          >
            <!-- 头部 -->
            <div class="reader-header">
              <h2 class="reader-title">{{ document?.title }}</h2>
              <button class="close-btn" @click="closeReader">
                <X class="w-5 h-5" />
              </button>
            </div>

            <!-- 内容 -->
            <div
              ref="readerContentRef"
              class="reader-content"
            >
              <div
                v-if="renderedHtml"
                class="markdown-body"
                v-html="renderedHtml"
              ></div>
              <div v-else class="no-content">
                暂无内容
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.document-reader-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.document-reader {
  width: 100%;
  max-width: 900px;
  height: 85vh;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 
    0 25px 80px rgba(0, 0, 0, 0.25),
    0 8px 24px rgba(0, 0, 0, 0.12),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

.reader-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid #E2E8F0;
  flex-shrink: 0;
  background: linear-gradient(
    to bottom,
    #ffffff 0%,
    #f8fafc 100%
  );
}

.reader-title {
  font-size: 18px;
  font-weight: 600;
  color: #0F172A;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 16px;
  letter-spacing: -0.01em;
}

.close-btn {
  padding: 10px;
  border-radius: 10px;
  background: transparent;
  color: #64748B;
  border: 1px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #F1F5F9;
  color: #1E293B;
  border-color: #E2E8F0;
}

.close-btn:active {
  background: #E2E8F0;
  transform: scale(0.96);
}

.reader-content {
  flex: 1;
  overflow-y: auto;
  padding: 40px 56px;
  background: linear-gradient(
    to bottom,
    #ffffff 0%,
    #fafafa 100%
  );
}

@media (max-width: 768px) {
  .reader-content {
    padding: 24px 32px;
  }
}

.no-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 16px;
}

/* ========================================
   Markdown 样式 - 精致阅读体验
   基于 UI/UX Pro Max 设计系统
   ======================================== */

:deep(.markdown-body) {
  /* 基础排版 */
  color: #1E293B;
  line-height: 1.75;
  font-size: 16px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif;
  max-width: 100%;
  letter-spacing: 0.01em;
}

/* ========================================
   标题层级系统
   ======================================== */
:deep(.markdown-body h1) {
  font-size: 32px;
  font-weight: 700;
  color: #0F172A;
  margin: 1.8em 0 0.8em;
  line-height: 1.25;
  letter-spacing: -0.02em;
  padding-bottom: 0.4em;
  border-bottom: 2px solid #E2E8F0;
}

:deep(.markdown-body h1:first-child) {
  margin-top: 0;
}

:deep(.markdown-body h2) {
  font-size: 24px;
  font-weight: 600;
  color: #1E293B;
  margin: 2em 0 0.75em;
  line-height: 1.35;
  letter-spacing: -0.015em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #E2E8F0;
}

:deep(.markdown-body h3) {
  font-size: 20px;
  font-weight: 600;
  color: #1E293B;
  margin: 1.6em 0 0.6em;
  line-height: 1.4;
  letter-spacing: -0.01em;
}

:deep(.markdown-body h4) {
  font-size: 18px;
  font-weight: 600;
  color: #334155;
  margin: 1.4em 0 0.5em;
  line-height: 1.5;
}

:deep(.markdown-body h5),
:deep(.markdown-body h6) {
  font-size: 16px;
  font-weight: 600;
  color: #475569;
  margin: 1.2em 0 0.4em;
  line-height: 1.5;
}

/* ========================================
   段落与文本
   ======================================== */
:deep(.markdown-body p) {
  margin: 0 0 1.25em;
  line-height: 1.75;
  text-align: justify;
  text-justify: inter-word;
}

:deep(.markdown-body strong) {
  font-weight: 600;
  color: #0F172A;
}

:deep(.markdown-body em) {
  font-style: italic;
  color: #475569;
}

:deep(.markdown-body del) {
  text-decoration: line-through;
  opacity: 0.6;
  color: #94A3B8;
}

:deep(.markdown-body mark) {
  background: linear-gradient(120deg, rgba(251, 191, 36, 0.3) 0%, rgba(251, 191, 36, 0.4) 100%);
  padding: 0.1em 0.3em;
  border-radius: 3px;
  color: #1E293B;
}

/* ========================================
   链接样式
   ======================================== */
:deep(.markdown-body a) {
  color: #2563EB;
  text-decoration: none;
  border-bottom: 1px solid rgba(37, 99, 235, 0.3);
  transition: all 0.2s ease;
  font-weight: 500;
}

:deep(.markdown-body a:hover) {
  color: #1D4ED8;
  border-bottom-color: #1D4ED8;
  background: rgba(37, 99, 235, 0.05);
}

:deep(.markdown-body a:active) {
  color: #1E40AF;
}

/* ========================================
   列表系统
   ======================================== */
:deep(.markdown-body ul),
:deep(.markdown-body ol) {
  margin: 0 0 1.25em;
  padding-left: 1.75em;
}

:deep(.markdown-body ul) {
  list-style-type: none;
}

:deep(.markdown-body ul > li) {
  position: relative;
}

:deep(.markdown-body ul > li::before) {
  content: '';
  position: absolute;
  left: -1.75em;
  top: 0.65em;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #94A3B8;
  transition: background 0.2s ease;
}

:deep(.markdown-body ul > li:hover::before) {
  background: #64748B;
}

:deep(.markdown-body ol) {
  list-style-type: decimal;
  counter-reset: item;
}

:deep(.markdown-body ol > li) {
  position: relative;
  padding-left: 0.5em;
}

:deep(.markdown-body ol > li::marker) {
  color: #64748B;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

:deep(.markdown-body li) {
  margin: 0.5em 0;
  line-height: 1.75;
  display: list-item;
}

:deep(.markdown-body li > ul),
:deep(.markdown-body li > ol) {
  margin: 0.5em 0 0;
  padding-left: 1.5em;
}

/* 嵌套列表 */
:deep(.markdown-body ul ul),
:deep(.markdown-body ol ol),
:deep(.markdown-body ul ol),
:deep(.markdown-body ol ul) {
  margin: 0.5em 0;
}

:deep(.markdown-body ul ul li::before) {
  width: 5px;
  height: 5px;
  background: #CBD5E1;
}

/* 任务列表 */
:deep(.markdown-body .task-list-item) {
  list-style: none;
  margin-left: -1.5em;
}

:deep(.markdown-body .task-list-item input[type="checkbox"]) {
  margin-right: 0.5em;
  accent-color: #2563EB;
}

/* ========================================
   引用块
   ======================================== */
:deep(.markdown-body blockquote) {
  margin: 1.5em 0;
  padding: 1em 1.5em;
  border-left: 4px solid #2563EB;
  background: linear-gradient(
    to right,
    rgba(37, 99, 235, 0.04) 0%,
    rgba(37, 99, 235, 0.02) 100%
  );
  color: #475569;
  font-size: 16px;
  border-radius: 0 8px 8px 0;
  position: relative;
}

:deep(.markdown-body blockquote::before) {
  content: '"';
  position: absolute;
  top: 0.2em;
  left: 0.6em;
  font-size: 2em;
  color: rgba(37, 99, 235, 0.2);
  font-family: Georgia, serif;
  line-height: 1;
}

:deep(.markdown-body blockquote p) {
  margin: 0;
  padding-left: 0.5em;
}

:deep(.markdown-body blockquote blockquote) {
  margin: 1em 0;
  border-left-color: #64748B;
  background: rgba(100, 116, 139, 0.03);
}

/* ========================================
   代码块与行内代码
   ======================================== */
:deep(.markdown-body pre) {
  margin: 1.5em 0;
  padding: 0;
  background: #1E293B;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(30, 41, 59, 0.5);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

:deep(.markdown-body pre code) {
  display: block;
  padding: 1.25em 1.5em;
  font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  tab-size: 2;
  overflow-x: auto;
  background: transparent;
  color: #E2E8F0;
}

:deep(.markdown-body pre code.hljs) {
  background: #1E293B;
  padding: 1.25em 1.5em;
}

/* 代码块语言标签 */
:deep(.markdown-body pre .code-language) {
  position: absolute;
  top: 0.5em;
  right: 1em;
  font-size: 12px;
  color: #64748B;
  font-family: 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* 行内代码 */
:deep(.markdown-body .inline-code),
:deep(.markdown-body code:not(pre code)) {
  font-family: 'JetBrains Mono', 'Fira Code', 'SFMono-Regular', 'Consolas', monospace;
  font-size: 0.875em;
  background: rgba(148, 163, 184, 0.12);
  color: #DC2626;
  padding: 0.15em 0.5em;
  border-radius: 5px;
  font-weight: 400;
  border: 1px solid rgba(148, 163, 184, 0.15);
  letter-spacing: -0.01em;
}

/* ========================================
   水平分割线
   ======================================== */
:deep(.markdown-body hr) {
  margin: 2.5em 0;
  border: none;
  border-top: 2px solid #E2E8F0;
  position: relative;
}

:deep(.markdown-body hr::after) {
  content: '';
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  background: #E2E8F0;
  border-radius: 50%;
}

/* ========================================
   图片与媒体
   ======================================== */
:deep(.markdown-body img) {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  margin: 1.5em 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

:deep(.markdown-body img:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

:deep(.markdown-body figure) {
  margin: 1.5em 0;
}

:deep(.markdown-body figcaption) {
  text-align: center;
  font-size: 14px;
  color: #64748B;
  margin-top: 0.75em;
  font-style: italic;
}

/* ========================================
   表格系统
   ======================================== */
:deep(.markdown-body table) {
  width: 100%;
  margin: 1.5em 0;
  border-collapse: collapse;
  font-size: 15px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #E2E8F0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

:deep(.markdown-body thead) {
  background: linear-gradient(
    to bottom,
    #F8FAFC 0%,
    #F1F5F9 100%
  );
}

:deep(.markdown-body th) {
  padding: 12px 16px;
  border: none;
  border-bottom: 2px solid #E2E8F0;
  text-align: left;
  font-weight: 600;
  color: #1E293B;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-variant-numeric: tabular-nums;
}

:deep(.markdown-body td) {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  text-align: left;
  vertical-align: top;
  min-width: 100px;
  color: #334155;
}

:deep(.markdown-body tbody tr) {
  transition: background 0.15s ease;
}

:deep(.markdown-body tbody tr:hover) {
  background: linear-gradient(
    to right,
    rgba(37, 99, 235, 0.03) 0%,
    rgba(37, 99, 235, 0.02) 100%
  );
}

:deep(.markdown-body tbody tr:nth-child(even)) {
  background: rgba(241, 245, 249, 0.3);
}

:deep(.markdown-body tbody tr:nth-child(even):hover) {
  background: linear-gradient(
    to right,
    rgba(37, 99, 235, 0.05) 0%,
    rgba(37, 99, 235, 0.03) 100%
  );
}

/* 响应式表格 */
:deep(.markdown-body .table-wrapper) {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* ========================================
   Mermaid 图表 - 精致美观主题
   ======================================== */
:deep(.mermaid-diagram) {
  margin: 2em 0;
  padding: 24px;
  background: linear-gradient(
    135deg,
    #F8FAFC 0%,
    #F1F5F9 100%
  );
  border-radius: 12px;
  overflow-x: auto;
  text-align: center;
  border: 1px solid #E2E8F0;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
}

:deep(.mermaid-diagram:hover) {
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

:deep(.mermaid-diagram.mermaid-rendered) {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
}

:deep(.mermaid-diagram svg) {
  max-width: 100%;
  height: auto;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif;
}

/* 节点样式优化 - 紧凑尺寸 */
:deep(.mermaid-diagram .node rect),
:deep(.mermaid-diagram .node circle),
:deep(.mermaid-diagram .node ellipse),
:deep(.mermaid-diagram .node polygon) {
  rx: 6px;
  ry: 6px;
  stroke-width: 1.5px;
  transition: all 0.2s ease;
}

:deep(.mermaid-diagram .node rect:hover),
:deep(.mermaid-diagram .node circle:hover),
:deep(.mermaid-diagram .node ellipse:hover),
:deep(.mermaid-diagram .node polygon:hover) {
  filter: brightness(0.95);
  transform: translateY(-1px);
}

/* 节点文本 - 适配内容宽度 */
:deep(.mermaid-diagram .node .label) {
  font-size: 14px !important;
  line-height: 1.5 !important;
  padding: 3px 10px !important;
  font-weight: 500 !important;
}

/* 边标签样式 - 紧凑尺寸 */
:deep(.mermaid-diagram .edgeLabel rect) {
  fill: #ffffff !important;
  stroke: #E2E8F0 !important;
  stroke-width: 1px !important;
  rx: 4px !important;
  ry: 4px !important;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.06)) !important;
}

:deep(.mermaid-diagram .edgeLabel span) {
  color: #1E2937 !important;
  background: transparent !important;
  font-weight: 500 !important;
  font-size: 13px !important;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif !important;
  padding: 2px 6px !important;
}

/* 边路径样式 */
:deep(.mermaid-diagram .edgePath path) {
  stroke-width: 1.5px;
  stroke: #64748B;
  fill: none;
  transition: stroke 0.2s ease;
}

:deep(.mermaid-diagram .edgePath path:hover) {
  stroke: #475569;
}

/* 箭头样式 */
:deep(.mermaid-diagram .marker) {
  stroke: #64748B;
  fill: #64748B;
  stroke-width: 1.5px;
}

/* 集群/子图样式 - 紧凑尺寸 */
:deep(.mermaid-diagram .cluster rect) {
  fill: #F8FAFC !important;
  stroke: #CBD5E1 !important;
  stroke-width: 1.5px !important;
  rx: 10px !important;
  ry: 10px !important;
}

:deep(.mermaid-diagram .cluster line) {
  stroke: #94A3B8 !important;
  stroke-width: 1.5px !important;
}

/* 注释框样式 - 紧凑尺寸 */
:deep(.mermaid-diagram .note) {
  rx: 6px;
  ry: 6px;
}

:deep(.mermaid-diagram .note-path) {
  fill: #FEF9C3 !important;
  stroke: #EAB308 !important;
  stroke-width: 1.5px !important;
}

:deep(.mermaid-diagram .note-text) {
  fill: #854D0E !important;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif !important;
  font-size: 13px !important;
}

/* 序列图特定样式 - 紧凑尺寸 */
:deep(.mermaid-diagram .actor) {
  stroke-width: 1.5px;
}

:deep(.mermaid-diagram .actor-line) {
  stroke: #94A3B8 !important;
  stroke-width: 1px !important;
}

:deep(.mermaid-diagram .signal-line) {
  stroke: #475569 !important;
  stroke-width: 1.5px !important;
}

:deep(.mermaid-diagram .activation) {
  fill: #E0E7FF !important;
  stroke: #6366F1 !important;
  stroke-width: 1.5px !important;
  rx: 3px !important;
  ry: 3px !important;
}

:deep(.mermaid-diagram .actor-text) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  fill: #1E293B !important;
}

:deep(.mermaid-diagram .messageText) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif !important;
  font-size: 14px !important;
  fill: #334155 !important;
}

/* 饼图样式 - 紧凑尺寸 */
:deep(.mermaid-diagram .pie-section) {
  stroke: #ffffff !important;
  stroke-width: 1.5px !important;
  transition: opacity 0.2s ease;
}

:deep(.mermaid-diagram .pie-section:hover) {
  opacity: 0.85;
}

:deep(.mermaid-diagram .pie-title) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif !important;
  font-weight: 600 !important;
  font-size: 18px !important;
  fill: #1E293B !important;
}

:deep(.mermaid-diagram .pie-value-text) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif !important;
  font-size: 14px !important;
  fill: #334155 !important;
}

/* 甘特图样式 - 紧凑尺寸 */
:deep(.mermaid-diagram .gantt-bar) {
  stroke-width: 1.5px !important;
  rx: 3px !important;
  ry: 3px !important;
}

:deep(.mermaid-diagram .gantt-bar:hover) {
  filter: brightness(0.9);
}

:deep(.mermaid-diagram .gantt-today-line) {
  stroke: #EF4444 !important;
  stroke-width: 2px !important;
  stroke-dasharray: 4, 4;
}

:deep(.mermaid-diagram .gantt-grid-line) {
  stroke: #E2E8F0 !important;
  stroke-width: 1px !important;
}

:deep(.mermaid-diagram .gantt-task-text) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif !important;
  font-size: 13px !important;
  fill: #1E293B !important;
}

/* 类图样式 - 紧凑尺寸 */
:deep(.mermaid-diagram .class-group rect) {
  fill: #ffffff !important;
  stroke: #6366F1 !important;
  stroke-width: 1.5px !important;
  rx: 6px !important;
  ry: 6px !important;
}

:deep(.mermaid-diagram .class-title-text) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif !important;
  font-weight: 600 !important;
  font-size: 15px !important;
  fill: #1E293B !important;
}

:deep(.mermaid-diagram .class-text) {
  font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace !important;
  font-size: 13px !important;
  fill: #475569 !important;
}

/* 状态图样式 - 紧凑尺寸 */
:deep(.mermaid-diagram .state-group rect) {
  fill: #F8FAFC !important;
  stroke: #6366F1 !important;
  stroke-width: 1.5px !important;
  rx: 6px !important;
  ry: 6px !important;
}

:deep(.mermaid-diagram .state-transition) {
  stroke: #64748B !important;
  stroke-width: 1.5px !important;
  fill: none;
}

:deep(.mermaid-diagram .state-label-text) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif !important;
  font-size: 14px !important;
  fill: #334155 !important;
}

/* 思维导图样式 - 紧凑尺寸 */
:deep(.mermaid-diagram .mindmap-node rect) {
  fill: #E0E7FF !important;
  stroke: #6366F1 !important;
  stroke-width: 1.5px !important;
  rx: 6px !important;
  ry: 6px !important;
}

:deep(.mermaid-diagram .mindmap-branch) {
  stroke: #A5B4FC !important;
  stroke-width: 2px !important;
  fill: none;
}

:deep(.mermaid-diagram .mindmap-node-text) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', sans-serif !important;
  font-size: 14px !important;
  fill: #1E293B !important;
}

/* 错误提示样式 */
:deep(.mermaid-error) {
  color: #DC2626;
  background: linear-gradient(
    to right,
    rgba(254, 226, 226, 0.8) 0%,
    rgba(254, 226, 226, 0.6) 100%
  );
  padding: 16px 20px;
  border-radius: 8px;
  font-size: 14px;
  text-align: left;
  border: 1px solid rgba(220, 38, 38, 0.2);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  display: flex;
  align-items: center;
  gap: 10px;
}

:deep(.mermaid-error::before) {
  content: '⚠️';
  font-size: 18px;
}

/* 图表容器工具栏（可选） */
:deep(.mermaid-toolbar) {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px 12px;
  background: #F8FAFC;
  border-radius: 8px 8px 0 0;
  border: 1px solid #E2E8F0;
  border-bottom: none;
}

:deep(.mermaid-toolbar button) {
  padding: 6px 12px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  color: #475569;
  background: #ffffff;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

:deep(.mermaid-toolbar button:hover) {
  background: #F1F5F9;
  border-color: #CBD5E1;
  color: #1E293B;
}

/* 响应式优化 */
@media (max-width: 768px) {
  :deep(.mermaid-diagram) {
    padding: 16px;
    margin: 1.5em 0;
  }
  
  :deep(.mermaid-diagram svg) {
    min-width: 100%;
  }
}

/* 打印优化 */
@media print {
  :deep(.mermaid-diagram) {
    background: #ffffff;
    box-shadow: none;
    border: 1px solid #E2E8F0;
  }
  
  :deep(.mermaid-diagram .node rect),
  :deep(.mermaid-diagram .node circle),
  :deep(.mermaid-diagram .node ellipse),
  :deep(.mermaid-diagram .node polygon) {
    transition: none;
  }
  
  :deep(.mermaid-diagram .node rect:hover),
  :deep(.mermaid-diagram .node circle:hover),
  :deep(.mermaid-diagram .node ellipse:hover),
  :deep(.mermaid-diagram .node polygon:hover) {
    transform: none;
    filter: none;
  }
}

/* ========================================
   其他元素
   ======================================== */

/* 定义列表 */
:deep(.markdown-body dl) {
  margin: 1.5em 0;
}

:deep(.markdown-body dt) {
  font-weight: 600;
  color: #1E293B;
  margin: 1em 0 0.5em;
}

:deep(.markdown-body dd) {
  margin: 0 0 1em 1.5em;
  color: #475569;
}

/* 脚注 */
:deep(.markdown-body .footnote-ref) {
  color: #2563EB;
  font-weight: 600;
  vertical-align: super;
  font-size: 0.75em;
}

:deep(.markdown-body .footnotes) {
  margin-top: 2em;
  padding-top: 1.5em;
  border-top: 2px solid #E2E8F0;
  font-size: 14px;
  color: #64748B;
}

:deep(.markdown-body .footnotes ol) {
  padding-left: 1.5em;
}

:deep(.markdown-body .footnotes li) {
  margin: 0.5em 0;
}

:deep(.markdown-body .footnotes li::marker) {
  color: #94A3B8;
}

/* 数学公式占位符 */
:deep(.markdown-body .math) {
  font-style: italic;
  background: rgba(37, 99, 235, 0.05);
  padding: 0.2em 0.5em;
  border-radius: 4px;
  color: #1E40AF;
}

/* 警告/提示框 */
:deep(.markdown-body .alert),
:deep(.markdown-body .callout) {
  padding: 1em 1.25em;
  border-radius: 8px;
  margin: 1.5em 0;
  border-left: 4px solid;
}

:deep(.markdown-body .alert-info),
:deep(.markdown-body .callout-info) {
  background: rgba(37, 99, 235, 0.08);
  border-left-color: #2563EB;
  color: #1E40AF;
}

:deep(.markdown-body .alert-warning),
:deep(.markdown-body .callout-warning) {
  background: rgba(245, 158, 11, 0.08);
  border-left-color: #F59E0B;
  color: #92400E;
}

:deep(.markdown-body .alert-danger),
:deep(.markdown-body .callout-danger) {
  background: rgba(220, 38, 38, 0.08);
  border-left-color: #DC2626;
  color: #991B1B;
}

:deep(.markdown-body .alert-success),
:deep(.markdown-body .callout-success) {
  background: rgba(34, 197, 94, 0.08);
  border-left-color: #22C55E;
  color: #166534;
}

/* 滚动条样式 */
.reader-content::-webkit-scrollbar {
  width: 8px;
}

.reader-content::-webkit-scrollbar-track {
  background: transparent;
}

.reader-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 4px;
}

.reader-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

/* 过渡动画 */
.reader-fade-enter-active,
.reader-fade-leave-active {
  transition: opacity 0.3s ease;
}

.reader-fade-enter-from,
.reader-fade-leave-to {
  opacity: 0;
}

.reader-slide-enter-active,
.reader-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.reader-slide-enter-from,
.reader-slide-leave-to {
  transform: scale(0.95) translateY(20px);
  opacity: 0;
}
</style>
