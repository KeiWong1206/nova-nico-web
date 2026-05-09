import router from './index'
import { useUserStore } from '@/store/modules/user'
import { usePermissionStore } from '@/store/modules/permission'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false })

const whiteList = ['/login', '/404'] // 无重定向白名单

router.beforeEach(async (to, from, next) => {
  NProgress.start()
  document.title = (to.meta.title ? `${to.meta.title} - ` : '') + '场馆管理系统'

  const userStore = useUserStore()
  const permissionStore = usePermissionStore()
  const hasToken = userStore.token

  if (hasToken) {
    if (to.path === '/login') {
      // 已经登录，跳转到首页
      next({ path: '/' })
      NProgress.done()
    } else {
      // 判断是否已经动态添加过路由
      if (permissionStore.isDynamicAdded) {
        next()
      } else {
        try {
          // 模拟请求菜单并解析出可访问的路由列表
          const accessRoutes = await permissionStore.fetchMenuRoutes()
          
          // 将根级菜单如果没有 component === 'Layout' 的，作为独立页面或者包装在 Layout 下
          // 这里我们将这些路由全部添加到路由表，对于顶级非 Layout 路由如果需要套布局，可以在 permission.ts 处理
          // 在当前模拟中，Dashboard 没有明确声明 Layout，所以我们需要在 permission 处理或在这里动态挂载
          accessRoutes.forEach(route => {
            if (route.path === '/dashboard') {
               // Dashboard 特殊处理：将其挂载在 Layout 下
               router.addRoute({
                 path: '/',
                 component: () => import('@/layout/index.vue'),
                 children: [route]
               })
            } else {
               router.addRoute(route)
            }
          })

          // 添加 404 兜底路由
          router.addRoute({ path: '/:pathMatch(.*)*', redirect: '/404' })
          
          // 确保路由添加完成，replace 防止通过历史记录退回
          next({ ...to, replace: true })
        } catch (error) {
          // 获取菜单出错，清除 Token 跳转登录
          await userStore.logout()
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      }
    }
  } else {
    // 无 Token 状态
    if (whiteList.indexOf(to.path) !== -1) {
      // 在白名单，直接进入
      next()
    } else {
      // 否则全部重定向到登录页
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})

router.afterEach(() => {
  NProgress.done()
})
