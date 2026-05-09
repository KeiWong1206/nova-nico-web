import request from '@/utils/request'

/** 
 * 员工实体定义 
 */
export interface EmployeeVO {
  id?: string | number
  venueId?: string | number
  username?: string
  realName: string
  phone: string
  status: number
  isSuperAdmin?: number
  createTime?: string
  roleNames?: string[]
  venueName?: string
  roleIds: number[]
}

/**
 * 分页获取员工列表
 */
export function getEmployeePage(params: any) {
  return request<{ records: EmployeeVO[]; total: number }>({
    url: '/tenant/b-api/employee/list',
    method: 'get',
    params
  })
}

/**
 * 获取员工详情
 */
export function getEmployeeDetail(id: string | number) {
  return request<EmployeeVO>({
    url: `/tenant/b-api/employee/${id}`,
    method: 'get'
  })
}

/**
 * 新增员工
 */
export function addEmployee(data: EmployeeVO) {
  return request({
    url: '/tenant/b-api/employee/add',
    method: 'post',
    data
  })
}

/**
 * 修改员工
 */
export function updateEmployee(data: EmployeeVO) {
  return request({
    url: '/tenant/b-api/employee/update',
    method: 'post',
    data
  })
}

/**
 * 删除员工
 */
export function deleteEmployee(id: string | number) {
  return request({
    url: `/tenant/b-api/employee/${id}`,
    method: 'delete'
  })
}
