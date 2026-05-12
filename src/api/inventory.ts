import request from '@/utils/request'

/** 
 * 库存实体定义 
 */
export interface InventoryVO {
  id: string
  venueId: string
  venueName?: string
  courtId: string
  courtName?: string
  inventoryDate: string
  startTime: string
  endTime: string
  price: number
  status: number // 0-锁定, 1-可售, 2-已售
  version: number
}

/**
 * 库存查询参数
 */
export interface InventoryQueryDTO {
  pageNum: number
  pageSize: number
  venueId?: string
  courtId?: string
  status?: number
  inventoryDate: string
}

/**
 * 分页查询场地库存 (POST)
 */
export function getInventoryPage(data: InventoryQueryDTO) {
  return request<{ records: InventoryVO[]; total: number }>({
    url: '/tenant/b-api/inventory/page',
    method: 'post',
    data
  })
}

/**
 * 改价接口 (示例路径)
 */
export function updateInventoryPrice(id: string, price: number) {
  return request({
    url: '/tenant/b-api/inventory/price',
    method: 'put',
    data: { id, price }
  })
}

/**
 * 锁定/解锁库存
 */
export function changeInventoryStatus(id: string, status: number) {
  return request({
    url: '/tenant/b-api/inventory/status',
    method: 'put',
    params: { id, status }
  })
}
