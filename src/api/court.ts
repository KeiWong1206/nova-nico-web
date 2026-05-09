import request from '@/utils/request'

/** 
 * 场地(Court)实体定义 
 */
export interface Court {
  id?: string
  venueId: number | string
  name: string
  courtType: string | number
  isIndoor: number
  status: number
  sortOrder: number
  venueName?: string // 供表格前端匹配或后端直接返回显示
  createTime?: string
}

/** 
 * 分页请求参数 
 */
export interface CourtQuery {
  pageNum: number
  pageSize: number
  name?: string
  venueId?: number | string
  type?: string | number
}

/** 
 * 分页返回结构 
 */
export interface CourtPageResult {
  records: Court[]
  total: number
  size: number
  current: number
  pages: number
}

/**
 * 分页获取场地列表
 */
export function getCourtPage(params: CourtQuery) {
  return request<CourtPageResult>({
    url: '/tenant/b-api/court/page',
    method: 'get',
    params
  })
}

/**
 * 获取场地详情
 */
export function getCourt(id: string) {
  return request<Court>({
    url: `/tenant/b-api/court/${id}`,
    method: 'get'
  })
}

/**
 * 新增或修改场地
 */
export function saveCourt(data: Court) {
  return request({
    url: '/tenant/b-api/court/save',
    method: 'post',
    data
  })
}

/**
 * 删除场地
 */
export function deleteCourt(id: string) {
  return request({
    url: `/tenant/b-api/court/${id}`,
    method: 'delete'
  })
}

/**
 * 根据场馆ID查询场地列表 (备用)
 */
export function getCourtListByVenue(venueId: number | string) {
  return request<Court[]>({
    url: `/tenant/b-api/court/list/${venueId}`,
    method: 'get'
  })
}
