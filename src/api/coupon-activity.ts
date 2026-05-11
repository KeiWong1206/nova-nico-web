import request from '@/utils/request'

/** 
 * 优惠券活动实体定义 
 */
export interface CouponActivityVO {
  id?: string
  tenantId?: string
  activityName: string
  startTime: string
  endTime: string
  sendChannel: string // ALL, APP, WECHAT, OFFLINE
  status: number // 1:未开始, 2:进行中, 3:已结束, 4:手动关闭
  createTime?: string
  updateTime?: string
}

/**
 * 分页查询活动列表 (POST)
 */
export function getActivityPage(data: any) {
  return request<{ records: CouponActivityVO[]; total: number }>({
    url: '/tenant/b-api/coupon-activity/page',
    method: 'post',
    data
  })
}

/**
 * 获取活动详情
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
 * 更新活动 (PUT)
 */
export function updateActivity(data: Partial<CouponActivityVO>) {
  return request({
    url: '/tenant/b-api/coupon-activity/update',
    method: 'put',
    data
  })
}

/**
 * 删除活动 (DELETE)
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
