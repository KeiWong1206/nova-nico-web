import request from '@/utils/request'

/** 
 * 定价规则实体定义 
 */
export interface PriceRule {
  id?: string
  courtId: string
  ruleName: string
  dayOfWeek: string // 后端存储格式: "1,2,3"
  startTime: string
  endTime: string
  price: number
  priority: number
}

/**
 * 获取场地的定价规则列表
 */
export function getPriceRuleList(courtId: string) {
  return request<PriceRule[]>({
    url: '/tenant/b-api/price/rule/list',
    method: 'get',
    params: { courtId }
  })
}

/**
 * 获取规则详情
 */
export function getPriceRuleDetail(id: string) {
  return request<PriceRule>({
    url: `/tenant/b-api/price/rule/detail/${id}`,
    method: 'get'
  })
}

/**
 * 新增定价规则
 */
export function addPriceRule(data: PriceRule) {
  return request({
    url: '/tenant/b-api/price/rule/add',
    method: 'post',
    data
  })
}

/**
 * 修改定价规则
 */
export function updatePriceRule(data: PriceRule) {
  return request({
    url: '/tenant/b-api/price/rule/update',
    method: 'post',
    data
  })
}

/**
 * 删除定价规则 (注意：后端要求使用 POST 方法)
 */
export function deletePriceRule(id: string) {
  return request({
    url: `/tenant/b-api/price/rule/delete/${id}`,
    method: 'post' // 严格遵循后端 POST 规范
  })
}
