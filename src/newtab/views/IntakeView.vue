<script setup>
import Header from '../components/Header.vue'
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <!-- 子页面内容 -->
    <RouterView class="flex-1 overflow-y-auto" />
  </div>
</template>

<style scoped>
@import '../styles/aero.css';
</style>