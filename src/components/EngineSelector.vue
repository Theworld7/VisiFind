<script setup lang="ts">
import { ref } from 'vue'
import baiduIcon from '@/assets/baidu.svg'
import bingIcon from '@/assets/bing.svg'
import googleIcon from '@/assets/google.svg'
import sougouIcon from '@/assets/sougou.svg'

interface Engine {
  name: string
  label: string
  icon: string
}

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [engine: string]
}>()

const engines: Engine[] = [
  { name: 'baidu', label: '百度', icon: baiduIcon },
  { name: 'bing', label: '必应', icon: bingIcon },
  { name: 'google', label: '谷歌', icon: googleIcon },
  { name: 'sogou', label: '搜狗', icon: sougouIcon },
]

const selectEngine = (engine: string) => {
  emit('update:modelValue', engine)
}
</script>

<template>
  <div class="engine-tags">
    <div
      v-for="engine in engines"
      :key="engine.name"
      class="engine-tag"
      :class="{ active: modelValue === engine.name }"
      @click="selectEngine(engine.name)"
    >
      <img :src="engine.icon" class="engine-icon" alt="" />
      <span class="engine-label">{{ engine.label }}</span>
    </div>
  </div>
</template>

<style scoped>
/* 引入全局 CSS 变量 */

.engine-tags {
  display: flex;
  gap: 8px;
  justify-content: flex-start;
  margin-bottom: 16px;
}

.engine-tag {
  padding: 8px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 50%;
  font-size: 14px;
  color: var(--text-white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  width: 32px;
  height: 32px;
  overflow: hidden;
  box-shadow: 0 2px 8px var(--bg-overlay-lighter);
  transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.engine-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.engine-label {
  opacity: 0;
  max-width: 0;
  white-space: nowrap;
  transition: none;
}

.engine-tag:hover .engine-label,
.engine-tag.active .engine-label {
  opacity: 1;
  max-width: 60px;
}

.engine-tag:hover,
.engine-tag.active {
  width: 84px;
  border-radius: 20px;
  padding: 8px 16px;
  justify-content: flex-start;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  gap: 6px;
  transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 手机适配 */
@media (max-width: 768px) {
  .engine-tags {
    width: 100% !important;
  }

  .engine-tag {
    width: 36px !important;
    height: 36px !important;
  }

  .engine-tag:hover,
  .engine-tag.active {
    width: 84px !important;
  }

  .engine-icon {
    width: 20px !important;
    height: 20px !important;
  }
}
</style>
