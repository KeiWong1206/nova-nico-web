<template>
  <div class="pos-container">
    <el-container>
      <!-- 左侧：场地状态看板 -->
      <el-main class="看板-main p-0">
        <el-card shadow="never" class="h-full border-none flex flex-col">
          <template #header>
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-4">
                <span class="text-lg font-bold">场地实时看板</span>
                <el-radio-group v-model="selectedDate" size="small" @change="loadInventory">
                  <el-radio-button label="today">今天</el-radio-button>
                  <el-radio-button label="tomorrow">明天</el-radio-button>
                </el-radio-group>
              </div>
              <div class="legend flex gap-3 text-xs">
                <span class="flex items-center gap-1"><i class="dot bg-green-500"></i> 可售</span>
                <span class="flex items-center gap-1"><i class="dot bg-gray-400"></i> 已售</span>
                <span class="flex items-center gap-1"><i class="dot bg-red-500"></i> 锁定</span>
                <span class="flex items-center gap-1"><i class="dot bg-blue-500"></i> 已选</span>
              </div>
            </div>
          </template>

          <div v-loading="loading" class="matrix-wrapper flex-1 overflow-auto">
            <div class="pos-matrix" :style="{ gridTemplateColumns: `80px repeat(${courts.length}, 1fr)` }">
              <!-- 表头：场地名 -->
              <div class="matrix-cell header sticky top-0 z-10">时间</div>
              <div 
                v-for="court in courts" 
                :key="court.id" 
                class="matrix-cell header sticky top-0 z-10"
              >
                {{ court.name }}
              </div>

              <!-- 行数据：按时段展示 -->
              <template v-for="time in timeSlots" :key="time">
                <div class="matrix-cell time-label">{{ time }}</div>
                <div 
                  v-for="court in courts" 
                  :key="court.id"
                  class="matrix-cell slot-cell"
                  :class="getSlotClass(court.id, time)"
                  @click="toggleSelect(court.id, time)"
                >
                  <div class="price" v-if="isAvailable(court.id, time)">
                    ¥{{ getPrice(court.id, time) }}
                  </div>
                  <div class="status-icon">
                    <el-icon v-if="isSelected(court.id, time)"><Check /></el-icon>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </el-card>
      </el-main>

      <!-- 右侧：收银结算台 -->
      <el-aside width="360px" class="checkout-aside border-l">
        <div class="p-4 flex flex-col h-full">
          <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
            <el-icon><ShoppingCart /></el-icon> 结算收银
          </h3>

          <!-- 已选清单 -->
          <div class="selected-list flex-1 overflow-y-auto mb-4">
            <div v-if="selectedItems.length === 0" class="empty-tip py-10 text-center text-gray-400">
              <el-icon size="40"><Mouse /></el-icon>
              <p class="mt-2">请从左侧看板选择场地</p>
            </div>
            <div 
              v-for="(item, index) in selectedItems" 
              :key="index" 
              class="selected-item bg-gray-50 p-3 rounded-lg mb-2 relative group"
            >
              <div class="flex justify-between text-sm font-bold">
                <span>{{ item.courtName }}</span>
                <span class="text-blue-600">¥{{ item.price }}</span>
              </div>
              <div class="text-xs text-gray-500 mt-1">
                {{ item.inventoryDate }} | {{ item.startTime }} - {{ item.endTime }}
              </div>
              <el-button 
                class="absolute -top-1 -right-1 hidden group-hover:block" 
                circle 
                type="danger" 
                size="small" 
                icon="Close" 
                @click="removeSelected(index)" 
              />
            </div>
          </div>

          <!-- 会员关联 -->
          <div class="customer-section mb-4">
            <el-autocomplete
              v-model="customerKeyword"
              :fetch-suggestions="queryCustomer"
              placeholder="搜索会员(手机号/姓名)"
              class="w-full"
              @select="handleCustomerSelect"
            >
              <template #prefix><el-icon><User /></el-icon></template>
              <template #default="{ item }">
                <div class="flex justify-between">
                  <span>{{ item.realName }}</span>
                  <span class="text-gray-400">{{ item.phone }}</span>
                </div>
              </template>
            </el-autocomplete>
            <div v-if="selectedCustomer" class="customer-info mt-2 p-2 bg-blue-50 rounded flex justify-between items-center text-xs">
              <span>已选会员: <b>{{ selectedCustomer.realName }}</b></span>
              <span class="text-blue-600">余额: ¥{{ selectedCustomer.balance }}</span>
            </div>
          </div>

          <!-- 支付方式 -->
          <div class="pay-methods mb-6">
            <div class="text-sm mb-2 text-gray-500">支付方式</div>
            <el-radio-group v-model="payForm.payChannel" class="w-full grid grid-cols-2 gap-2">
              <el-radio-button label="WX_PAY" class="flex-1">微信</el-radio-button>
              <el-radio-button label="ALI_PAY" class="flex-1">支付宝</el-radio-button>
              <el-radio-button label="BALANCE" class="flex-1" :disabled="!selectedCustomer">余额</el-radio-button>
              <el-radio-button label="OFFLINE" class="flex-1">线下</el-radio-button>
            </el-radio-group>
          </div>

          <!-- 总计与下单 -->
          <div class="checkout-footer pt-4 border-t">
            <div class="flex justify-between items-center mb-4">
              <span class="text-gray-500">合计金额</span>
              <span class="text-2xl font-bold text-red-600">¥ {{ totalPrice }}</span>
            </div>
            <el-button 
              type="primary" 
              size="large" 
              class="w-full h-12 text-lg font-bold" 
              :loading="submitLoading"
              :disabled="selectedItems.length === 0"
              @click="submitOrder"
            >
              下单并收款
            </el-button>
          </div>
        </div>
      </el-aside>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { getInventoryPage, InventoryVO } from '@/api/inventory'
import { getCourtPage } from '@/api/court'
import { createAndPayOrder, searchCustomer, BOrderCreateDTO } from '@/api/order'

// 基础状态
const loading = ref(false)
const submitLoading = ref(false)
const selectedDate = ref('today')
const courts = ref<any[]>([])
const inventoryMap = ref<Record<string, InventoryVO>>({}) // Key: courtId-startTime
const timeSlots = ref<string[]>([])

// 选中的库存项
const selectedItems = ref<InventoryVO[]>([])
const customerKeyword = ref('')
const selectedCustomer = ref<any>(null)

const payForm = reactive<BOrderCreateDTO>({
  venueId: '',
  inventoryIds: [],
  customerId: undefined,
  payChannel: 'OFFLINE'
})

// 计算总价
const totalPrice = computed(() => {
  return selectedItems.value.reduce((sum, item) => sum + item.price, 0).toFixed(2)
})

/** 加载场地及库存 */
const loadInventory = async () => {
  loading.value = true
  try {
    // 1. 获取场地列表
    const courtRes = await getCourtPage({ pageNum: 1, pageSize: 100 })
    courts.value = courtRes.records

    // 2. 获取目标日期库存
    const date = selectedDate.value === 'today' ? dayjs().format('YYYY-MM-DD') : dayjs().add(1, 'day').format('YYYY-MM-DD')
    const invRes = await getInventoryPage({ pageNum: 1, pageSize: 500, inventoryDate: date })
    
    // 3. 构建索引 Map 和时间轴
    const map: Record<string, InventoryVO> = {}
    const times = new Set<string>()
    invRes.records.forEach(inv => {
      map[`${inv.courtId}-${inv.startTime}`] = inv
      times.add(inv.startTime)
    })
    inventoryMap.value = map
    timeSlots.value = Array.from(times).sort()
    
    // 切换日期清空选项
    selectedItems.value = []
  } finally {
    loading.value = false
  }
}

/** 格子样式控制 */
const getSlotClass = (courtId: string, time: string) => {
  const inv = inventoryMap.value[`${courtId}-${time}`]
  if (!inv) return 'is-disabled'
  if (isSelected(courtId, time)) return 'is-selected'
  if (inv.status === 2) return 'is-sold'
  if (inv.status === 0) return 'is-locked'
  return 'is-available'
}

const isAvailable = (courtId: string, time: string) => {
  const inv = inventoryMap.value[`${courtId}-${time}`]
  return inv && inv.status === 1
}

const isSelected = (courtId: string, time: string) => {
  const inv = inventoryMap.value[`${courtId}-${time}`]
  return inv && selectedItems.value.some(item => item.id === inv.id)
}

const getPrice = (courtId: string, time: string) => {
  return inventoryMap.value[`${courtId}-${time}`]?.price || 0
}

/** 点击选择/取消选择 */
const toggleSelect = (courtId: string, time: string) => {
  const inv = inventoryMap.value[`${courtId}-${time}`]
  if (!inv || inv.status !== 1) return

  const index = selectedItems.value.findIndex(item => item.id === inv.id)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(inv)
  }
}

const removeSelected = (index: number) => {
  selectedItems.value.splice(index, 1)
}

/** 会员搜索 */
const queryCustomer = async (queryString: string, cb: any) => {
  if (!queryString) return cb([])
  try {
    const res = await searchCustomer(queryString)
    cb(res)
  } catch (error) { cb([]) }
}

const handleCustomerSelect = (item: any) => {
  selectedCustomer.value = item
  payForm.customerId = item.id
}

/** 提交订单 */
const submitOrder = async () => {
  if (selectedItems.value.length === 0) return

  ElMessageBox.confirm(`确认下单并收款 ¥${totalPrice.value} 吗？`, '收银确认', {
    confirmButtonText: '立即收款',
    cancelButtonText: '取消',
    type: 'success'
  }).then(async () => {
    submitLoading.value = true
    try {
      const params: BOrderCreateDTO = {
        venueId: selectedItems.value[0].venueId,
        inventoryIds: selectedItems.value.map(i => i.id),
        customerId: selectedCustomer.value?.id,
        payChannel: payForm.payChannel
      }
      await createAndPayOrder(params)
      ElMessage.success('收银成功！')
      loadInventory() // 刷新看板
    } catch (error) {}
    finally { submitLoading.value = false }
  })
}

onMounted(() => {
  loadInventory()
})
</script>

<style lang="scss" scoped>
.pos-container {
  height: calc(100vh - 100px);
  background: #f5f7fa;

  .pos-matrix {
    display: grid;
    min-width: 800px;
    background: #fff;
    border-top: 1px solid #eee;
    border-left: 1px solid #eee;

    .matrix-cell {
      padding: 12px;
      border-right: 1px solid #eee;
      border-bottom: 1px solid #eee;
      text-align: center;
      transition: all 0.2s;

      &.header {
        background: #fafafa;
        font-weight: bold;
        color: #606266;
      }

      &.time-label {
        background: #fafafa;
        color: #909399;
        font-size: 13px;
      }

      &.slot-cell {
        cursor: pointer;
        height: 60px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 4px;

        .price { font-size: 14px; font-weight: bold; }
        
        &.is-available:hover {
          background: #ecf5ff;
        }

        &.is-selected {
          background: #409eff;
          color: #fff;
        }

        &.is-sold {
          background: #f5f7fa;
          color: #c0c4cc;
          cursor: not-allowed;
          background-image: repeating-linear-gradient(45deg, #f0f2f5, #f0f2f5 5px, #fff 5px, #fff 10px);
        }

        &.is-locked {
          background: #fef0f0;
          color: #f56c6c;
          cursor: not-allowed;
        }

        &.is-disabled {
          background: #fafafa;
          cursor: not-allowed;
        }
      }
    }
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }

  .checkout-aside {
    background: #fff;
  }

  .selected-item {
    border: 1px solid transparent;
    &:hover { border-color: #409eff; }
  }
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
