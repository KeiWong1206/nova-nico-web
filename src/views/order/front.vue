<template>
  <div class="pos-screen min-h-screen bg-[#F0F2F5] p-8 font-sans">
    
    <!-- 1. 顶部工具栏：全水平平铺 -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8 flex items-center justify-between">
      <div class="flex items-center gap-12">
        <div class="flex items-center gap-3">
          <span class="text-[13px] font-black text-gray-400 uppercase tracking-widest">执行场馆</span>
          <el-select 
            v-if="userStore.userInfo?.isSuperAdmin"
            v-model="currentVenueId" 
            placeholder="请选择场馆" 
            class="w-48"
            @change="loadMatrixData"
          >
            <el-option v-for="v in venueOptions" :key="v.id" :label="v.venueName" :value="v.id" />
          </el-select>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-[13px] font-black text-gray-400 uppercase tracking-widest">业务日期</span>
          <el-radio-group v-model="selectedDate" @change="loadMatrixData">
            <el-radio-button label="today">今日运营</el-radio-button>
            <el-radio-button label="tomorrow">明日预订</el-radio-button>
          </el-radio-group>
        </div>

        <div class="flex items-center gap-6 border-l border-gray-100 pl-10">
          <div v-for="tag in legends" :key="tag.label" class="flex items-center gap-2">
            <i class="w-3 h-3 rounded-sm" :style="{ backgroundColor: tag.bg, border: `1px solid ${tag.border}` }"></i>
            <span class="text-[11px] font-bold text-gray-400 uppercase">{{ tag.label }}</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <el-button icon="Refresh" circle @click="loadMatrixData" :loading="loading" />
        <h2 class="text-sm font-black text-indigo-600 tracking-tighter uppercase ml-4">Nova 前台下单系统</h2>
      </div>
    </div>

    <!-- 2. 主体区 -->
    <el-row :gutter="32" class="h-[calc(100vh-180px)]">
      <!-- 左侧：看板 -->
      <el-col :span="18" class="h-full">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
          <div class="flex-1 overflow-auto p-8 custom-scrollbar">
            <div class="matrix-wrapper" :style="{ minWidth: `${timeSlots.length * 80 + 120}px` }">
              <div class="m-row sticky top-0 z-30 bg-white border-b border-gray-100 mb-2">
                <div class="m-cell label sticky left-0 z-40 bg-white border-r border-gray-50 text-[10px] font-black text-gray-300 uppercase italic">场地 / 时间轴</div>
                <div v-for="time in timeSlots" :key="time" class="m-cell time font-mono text-[12px] font-black text-gray-400">
                  {{ time.substring(0, 5) }}
                </div>
              </div>

              <div v-for="court in courts" :key="court.id" class="m-row group hover:bg-slate-50/50 transition-colors border-b border-gray-50">
                <div class="m-cell label sticky left-0 z-20 bg-white border-r border-gray-50 font-black text-gray-600 text-sm">
                  {{ court.name }}
                </div>
                <div 
                  v-for="time in timeSlots" 
                  :key="time"
                  class="m-cell unit"
                  :class="getSlotStatus(court.id, time)"
                  @click="onSelect(court.id, time)"
                >
                  <div class="u-box">
                    <span v-if="isAvailable(court.id, time)" class="price">¥{{ getPrice(court.id, time) }}</span>
                    <el-icon v-if="isSelected(court.id, time)" class="text-white scale-in"><Check /></el-icon>
                    <span v-if="inventoryMap[court.id]?.[time]?.status === 2" class="text-[9px] text-gray-300 font-black">已售</span>
                    <el-icon v-if="inventoryMap[court.id]?.[time]?.status === 0" class="text-red-300"><Lock /></el-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- 右侧：结算 -->
      <el-col :span="6" class="h-full">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col p-8 overflow-hidden">
          <div class="flex items-center justify-between mb-8 flex-shrink-0">
            <h3 class="text-base font-black text-slate-800 uppercase italic tracking-tighter">待结算账单</h3>
            <div v-if="cart.length" class="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-full">{{ cart.length }} 项</div>
          </div>

          <div class="flex-1 overflow-y-auto mb-8 pr-2 custom-scrollbar">
            <el-empty v-if="cart.length === 0" description="暂未选择场次" :image-size="40" />
            <div 
              v-for="(item, idx) in cart" 
              :key="item.id"
              class="bg-gray-50 p-4 rounded-xl mb-3 border border-gray-100 relative group hover:bg-white hover:border-indigo-400 transition-all"
            >
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-black text-slate-700 truncate pr-4">{{ item.courtName }}</span>
                <span class="text-sm font-black font-mono text-indigo-600">¥{{ item.price }}</span>
              </div>
              <div class="text-[10px] font-bold text-gray-400 uppercase">
                {{ item.startTime.substring(0, 5) }} - {{ item.endTime.substring(0, 5) }}
              </div>
              <button class="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center transition-all shadow-md" @click="cart.splice(idx, 1)">
                <el-icon size="12"><CloseBold /></el-icon>
              </button>
            </div>
          </div>

          <div class="pt-8 border-t border-gray-100 space-y-6 flex-shrink-0">
            <div>
              <div class="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">会员检索</div>
              <el-autocomplete
                v-model="memberKeyword"
                :fetch-suggestions="searchMember"
                placeholder="手机号 / 姓名"
                class="w-full"
                @select="onMemberPicked"
              >
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-autocomplete>
              
              <div v-if="currentMember" class="mt-3 p-3 bg-slate-900 rounded-xl flex justify-between items-center shadow-lg">
                <span class="text-xs font-black text-white uppercase">{{ currentMember.realName }}</span>
                <span class="text-xs font-mono text-indigo-400 font-bold">¥{{ currentMember.balance }}</span>
              </div>
            </div>

            <div>
              <div class="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">支付渠道</div>
              <el-radio-group v-model="payForm.payChannel" size="small" class="w-full flex">
                <el-radio-button label="WX_PAY" class="flex-1">微信</el-radio-button>
                <el-radio-button label="ALI_PAY" class="flex-1">支付宝</el-radio-button>
                <el-radio-button label="OFFLINE" class="flex-1">线下</el-radio-button>
              </el-radio-group>
            </div>

            <div class="flex justify-between items-end mb-2">
              <div>
                <div class="text-[10px] font-black text-gray-300 uppercase">合计金额</div>
                <div class="text-4xl font-black font-mono text-slate-900 tracking-tighter leading-none mt-1">¥{{ totalAmount }}</div>
              </div>
              <el-button 
                type="primary" 
                class="!h-14 !px-8 !rounded-xl !bg-indigo-600 !border-none shadow-xl shadow-indigo-600/20"
                :disabled="cart.length === 0" 
                @click="handleCheckout" 
                :loading="isSubmitting"
              >
                确认支付
              </el-button>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { useUserStore } from '@/store/modules/user'
import { getVenueList, Venue } from '@/api/venue'
import { getCourtPage } from '@/api/court'
import { getInventoryPage, InventoryVO } from '@/api/inventory'
import { createAndPayOrder, searchCustomer, BOrderCreateDTO } from '@/api/order'

const userStore = useUserStore()
const loading = ref(false)
const isSubmitting = ref(false)

const currentVenueId = ref('')
const venueOptions = ref<Venue[]>([])
const courts = ref<any[]>([])
const timeSlots = ref<string[]>([])
const rawInventories = ref<InventoryVO[]>([])

const inventoryMap = computed(() => {
  const map: Record<string, Record<string, InventoryVO>> = {}
  rawInventories.value.forEach(i => {
    if (!map[i.courtId]) map[i.courtId] = {}
    map[i.courtId][i.startTime] = i
  })
  return map
})

const selectedDate = ref('today')
const legends = [
  { label: '可预订', bg: '#ffffff', border: '#e2e8f0' },
  { label: '已选择', bg: '#4f46e5', border: '#4f46e5' },
  { label: '已售出', bg: '#f8fafc', border: '#f1f5f9' },
  { label: '已锁定', bg: '#fff1f2', border: '#fecdd3' }
]

const cart = ref<InventoryVO[]>([])
const totalAmount = computed(() => cart.value.reduce((s, i) => s + i.price, 0).toFixed(2))

const getSlotStatus = (courtId: string, time: string) => {
  const inv = inventoryMap.value[courtId]?.[time]
  if (!inv) return 'is-disabled'
  if (isSelected(courtId, time)) return 'is-picked'
  if (inv.status === 2) return 'is-sold'
  if (inv.status === 0) return 'is-locked'
  return 'is-free'
}

const isSelected = (courtId: string, time: string) => {
  const inv = inventoryMap.value[courtId]?.[time]
  return inv && cart.value.some(c => c.id === inv.id)
}

const isAvailable = (courtId: string, time: string) => inventoryMap.value[courtId]?.[time]?.status === 1
const getPrice = (courtId: string, time: string) => inventoryMap.value[courtId]?.[time]?.price || 0

const onSelect = (courtId: string, time: string) => {
  const inv = inventoryMap.value[courtId]?.[time]
  if (!inv || inv.status !== 1) return
  const idx = cart.value.findIndex(c => c.id === inv.id)
  if (idx > -1) cart.value.splice(idx, 1)
  else cart.value.push(inv)
}

const memberKeyword = ref('')
const currentMember = ref<any>(null)
const payForm = reactive<any>({ payChannel: 'OFFLINE' })

const searchMember = async (qs: string, cb: any) => {
  if (!qs) return cb([])
  const res = await searchCustomer(qs)
  cb(res)
}

const onMemberPicked = (m: any) => currentMember.value = m

const handleCheckout = async () => {
  if (cart.value.length === 0) return
  try {
    await ElMessageBox.confirm(`确认收款 ¥${totalAmount.value}?`, '结算确认', { 
      confirmButtonText: '确认支付',
      cancelButtonText: '取消',
      roundButton: true
    })
    isSubmitting.value = true
    const params: BOrderCreateDTO = {
      venueId: cart.value[0].venueId,
      inventoryIds: cart.value.map(c => c.id),
      customerId: currentMember.value?.id,
      payChannel: payForm.payChannel as any
    }
    await createAndPayOrder(params)
    ElMessage.success('订单处理成功')
    cart.value = []
    currentMember.value = null
    memberKeyword.value = ''
    loadMatrixData()
  } catch (e) {} finally { isSubmitting.value = false }
}

const loadMatrixData = async () => {
  loading.value = true
  try {
    const vId = currentVenueId.value || undefined
    const date = selectedDate.value === 'today' ? dayjs().format('YYYY-MM-DD') : dayjs().add(1, 'day').format('YYYY-MM-DD')
    const [cRes, iRes] = await Promise.all([
      getCourtPage({ venueId: vId, pageNum: 1, pageSize: 100 }),
      getInventoryPage({ venueId: vId, inventoryDate: date, pageNum: 1, pageSize: 1000 })
    ])
    courts.value = cRes.records
    rawInventories.value = iRes.records
    const times = new Set<string>()
    iRes.records.forEach(i => times.add(i.startTime))
    timeSlots.value = Array.from(times).sort()
    cart.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (userStore.userInfo?.isSuperAdmin) {
    venueOptions.value = await getVenueList()
    if (venueOptions.value.length > 0) currentVenueId.value = venueOptions.value[0].id
  }
  loadMatrixData()
})
</script>

<style lang="scss" scoped>
.m-row {
  display: flex; height: 54px;
  .m-cell {
    flex-shrink: 0; width: 80px; display: flex; align-items: center; justify-content: center;
    &.label { width: 120px; justify-content: flex-start; padding-left: 10px; }
    &.time { font-size: 11px; }
  }
}

.u-box {
  width: 72px; height: 42px; border-radius: 10px; border: 1px solid #f1f5f9;
  background: #fff; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
  .price { font-size: 10px; font-weight: 800; color: #10b981; }
}

.unit {
  cursor: pointer;
  &.is-picked .u-box { background: #4f46e5 !important; border-color: #4f46e5; .price { display: none; } }
  &.is-sold .u-box { background: #f8fafc; border: none; }
  &.is-locked .u-box { background: #fff1f2; border-color: #fecdd3; }
  &:hover:not(.is-sold):not(.is-locked) .u-box { border-color: #4f46e5; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }

.scale-in { animation: scaleIn 0.2s cubic-bezier(0.17, 0.67, 0.83, 0.67); }
@keyframes scaleIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>
