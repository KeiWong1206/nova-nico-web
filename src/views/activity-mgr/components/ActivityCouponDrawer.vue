<template>
  <el-drawer
    v-model="visible"
    :title="`配置优惠券 - ${activityInfo?.activityName || '加载中...'}`"
    size="850px"
    destroy-on-close
  >
    <template #header>
      <div class="drawer-header flex items-center justify-between w-full pr-8">
        <div class="flex items-center gap-4">
          <span class="text-lg font-bold">配置优惠券</span>
          <el-tag v-if="activityInfo" :type="getStatusTag(activityInfo.status)" effect="plain">
            {{ getStatusLabel(activityInfo.status) }}
          </el-tag>
        </div>
        <!-- 仅未开始(1)允许新增绑定 -->
        <el-button 
          v-if="activityInfo?.status === 1"
          type="primary" 
          icon="Plus" 
          @click="handleShowBind"
        >
          新增绑定
        </el-button>
      </div>
    </template>

    <div v-loading="loading" class="drawer-body p-4">
      <el-table :data="couponList" border stripe style="width: 100%">
        <el-table-column prop="couponName" label="优惠券名称" min-width="150" show-overflow-tooltip />
        <el-table-column label="类型" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.couponType === 1 ? 'primary' : 'warning'" size="small">
              {{ scope.row.couponType === 1 ? '满减券' : '折扣券' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="库存(总/余)" width="180" align="center">
          <template #default="scope">
            <div class="flex items-center justify-center gap-2">
              <span class="font-mono">{{ scope.row.remainingStock }}</span>
              <span class="text-gray-300">/</span>
              <span class="font-mono text-gray-500">{{ scope.row.totalStock }}</span>
              
              <!-- 调整库存 -->
              <el-popover placement="top" :width="200" trigger="click">
                <template #reference>
                  <el-button link type="primary" icon="EditPen" />
                </template>
                <div class="p-2">
                  <div class="text-xs text-gray-500 mb-2">输入调整增量(如: 10 或 -5)</div>
                  <el-input-number v-model="stockDelta" size="small" style="width: 100%" />
                  <div class="mt-3 flex justify-end">
                    <el-button type="primary" size="small" @click="handleAdjustStock(scope.row)">确定</el-button>
                  </div>
                </div>
              </el-popover>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="scope">
            <el-button
              link
              type="danger"
              icon="Delete"
              :disabled="activityInfo?.status !== 1"
              @click="handleUnbind(scope.row)"
            >
              移除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 内部弹窗：选择优惠券 -->
    <el-dialog
      v-model="dialogVisible"
      title="选择优惠券进行绑定"
      width="800px"
      append-to-body
    >
      <div class="mb-4 flex justify-between items-center">
        <el-input
          v-model="couponQueryParams.couponName"
          placeholder="搜索券名称"
          style="width: 240px"
          clearable
          @keyup.enter="getAvailableCoupons"
        >
          <template #append>
            <el-button icon="Search" @click="getAvailableCoupons" />
          </template>
        </el-input>
      </div>

      <el-table
        ref="selectionTableRef"
        v-loading="dialogLoading"
        :data="availableCoupons"
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="couponName" label="券名称" min-width="150" />
        <el-table-column label="券类型" width="100">
          <template #default="scope">
            {{ scope.row.couponType === 1 ? '满减' : '折扣' }}
          </template>
        </el-table-column>
        <el-table-column label="分配数量" width="150" align="center">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.initialStock"
              :min="1"
              size="small"
              placeholder="库存"
            />
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="couponQueryParams.current"
          v-model:page-size="couponQueryParams.size"
          :total="couponTotal"
          layout="total, prev, pager, next"
          small
          @current-change="getAvailableCoupons"
        />
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="bindLoading" @click="submitBind">确认绑定</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getActivityDetail, 
  bindCoupons, 
  adjustStock, 
  unbindCoupon,
  ActivityCouponRelationVO,
  CouponActivityVO 
} from '@/api/activityCoupon'
import { getCouponPage } from '@/api/coupon'

// 基础状态
const visible = ref(false)
const loading = ref(false)
const activityId = ref('')
const activityInfo = ref<CouponActivityVO | null>(null)
const couponList = ref<ActivityCouponRelationVO[]>([])
const stockDelta = ref(0)

// 选择券相关
const dialogVisible = ref(false)
const dialogLoading = ref(false)
const bindLoading = ref(false)
const availableCoupons = ref<any[]>([])
const couponTotal = ref(0)
const selectedCoupons = ref<any[]>([])
const couponQueryParams = reactive({
  current: 1,
  size: 10,
  couponName: '',
  status: 1 // 仅查询启用的券
})

/** 暴露开启方法 */
const openDrawer = (id: string) => {
  activityId.value = id
  visible.value = true
  initData()
}

/** 初始化获取活动详情 */
const initData = async () => {
  loading.value = true
  try {
    const data = await getActivityDetail(activityId.value)
    activityInfo.value = data
    couponList.value = data.couponList || []
  } finally {
    loading.value = false
  }
}

/** 调整库存 */
const handleAdjustStock = async (row: ActivityCouponRelationVO) => {
  if (stockDelta.value === 0) {
    ElMessage.warning('请输入调整数值')
    return
  }
  try {
    await adjustStock(activityId.value, row.couponId, stockDelta.value)
    ElMessage.success('库存调整成功')
    stockDelta.value = 0
    initData()
  } catch (error) {}
}

/** 移除绑定 */
const handleUnbind = (row: ActivityCouponRelationVO) => {
  ElMessageBox.confirm(`确定要从该活动中移除优惠券 "${row.couponName}" 吗？`, '移除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await unbindCoupon(activityId.value, row.couponId)
    ElMessage.success('已成功移除')
    initData()
  }).catch(() => {})
}

/** 打开选择券弹窗 */
const handleShowBind = () => {
  dialogVisible.value = true
  getAvailableCoupons()
}

/** 获取系统中可用的优惠券列表 */
const getAvailableCoupons = async () => {
  dialogLoading.value = true
  try {
    const res = await getCouponPage(couponQueryParams)
    availableCoupons.value = res.records.map(item => ({
      ...item,
      initialStock: 100 // 默认初始库存
    }))
    couponTotal.value = res.total
  } finally {
    dialogLoading.value = false
  }
}

const handleSelectionChange = (val: any[]) => {
  selectedCoupons.value = val
}

/** 提交绑定 */
const submitBind = async () => {
  if (selectedCoupons.value.length === 0) {
    ElMessage.warning('请至少选择一张优惠券')
    return
  }
  
  bindLoading.value = true
  try {
    const bindList = selectedCoupons.value.map(item => ({
      couponId: item.id,
      totalStock: item.initialStock
    }))
    await bindCoupons(activityId.value, bindList)
    ElMessage.success('绑定成功')
    dialogVisible.value = false
    initData()
  } finally {
    bindLoading.value = false
  }
}

// 辅助方法
const getStatusLabel = (status: number) => {
  const map: any = { 1: '未开始', 2: '进行中', 3: '已结束', 4: '手动关闭' }
  return map[status] || '未知'
}

const getStatusTag = (status: number) => {
  const map: any = { 1: 'info', 2: 'success', 3: 'danger', 4: 'warning' }
  return map[status] || 'info'
}

defineExpose({ openDrawer })
</script>

<style lang="scss" scoped>
.drawer-header {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.drawer-body {
  height: calc(100vh - 120px);
  overflow-y: auto;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.gap-4 { gap: 1rem; }
.gap-2 { gap: 0.5rem; }

:deep(.el-drawer__header) {
  margin-bottom: 0;
  padding-bottom: 0;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}
</style>
