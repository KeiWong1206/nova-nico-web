import request from '@/utils/request'

/**
 * 优惠券活动关联表实体类 (对应 Java ActivityCouponRelationVO)
 */
export interface ActivityCouponRelationVO {
  id?: string
  couponId: string
  couponName: string
  couponType: number // 1-满减, 2-折扣
  totalStock: number
  remainingStock: number
}

/**
 * 优惠券活动实体类 (对应 Java CouponActivityVO)
 */
export interface CouponActivityVO {
  id?: string
  tenantId?: string
  activityName: string
  startTime: string
  endTime: string
  sendChannel: string // ALL, APP, WECHAT, OFFLINE
  status: number // 1-未开始, 2-进行中, 3-已结束, 4-手动关闭
  createTime?: string
  updateTime?: string
  couponList: ActivityCouponRelationVO[]
}

/**
 * 分页查询优惠券活动 (POST)
 */
export function getActivityPage(data: any) {
  return request<{ records: CouponActivityVO[]; total: number }>({
    url: '/tenant/b-api/coupon-activity/page',
    method: 'post',
    data
  })
}

/**
 * 获取活动详情及其绑定的优惠券 (聚合接口)
 */
export function getActivityDetail(id: string) {
  return request<CouponActivityVO>({
    url: `/tenant/b-api/coupon-activity/${id}`,
    method: 'get'
  })
}

/**
 * 创建活动
 */
export function createActivity(data: Partial<CouponActivityVO>) {
  return request({
    url: '/tenant/b-api/coupon-activity/create',
    method: 'post',
    data
  })
}

/**
 * 更新活动
 */
export function updateActivity(data: Partial<CouponActivityVO>) {
  return request({
    url: '/tenant/b-api/coupon-activity/update',
    method: 'put',
    data
  })
}

/**
 * 删除活动
 */
export function deleteActivity(id: string) {
  return request({
    url: `/tenant/b-api/coupon-activity/${id}`,
    method: 'delete'
  })
}

/**
 * 手动关闭活动
 */
export function closeActivity(id: string) {
  return request({
    url: `/tenant/b-api/coupon-activity/close/${id}`,
    method: 'post'
  })
}

/**
 * 绑定优惠券到活动
 */
export function bindCoupons(activityId: string, bindList: { couponId: string; totalStock: number }[]) {
  return request({
    url: '/tenant/api/activity-coupon/bind',
    method: 'post',
    data: { activityId, bindList }
  })
}

/**
 * 调整优惠券库存
 */
export function adjustStock(activityId: string, couponId: string, delta: number) {
  return request({
    url: '/tenant/api/activity-coupon/stock',
    method: 'put',
    params: { activityId, couponId, delta }
  })
}

/**
 * 解绑优惠券
 */
export function unbindCoupon(activityId: string, couponId: string) {
  return request({
    url: '/tenant/api/activity-coupon/unbind',
    method: 'delete',
    params: { activityId, couponId }
  })
}
