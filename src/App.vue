<script setup>
import NavBar from './components/NavBar.vue'
</script>

<template>
  <div id="app">
    <NavBar />
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--app-bg-gradient);
}

.app-main {
  flex: 1;
  max-width: 1200px;
  margin: 24px auto 48px;
  padding: 0 24px;
  width: 100%;
  box-sizing: border-box;
}

/* 页面过渡 */
.app-main > :deep(*) {
  animation: page-fade-in 0.35s ease;
}

@keyframes page-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
