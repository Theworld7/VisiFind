<script setup lang="ts">
import { ref, watch } from 'vue'

interface Tab {
  name: string
  label: string
}

const props = defineProps<{
  tabs: Tab[]
  modelValue: string
}>()

const activeTab = ref(props.modelValue)

watch(
  () => props.modelValue,
  (val) => {
    activeTab.value = val
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const switchTab = (name: string) => {
  activeTab.value = name
  emit('update:modelValue', name)
}
</script>

<template>
  <div class="custom-tabs">
    <div class="tabs-header glass-white menu-container">
      <button
        v-for="tab in tabs"
        :key="tab.name"
        class="menu-item"
        :class="{ active: activeTab === tab.name }"
        @click="switchTab(tab.name)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="tabs-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.custom-tabs {
  width: 100%;
}

.tabs-header {
  display: inline-flex;
  gap: 8px;
  padding: 6px;
  border-radius: 20px;
  margin-bottom: 16px;
}

.tabs-content {
  width: 100%;
}
</style>
