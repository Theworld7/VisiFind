<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Settings, Sun, Moon } from 'lucide-vue-next'
import { useTheme } from '../composables/useTheme'

const route = useRoute()
const emit = defineEmits(['settings-click'])
const { isDark, toggleTheme } = useTheme()

const menuItems = [
  { path: '/', label: '搜索' },
  { path: '/intake', label: '摄入记录' },
  { path: '/weight', label: '体重记录' },
  { path: '/documents', label: '文档收录' },
  { path: '/items', label: '物品管理' },
  { path: '/series', label: '漫剧' },
]

const subMenuItems = [
  { path: '/intake/daily', label: '每日摄入' },
  { path: '/intake/food-library', label: '食物库' },
]

// 判断是否显示子菜单
const showSubMenu = computed(() => route.path.startsWith('/intake'))
</script>

<template>
  <header class="fixed top-4 left-1/2 -translate-x-1/2 z-50">
    <div class="flex items-center gap-3 px-4 py-2.5 aero-glass aero-border rounded-full shadow-2xl shadow-black/20 backdrop-blur-xl">
      <!-- 主菜单 -->
      <nav class="flex items-center gap-1">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="px-3 py-1.5 rounded-full text-sm font-medium transition-all aero-text whitespace-nowrap"
          :class="[
            $route.path === item.path || (item.path !== '/' && $route.path.startsWith(item.path))
              ? 'bg-white/30 text-white shadow-sm'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          ]"
        >
          {{ item.label }}
        </router-link>
      </nav>

      <!-- 子菜单区域（仅在摄入记录页面显示） -->
      <transition name="submenu">
        <div v-show="showSubMenu" class="flex items-center gap-1 overflow-hidden">
          <!-- 子菜单分隔线 -->
          <div class="w-px h-5 bg-white/30 flex-shrink-0"></div>

          <!-- 子菜单 -->
          <nav class="flex items-center gap-1">
            <router-link
              v-for="item in subMenuItems"
              :key="item.path"
              :to="item.path"
              class="px-3 py-1.5 rounded-full text-sm font-medium transition-all aero-text whitespace-nowrap"
              :class="[
                $route.path === item.path
                  ? 'bg-white/30 text-white shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              ]"
            >
              {{ item.label }}
            </router-link>
          </nav>
        </div>
      </transition>

      <!-- 分隔线 -->
      <div class="w-px h-5 bg-white/30 flex-shrink-0"></div>

      <!-- 主题切换按钮 -->
      <button
        class="p-1.5 rounded-full hover:bg-white/20 transition-all text-white/90 hover:text-white aero-hover flex-shrink-0"
        @click="toggleTheme"
      >
        <Sun v-if="isDark" class="w-4 h-4" />
        <Moon v-else class="w-4 h-4" />
      </button>

      <!-- 设置按钮 -->
      <button
        class="p-1.5 rounded-full hover:bg-white/20 transition-all text-white/90 hover:text-white aero-hover flex-shrink-0"
        @click="emit('settings-click')"
      >
        <Settings class="w-4 h-4" />
      </button>
    </div>
  </header>
</template>

<style scoped>
@import '../styles/aero.css';

/* 子菜单过渡动画 */
.submenu-enter-active,
.submenu-leave-active {
  transition: max-width 0.3s ease-in-out, opacity 0.3s ease-in-out;
  overflow: hidden;
  white-space: nowrap;
}

.submenu-enter-from {
  opacity: 0;
  max-width: 0;
}

.submenu-enter-to {
  opacity: 1;
  max-width: 200px;
}

.submenu-leave-from {
  opacity: 1;
  max-width: 200px;
}

.submenu-leave-to {
  opacity: 0;
  max-width: 0;
}
</style>
