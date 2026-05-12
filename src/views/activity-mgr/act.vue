<template>
  <div class="activity-container p-4">
    <!-- 顶部搜索区 -->
    <el-card shadow="never" class="search-card mb-4">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="活动名称">
          <el-input v-model="queryParams.activityName" placeholder="请输入活动名称" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 150px">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表区 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="flex justify-between items-center">
          <div class="header-title">优惠券活动管理</div>
          <el-button v-hasPermi="['activity:add']" type="primary" icon="Plus" @click="handleAdd">创建活动</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="activityList" border stripe style="width: 100%">
        <el-table-column prop="activityName" label="活动名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row?.status)" effect="dark">
              {{ getStatusLabel(scope.row?.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发放渠道" width="120" align="center">
          <template #default="scope">
            {{ getChannelLabel(scope.row.sendChannel) }}
          </template>
        </el-table-column>
        <el-table-column label="活动周期" min-width="320" align="center">
          <template #default="scope">
            <div class="time-range-display" v-if="scope.row?.startTime">
              <span class="time">{{ scope.row.startTime }}</span>
              <span class="sep">至</span>
              <span class="time">{{ scope.row.endTime }}</span>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" align="center" />
        <el-table-column label="操作" width="300" align="center" fixed="right">
          <template #default="scope">
            <el-button
              link
              type="primary"
              icon="Setting"
              @click="handleConfigCoupons(scope.row)"
            >
              配置券
            </el-button>
            <el-button
              v-if="[1, 2].includes(scope.row.status)"
              v-hasPermi="['activity:update']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(scope.row)"
            >
              修改
            </el-button>
            <el-button
              v-if="[1, 2].includes(scope.row.status)"
              link
              type="warning"
              icon="VideoPause"
              @click="handleClose(scope.row)"
            >
              关闭
            </el-button>
            <el-button
              v-if="[1, 3, 4].includes(scope.row.status)"
              v-hasPermi="['activity:delete']"
              link
              type="danger"
              icon="Delete"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <!-- 创建/修改对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" append-to-body>
      <el-form ref="activityFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="活动名称" prop="activityName">
          <el-input v-model="form.activityName" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="发放渠道" prop="sendChannel">
          <el-select v-model="form.sendChannel" placeholder="请选择发放渠道" style="width: 100%">
            <el-option v-for="item in channelOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="活动时间" prop="timeRange">
          <el-date-picker
            v-model="form.timeRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 优惠券配置抽屉 -->
    <ActivityCouponDrawer ref="couponDrawerRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import ActivityCouponDrawer from './components/ActivityCouponDrawer.vue'
import { 
  getActivityPage, 
  createActivity, 
  updateActivity, 
  deleteActivity, 
  closeActivity,
  getActivityDetail,
  CouponActivityVO 
} from '@/api/activityCoupon'

// 业务字典
const statusOptions = [
  { label: '未开始', value: 1, type: 'info' },
  { label: '进行中', value: 2, type: 'success' },
  { label: '已结束', value: 3, type: 'danger' },
  { label: '手动关闭', value: 4, type: 'warning' }
]

const channelOptions = [
  { label: '全部', value: 'ALL' },
  { label: 'APP内', value: 'APP' },
  { label: '微信', value: 'WECHAT' },
  { label: '线下', value: 'OFFLINE' }
]

// 状态定义
const loading = ref(false)
const submitLoading = ref(false)
const activityList = ref<CouponActivityVO[]>([])
const total = ref(0)
const dateRange = ref<[string, string] | null>(null)

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  activityName: '',
  status: undefined,
  startTimeBegin: '',
  startTimeEnd: ''
})

// 表单状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const activityFormRef = ref<FormInstance>()
const couponDrawerRef = ref<InstanceType<typeof ActivityCouponDrawer>>()

interface ActivityForm extends Partial<CouponActivityVO> {
  timeRange?: [string, string]
}

const form = reactive<ActivityForm>({
  id: undefined,
  activityName: '',
  sendChannel: 'ALL',
  startTime: '',
  endTime: '',
  timeRange: undefined
})

const rules = reactive<FormRules>({
  activityName: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  sendChannel: [{ required: true, message: '请选择发放渠道', trigger: 'change' }],
  timeRange: [{ required: true, message: '请选择活动时间', trigger: 'change' }]
})

/** 获取列表 */
const getList = async () => {
  console.log('发起活动列表请求, 参数:', queryParams)
  loading.value = true
  try {
    if (dateRange.value && dateRange.value.length === 2) {
      queryParams.startTimeBegin = dateRange.value[0]
      queryParams.startTimeEnd = dateRange.value[1]
    } else {
      queryParams.startTimeBegin = ''
      queryParams.startTimeEnd = ''
    }
    
    const data = await getActivityPage(queryParams)
    console.log('请求成功, 返回数据:', data)
    activityList.value = data.records
    total.value = data.total
  } catch (error: any) {
    console.error('列表请求失败:', error)
    ElMessage.error('获取列表数据失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

/** 搜索与重置 */
const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

const resetQuery = () => {
  queryParams.activityName = ''
  queryParams.status = undefined
  dateRange.value = null
  handleQuery()
}

/** 新增按钮 */
const handleAdd = () => {
  reset()
  dialogTitle.value = '创建活动'
  dialogVisible.value = true
}

/** 修改按钮 */
const handleUpdate = async (row: CouponActivityVO) => {
  reset()
  try {
    const data = await getActivityDetail(row.id!)
    Object.assign(form, data)
    if (data.startTime && data.endTime) {
      form.timeRange = [data.startTime, data.endTime]
    }
    dialogTitle.value = '修改活动'
    dialogVisible.value = true
  } catch (error) {}
}

/** 配置优惠券 */
const handleConfigCoupons = (row: CouponActivityVO) => {
  couponDrawerRef.value?.openDrawer(row.id!)
}

/** 提交表单 */
const submitForm = async () => {
  activityFormRef.value?.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (form.timeRange && form.timeRange.length === 2) {
          form.startTime = form.timeRange[0]
          form.endTime = form.timeRange[1]
        }
        
        if (form.id) {
          await updateActivity(form)
          ElMessage.success('更新成功')
        } else {
          await createActivity(form)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        getList()
      } finally {
        submitLoading.value = false
      }
    }
  })
}

/** 手动关闭 */
const handleClose = (row: CouponActivityVO) => {
  ElMessageBox.confirm(`确定要关闭活动 "${row.activityName}" 吗？`, '警告', {
    type: 'warning'
  }).then(async () => {
    await closeActivity(row.id!)
    ElMessage.success('活动已关闭')
    getList()
  })
}

/** 删除 */
const handleDelete = (row: CouponActivityVO) => {
  ElMessageBox.confirm(`确认删除活动 "${row.activityName}" 吗？`, '警告', {
    type: 'warning'
  }).then(async () => {
    await deleteActivity(row.id!)
    getList()
    ElMessage.success('删除成功')
  })
}

const getStatusLabel = (val: number) => {
  if (val === undefined || val === null) return '未知'
  const item = statusOptions.find(opt => opt.value === val)
  return item ? item.label : '未知'
}

const getStatusTag = (val: number) => {
  if (val === undefined || val === null) return 'info'
  const item = statusOptions.find(opt => opt.value === val)
  return item ? (item.type as any) : 'info'
}

const getChannelLabel = (val: string) => {
  const item = channelOptions.find(opt => opt.value === val)
  return item ? item.label : val
}

const reset = () => {
  Object.assign(form, {
    id: undefined,
    activityName: '',
    sendChannel: 'ALL',
    startTime: '',
    endTime: '',
    timeRange: undefined
  })
  activityFormRef.value?.resetFields()
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.activity-container {
  .search-card, .table-card {
    border: none;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    margin-bottom: 15px;
  }
  .header-title { font-size: 16px; font-weight: bold; }
  .time-range-display {
    display: flex; flex-direction: column; align-items: center;
    .sep { color: #909399; font-size: 12px; }
  }
  .flex { display: flex; }
  .justify-between { justify-content: space-between; }
  .items-center { align-items: center; }
  .justify-end { justify-content: flex-end; }
  .mt-4 { margin-top: 1rem; }
  .p-4 { padding: 1rem; }
}
</style>
