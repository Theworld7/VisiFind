<template>
  <nav class="top-nav glass-white menu-container">
    <router-link to="/search" class="menu-item">搜索</router-link>
    <router-link to="/health" class="menu-item">健康记录</router-link>
  </nav>
</template>

<style scoped>
.top-nav {
  position: absolute;
  top: 24px;
  left: 24px;
  z-index: 100;
}

@media (max-width: 768px) {
  .top-nav {
    position: relative;
    top: 0;
    left: 0;
    margin-bottom: 16px;
    justify-content: center;
  }
}
</style>
