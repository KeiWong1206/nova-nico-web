import request from '@/utils/request'

/**
 * 全局统一返回结构
 */
export interface Result<T = any> {
  code: number
  msg: string
  data: T
  traceId: string
  timestamp: number
}

/**
 * 登录入参
 */
export interface LoginParams {
  username?: string
  password?: string
}

/**
 * 登录返回数据
 */
export interface LoginResult {
  accessToken: string
  realName: string
  isSuperAdmin: number
  tenantId: number
}

/**
 * 菜单项结构
 */
export interface MenuItem {
  id: number
  parentId: number
  name: string
  path: string | null
  menuType: number // 1 目录 2 菜单 3 按钮
  permission: string | null
  children: MenuItem[]
}

/**
 * 权限数据返回
 */
export interface PermissionResult {
  menus: MenuItem[]
  permissions: string[]
}

/**
 * 登录接口
 */
export function login(data: LoginParams) {
  return request<LoginResult>({
    url: '/tenant/b-api/employee/open/employee/login',
    method: 'post',
    data
  })
}

/**
 * 获取权限菜单接口
 */
export function getMenu() {
  return request<PermissionResult>({
    url: '/tenant/b-api/employee/menu',
    method: 'post',
    data: {}
  })
}
