<script setup lang="ts">
import { onMounted } from 'vue'
import { NConfigProvider, NGlobalStyle, NMessageProvider } from 'naive-ui'
import '@/styles/variables.css'
import { useBackground } from '@/composables/useBackground'
import TopNav from '@/components/TopNav.vue'
import ActionButtons from '@/components/ActionButtons.vue'
import SettingsDrawer from '@/components/SettingsDrawer.vue'

const {
  backgroundInputMode,
  backgroundUrl,
  backgroundBlur,
  backgroundColor,
  backgroundStyle,
  initDB,
  loadSettings,
} = useBackground()

onMounted(async () => {
  await initDB()
  await loadSettings()
})
</script>

<template>
  <n-config-provider
    :theme-overrides="{
      common: {
        primaryColor: '#374151',
        primaryColorHover: '#4B5563',
        primaryColorPressed: '#1F2937',
      },
    }"
  >
    <n-message-provider>
      <n-global-style />
      <div
        class="fullscreen"
        :class="{ 'has-background': backgroundInputMode !== 'color' && backgroundUrl }"
        :style="backgroundStyle"
      >
        <TopNav />
        <ActionButtons />
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
        <SettingsDrawer />
      </div>
    </n-message-provider>
  </n-config-provider>
</template>

<style>
.fullscreen {
  width: 100vw;
  height: 100vh;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--bg-gradient-start);
  background-image: linear-gradient(
    135deg,
    var(--bg-gradient-start) 0%,
    var(--bg-gradient-mid) 50%,
    var(--bg-gradient-end) 100%
  );
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-sizing: border-box;
}

.fullscreen.has-background {
  background-color: transparent;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.fullscreen::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-overlay-lighter);
  backdrop-filter: blur(var(--bg-blur, 0px));
  -webkit-backdrop-filter: blur(var(--bg-blur, 0px));
  pointer-events: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .fullscreen {
    padding: 16px;
  }
}
</style>
