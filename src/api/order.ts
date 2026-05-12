import request from '@/utils/request'
import { InventoryVO } from './inventory'

/**
 * 订单与收银核心模块
 */

// 下单并支付 DTO
export interface BOrderCreateDTO {
  venueId: string
  inventoryIds: string[]
  customerId?: string
  userCouponId?: string
  payChannel: 'WX_PAY' | 'ALI_PAY' | 'BALANCE' | 'OFFLINE'
}

// 会员查询 VO
export interface CustomerVO {
  id: string
  realName: string
  phone: string
  balance: number
  avatar?: string
}

// 优惠券 VO
export interface CouponVO {
  id: string
  couponName: string
  discountAmount: number
  minUseAmount: number
}

/**
 * 核心收银：创建并支付订单
 */
export const createAndPayOrder = (data: BOrderCreateDTO) => {
  return request({
    url: '/tenant/b-api/order/createAndPay',
    method: 'post',
    data
  })
}

/**
 * 会员搜索：通过手机号或姓名
 */
export const searchCustomer = (keyword: string): Promise<CustomerVO[]> => {
  return request({
    url: '/tenant/b-api/customer/search',
    method: 'get',
    params: { keyword }
  })
}

/**
 * 获取会员在该场馆下的可用优惠券
 */
export const getCustomerCoupons = (customerId: string, venueId?: string): Promise<CouponVO[]> => {
  return request({
    url: '/tenant/b-api/coupon/userAvailable',
    method: 'get',
    params: { customerId, venueId }
  })
}
