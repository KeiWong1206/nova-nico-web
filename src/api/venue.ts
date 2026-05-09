import request from '@/utils/request'

/**
 * 门店(Venue)实体定义
 */
export interface Venue {
  id?: string | number
  venueName: string
  venueLogo?: string
  address: string
  province: string
  city: string
  district: string
  longitude?: string
  latitude?: string
  contactPhone: string
  openTime: string
  closeTime: string
  facilities: string[] // 前端传数组，后端若存字符串需在拦截器或转换层处理
  status: number
  description?: string
  createTime?: string
}

/**
 * 查询门店列表
 */
export function getVenueList() {
  return request<Venue[]>({
    url: '/tenant/b-api/venue/list',
    method: 'get'
  })
}

/**
 * 查询门店详情
 */
export function getVenueById(id: number) {
  return request<Venue>({
    url: `/tenant/b-api/venue/${id}`,
    method: 'get'
  })
}

/**
 * 新增或修改门店
 */
export function saveVenue(data: Venue) {
  return request({
    url: '/tenant/b-api/venue/save',
    method: 'post',
    data
  })
}

/**
 * 删除门店
 */
export function deleteVenue(id: number) {
  return request({
    url: `/tenant/b-api/venue/${id}`,
    method: 'delete'
  })
}
