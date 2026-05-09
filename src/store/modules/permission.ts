import { defineStore } from 'pinia'
import { ref } from 'vue'
import { RouteRecordRaw } from 'vue-router'
import { getMenu, MenuItem } from '@/api/user'
import { useUserStore } from './user'

// 提取 Vite 导入所有的视图组件
const modules = import.meta.glob('../../views/**/*.vue')

/**
 * 递归解析后端菜单树为 Vue Router 路由表
 * @param menus 后端返回的菜单树
 */
function filterAsyncRoutes(menus: MenuItem[]): RouteRecordRaw[] {
  const res: RouteRecordRaw[] = []

  for (const menu of menus) {
    // 1. 忽略按钮类型 (menuType === 3)
    if (menu.menuType === 3) continue

    const route: any = {
      path: menu.path || '',
      name: menu.permission || `menu-${menu.id}`,
      meta: {
        title: menu.name,
        icon: '' // 后端若未提供图标可留空或设置默认
      }
    }

    // 2. 映射组件
    if (menu.parentId === 0) {
      // 顶级目录统一使用 Layout 包装
      route.component = () => import('@/layout/index.vue')
      // 如果路径不以 / 开头，补全它
      if (route.path && !route.path.startsWith('/')) {
        route.path = '/' + route.path
      }
    } else if (menu.menuType === 2) {
      // 菜单类型，动态映射 views 下的文件
      // 假设 path 对应的是 views 目录下的相对路径，例如 /venue-mgr/list 对应 views/venue-mgr/list.vue
      const componentPath = `../../views${menu.path}.vue`
      if (modules[componentPath]) {
        route.component = modules[componentPath]
      } else {
        console.warn(`未找到组件路径: ${componentPath}，已回退到占位页面`)
        route.component = () => import('@/views/common/template.vue')
      }
    }

    // 3. 递归处理子菜单
    if (menu.children && menu.children.length > 0) {
      route.children = filterAsyncRoutes(menu.children)
    }

    res.push(route as RouteRecordRaw)
  }

  return res
}

export const usePermissionStore = defineStore('permission', () => {
  const routes = ref<RouteRecordRaw[]>([])
  const isDynamicAdded = ref<boolean>(false)

  /**
   * 获取后端权限数据并生成动态路由
   */
  const fetchMenuRoutes = async () => {
    try {
      const data = await getMenu()
      const { menus, permissions } = data
      
      // 1. 存储按钮级权限到 user store
      const userStore = useUserStore()
      userStore.permissions = permissions
      
      // 2. 解析路由表
      const asyncRoutes = filterAsyncRoutes(menus)
      
      // 处理 Dashboard 的特殊逻辑（如果后端返回的菜单里没有 /dashboard 根路径，可以在这里补全）
      // 这里根据实际返回数据决定是否需要手动处理首页挂载
      
      routes.value = asyncRoutes
      isDynamicAdded.value = true
      return asyncRoutes
    } catch (error) {
      return Promise.reject(error)
    }
  }

  return {
    routes,
    isDynamicAdded,
    fetchMenuRoutes
  }
})
