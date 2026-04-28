<template>
  <div class="navbar">
    <div class="navbar-container">
      <div class="navbar-logo">
        <span class="logo-icon">⏱️</span>
        <h1>上班打卡</h1>
      </div>
      <div class="navbar-menu">
        <router-link to="/" class="navbar-link" exact-active-class="active">
          <el-button type="primary" :plain="$route.path !== '/'" size="large">
            <span class="navbar-link-text">打卡</span>
          </el-button>
        </router-link>
        <router-link to="/calendar" class="navbar-link" active-class="active">
          <el-button type="primary" :plain="$route.path !== '/calendar'" size="large">
            <span class="navbar-link-text">日历</span>
          </el-button>
        </router-link>
        <router-link to="/statistics" class="navbar-link" active-class="active">
          <el-button type="primary" :plain="$route.path !== '/statistics'" size="large">
            <span class="navbar-link-text">统计</span>
          </el-button>
        </router-link>
        <router-link to="/settings" class="navbar-link" active-class="active">
          <el-button type="primary" :plain="$route.path !== '/settings'" size="large">
            <span class="navbar-link-text">设置</span>
          </el-button>
        </router-link>
      </div>
      <div class="navbar-user">
        <el-button type="info" size="large" @click="handleLogout" v-if="false">退出</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const handleLogout = () => {
  // 退出逻辑
  console.log('退出登录')
}
</script>

<style scoped>
.navbar {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04);
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 1000;
}

html.dark .navbar {
  background: rgba(15, 23, 42, 0.78);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.06), 0 4px 16px rgba(0, 0, 0, 0.2);
}

.navbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  height: 64px;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 24px;
}

.navbar-logo h1 {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-primary-light) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.navbar-menu {
  display: flex;
  gap: 12px;
}

.navbar-link {
  text-decoration: none;
}

.navbar-link-text {
  font-weight: 500;
}

.navbar-user {
  display: flex;
  align-items: center;
}

.active .el-button {
  background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-primary-light) 100%);
  color: #fff;
  border: none !important;
}
</style>