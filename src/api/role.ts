import request from '@/utils/request'

/** 
 * 角色实体定义 
 */
export interface RoleVO {
  id?: string | number
  tenantId?: string | number
  roleName: string
  roleCode: string
  remark: string
}

/** 
 * 菜单树节点定义 
 */
export interface MenuTreeVO {
  id: number
  parentId: number
  name: string
  children?: MenuTreeVO[]
}

/**
 * 获取角色全量列表 (无分页)
 */
export function getRoleList() {
  return request<RoleVO[]>({
    url: '/tenant/b-api/role/list',
    method: 'get'
  })
}

/**
 * 新增角色
 */
export function addRole(data: RoleVO) {
  return request({
    url: '/tenant/b-api/role/add',
    method: 'post',
    data
  })
}

/**
 * 修改角色
 */
export function updateRole(data: RoleVO) {
  return request({
    url: '/tenant/b-api/role/update',
    method: 'put',
    data
  })
}

/**
 * 授权角色菜单权限
 * @param roleId 角色ID
 * @param menuIds 包含选中和半选中的菜单ID数组
 */
export function grantRole(roleId: string | number, menuIds: number[]) {
  return request({
    url: '/tenant/b-api/role/grant',
    method: 'post',
    data: { roleId, menuIds }
  })
}

/**
 * 删除角色 (预留)
 */
export function deleteRole(id: string | number) {
  return request({
    url: `/tenant/b-api/role/delete/${id}`,
    method: 'delete'
  })
}

/**
 * 获取角色已拥有的菜单ID列表
 */
export function getRoleMenuIds(roleId: string | number) {
  return request<number[]>({
    url: `/tenant/b-api/role/menus/${roleId}`,
    method: 'get'
  })
}

/**
 * 获取全量菜单树
 */
export function getMenuTree() {
  return request<MenuTreeVO[]>({
    url: '/tenant/b-api/menu/tree',
    method: 'get'
  })
}
