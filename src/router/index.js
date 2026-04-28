// 路由配置
import { createRouter, createWebHistory } from 'vue-router'

// 直接导入页面组件（临时修复懒加载问题）
import Home from '../pages/Home.vue'
import Calendar from '../pages/Calendar.vue'
import Statistics from '../pages/Statistics.vue'
import Settings from '../pages/Settings.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { title: '打卡' }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: Calendar,
    meta: { title: '日历' }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: Statistics,
    meta: { title: '统计' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { title: '设置' }
  },
  // 重定向
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：更新页面标题
router.beforeEach((to, from, next) => {
  const title = to.meta.title || '上班打卡小程序'
  document.title = title
  next()
})

export default router