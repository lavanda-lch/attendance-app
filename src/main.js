import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router/index.js'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import './theme.css'

const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  console.error('Vue error:', err, info)
  // 可以显示错误提示
}

// 检测系统颜色方案并设置暗黑模式
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
const updateDarkMode = (isDark) => {
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}
updateDarkMode(prefersDark.matches)
prefersDark.addEventListener('change', (e) => updateDarkMode(e.matches))

app
  .use(router)
  .use(ElementPlus)
  .mount('#app')
