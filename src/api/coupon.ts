import request from '@/utils/request'

/** 
 * 优惠券实体定义 
 */
export interface CouponVO {
  id?: string
  couponName: string
  couponType: number // 1-满减券, 2-折扣券
  minAmount: number
  discountAmount?: number
  discountRate?: number
  validStartTime: string
  validEndTime: string
  totalQuantity: number
  limitPerUser: number
  applicableStores?: string
  requiredUserTag?: string
  description?: string
  status: number // 1-启用, 0-禁用
  createTime?: string
}

/**
 * 分页查询优惠券 (POST)
 */
export function getCouponPage(data: any) {
  return request<{ records: CouponVO[]; total: number }>({
    url: '/tenant/b-api/coupon/page',
    method: 'post',
    data
  })
}

/**
 * 获取优惠券详情
 */
export function getCouponDetail(id: string) {
  return request<CouponVO>({
    url: `/tenant/b-api/coupon/${id}`,
    method: 'get'
  })
}

/**
 * 创建优惠券
 */
export function createCoupon(data: Partial<CouponVO>) {
  return request({
    url: '/tenant/b-api/coupon/create',
    method: 'post',
    data
  })
}

/**
 * 更新优惠券 (PUT)
 */
export function updateCoupon(data: Partial<CouponVO>) {
  return request({
    url: '/tenant/b-api/coupon/update',
    method: 'put',
    data
  })
}

/**
 * 修改优惠券状态 (PUT with Query Params)
 */
export function changeCouponStatus(id: string, status: number) {
  return request({
    url: '/tenant/b-api/coupon/status',
    method: 'put',
    params: { id, status }
  })
}
