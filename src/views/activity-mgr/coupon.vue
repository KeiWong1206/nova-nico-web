<template>
  <div class="coupon-container p-4">
    <el-card shadow="never" class="search-card mb-4">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="优惠券名称">
          <el-input v-model="queryParams.couponName" placeholder="请输入名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="券类型">
          <el-select v-model="queryParams.couponType" placeholder="请选择" clearable style="width: 120px">
            <el-option label="满减券" :value="1" />
            <el-option label="折扣券" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="flex justify-between items-center">
          <div class="header-title">优惠券列表</div>
          <el-button v-hasPermi="['activity:list']" type="primary" icon="Plus" @click="handleAdd">新增优惠券</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="couponList" border stripe>
        <el-table-column prop="couponName" label="优惠券名称" min-width="150" show-overflow-tooltip />
        <el-table-column label="券类型" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.couponType === 1 ? 'primary' : 'warning'">
              {{ scope.row.couponType === 1 ? '满减券' : '折扣券' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优惠规则" min-width="180">
          <template #default="scope">
            <span v-if="scope.row.couponType === 1">
              满 <b class="text-primary">{{ scope.row.minAmount }}</b> 减 <b class="text-danger">{{ scope.row.discountAmount }}</b> 元
            </span>
            <span v-else>
              满 <b class="text-primary">{{ scope.row.minAmount }}</b> 打 <b class="text-warning">{{ (scope.row.discountRate * 10).toFixed(1) }}</b> 折
            </span>
          </template>
        </el-table-column>
        <el-table-column label="有效期" width="320" align="center">
          <template #default="scope">
            <span class="text-xs text-gray-500">{{ scope.row.validStartTime }} 至 {{ scope.row.validEndTime }}</span>
          </template>
        </el-table-column>
        <el-table-column label="发行/限领" width="150" align="center">
          <template #default="scope">
            <div>{{ scope.row.totalQuantity === 0 ? '不限量' : scope.row.totalQuantity }}</div>
            <div class="text-xs text-gray-400">限 {{ scope.row.limitPerUser === 0 ? '不限' : scope.row.limitPerUser }} 张/人</div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" align="center" />
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="scope">
            <el-button v-hasPermi="['activity:list']" link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="queryParams.current"
          v-model:page-size="queryParams.size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <!-- 弹窗表单 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="650px" append-to-body>
      <el-form ref="couponFormRef" :model="form" :rules="rules" label-width="110px">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="优惠券名称" prop="couponName">
              <el-input v-model="form.couponName" placeholder="如：店庆10元优惠券" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="券类型" prop="couponType">
              <el-radio-group v-model="form.couponType" :disabled="!!form.id">
                <el-radio :label="1">满减券</el-radio>
                <el-radio :label="2">折扣券</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="使用门槛" prop="minAmount">
              <el-input-number v-model="form.minAmount" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>

          <!-- 动态字段：满减金额 -->
          <el-col :span="12" v-if="form.couponType === 1">
            <el-form-item label="满减金额" prop="discountAmount">
              <el-input-number v-model="form.discountAmount" :min="0.01" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <!-- 动态字段：折扣率 -->
          <el-col :span="12" v-if="form.couponType === 2">
            <el-form-item label="折扣率" prop="discountRate">
              <el-input-number v-model="form.discountRate" :min="0.01" :max="1" :step="0.01" :precision="2" style="width: 100%" />
              <div class="form-tip">0.85表示85折</div>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="有效期" prop="timeRange">
              <el-date-picker
                v-model="form.timeRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发行总量" prop="totalQuantity">
              <el-input-number v-model="form.totalQuantity" :min="0" style="width: 100%" />
              <div class="form-tip">0表示不限制</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="每人限领" prop="limitPerUser">
              <el-input-number v-model="form.limitPerUser" :min="0" style="width: 100%" />
              <div class="form-tip">0表示不限制</div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="适用门店" prop="storeIds">
              <el-select
                v-model="form.storeIds"
                multiple
                collapse-tags
                placeholder="请选择适用门店，为空表示全门店"
                style="width: 100%"
              >
                <el-option
                  v-for="item in venueOptions"
                  :key="item.id"
                  :label="item.venueName"
                  :value="String(item.id)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="使用说明" prop="description">
              <el-input v-model="form.description" type="textarea" :rows="3" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { 
  getCouponPage, 
  getCouponDetail, 
  createCoupon, 
  updateCoupon, 
  changeCouponStatus,
  CouponVO 
} from '@/api/coupon'
import { getVenueList, Venue } from '@/api/venue'

// 列表相关
const loading = ref(false)
const couponList = ref<CouponVO[]>([])
const venueOptions = ref<Venue[]>([]) // 门店字典
const total = ref(0)
const queryParams = reactive({
  current: 1,
  size: 10,
  couponName: '',
  couponType: undefined,
  status: undefined
})

// 表单相关
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const couponFormRef = ref<FormInstance>()

interface CouponForm extends Partial<CouponVO> {
  timeRange?: [string, string]
  storeIds?: string[] // 用于 el-select 绑定的数组
}

const form = reactive<CouponForm>({
  id: undefined,
  couponName: '',
  couponType: 1,
  minAmount: 0,
  discountAmount: undefined,
  discountRate: undefined,
  totalQuantity: 0,
  limitPerUser: 1,
  applicableStores: '',
  storeIds: [],
  description: '',
  timeRange: undefined
})

const rules = reactive<FormRules>({
  couponName: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  couponType: [{ required: true, message: '请选择券类型', trigger: 'change' }],
  minAmount: [{ required: true, message: '请输入使用门槛', trigger: 'blur' }],
  discountAmount: [{ required: true, message: '请输入满减金额', trigger: 'blur' }],
  discountRate: [{ required: true, message: '请输入折扣率', trigger: 'blur' }],
  timeRange: [{ required: true, message: '请选择有效期', trigger: 'change' }]
})

/** 获取数据 */
const getList = async () => {
  loading.value = true
  try {
    const data = await getCouponPage(queryParams)
    couponList.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 获取门店字典 */
const getVenues = async () => {
  try {
    venueOptions.value = await getVenueList()
  } catch (error) {
    console.error('获取门店列表失败', error)
  }
}

/** 搜索 */
const handleQuery = () => {
  queryParams.current = 1
  getList()
}

/** 重置 */
const resetQuery = () => {
  queryParams.couponName = ''
  queryParams.couponType = undefined
  queryParams.status = undefined
  handleQuery()
}

/** 新增 */
const handleAdd = () => {
  reset()
  dialogTitle.value = '新增优惠券'
  dialogVisible.value = true
}

/** 修改 */
const handleUpdate = async (row: CouponVO) => {
  reset()
  try {
    const data = await getCouponDetail(row.id!)
    Object.assign(form, data)
    
    // 1. 处理有效期时间回显
    if (data.validStartTime && data.validEndTime) {
      form.timeRange = [data.validStartTime, data.validEndTime]
    }
    
    // 2. 处理适用门店回显：字符串转数组
    if (data.applicableStores) {
      form.storeIds = data.applicableStores.split(',')
    } else {
      form.storeIds = []
    }
    
    dialogTitle.value = '修改优惠券'
    dialogVisible.value = true
  } catch (error) {}
}

/** 提交 */
const submitForm = async () => {
  couponFormRef.value?.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        // 1. 时间拆分
        if (form.timeRange && form.timeRange.length === 2) {
          form.validStartTime = form.timeRange[0]
          form.validEndTime = form.timeRange[1]
        }
        
        // 2. 门店数组转字符串
        if (form.storeIds && form.storeIds.length > 0) {
          form.applicableStores = form.storeIds.join(',')
        } else {
          form.applicableStores = ''
        }
        
        if (form.id) {
          await updateCoupon(form)
          ElMessage.success('更新成功')
        } else {
          await createCoupon(form)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        getList()
      } finally {
        submitLoading.value = false
      }
    }
  })
}

/** 状态切换 */
const handleStatusChange = async (row: CouponVO) => {
  const text = row.status === 1 ? '启用' : '禁用'
  try {
    await changeCouponStatus(row.id!, row.status)
    ElMessage.success(`${text}成功`)
  } catch (error) {
    // 失败回显恢复
    row.status = row.status === 1 ? 0 : 1
  }
}

const reset = () => {
  // 1. 显式置空所有表单字段
  form.id = undefined
  form.couponName = ''
  form.couponType = 1
  form.minAmount = 0
  form.discountAmount = undefined
  form.discountRate = undefined
  form.totalQuantity = 0
  form.limitPerUser = 1
  form.applicableStores = ''
  form.storeIds = []
  form.description = ''
  form.timeRange = undefined

  // 2. 清除表单校验痕迹
  nextTick(() => {
    couponFormRef.value?.clearValidate()
  })
}

onMounted(() => {
  getList()
  getVenues()
})
</script>

<style lang="scss" scoped>
.coupon-container {
  .search-card, .table-card {
    border: none;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  }
  .header-title { font-size: 16px; font-weight: bold; }
  .text-primary { color: #409eff; }
  .text-danger { color: #f56c6c; font-size: 16px; }
  .text-warning { color: #e6a23c; font-size: 16px; }
  .text-xs { font-size: 12px; }
  .text-gray-400 { color: #c0c4cc; }
  .text-gray-500 { color: #909399; }
  .form-tip { font-size: 12px; color: #909399; margin-top: 4px; line-height: 1.2; }
}
</style>
