import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

// 静态基础路由（白名单，无需权限即可访问）
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    redirect: '/dashboard' // 默认跳转到工作台
  },
  {
    path: '/404',
    name: '404',
    component: () => import('@/views/common/template.vue'),
    meta: { title: '404 找不到页面' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior: () => ({ left: 0, top: 0 })
})

export default router
