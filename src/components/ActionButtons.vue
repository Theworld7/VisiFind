<script setup lang="ts">
import settingIcon from '@/assets/setting.svg'
import { useSettings } from '@/composables/useSettings'

const { openSettings } = useSettings()
</script>

<template>
  <div class="action-buttons">
    <button class="action-btn" @click="openSettings" title="设置">
      <img :src="settingIcon" alt="设置" />
    </button>
  </div>
</template>

<style scoped>
.action-buttons {
  position: absolute;
  top: 24px;
  right: 24px;
  display: flex;
  gap: 8px;
  z-index: 100;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-white);
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.4);
}

.action-btn img {
  width: 18px;
  height: 18px;
  filter: invert(1);
}

@media (max-width: 768px) {
  .action-buttons {
    position: relative;
    top: 0;
    right: 0;
    margin-bottom: 16px;
    justify-content: center;
  }
}
</style>
