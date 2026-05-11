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
            :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)]"
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
          <div class="header-title">优惠券活动列表</div>
          <el-button v-hasPermi="['activity:add']" type="primary" icon="Plus" @click="handleAdd">创建活动</el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="activityList" border stripe style="width: 100%">
        <el-table-column prop="activityName" label="活动名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)" effect="dark">
              {{ getStatusLabel(scope.row.status) }}
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
            <div class="time-range-display">
              <span class="time">{{ scope.row.startTime }}</span>
              <span class="sep">至</span>
              <span class="time">{{ scope.row.endTime }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" align="center" />
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="scope">
            <!-- 修改：仅未开始(1)或进行中(2)可修改 -->
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
            <!-- 关闭：仅未开始(1)或进行中(2)可关闭 -->
            <el-button
              v-if="[1, 2].includes(scope.row.status)"
              link
              type="warning"
              icon="VideoPause"
              @click="handleClose(scope.row)"
            >
              手动关闭
            </el-button>
            <!-- 删除：仅未开始(1)可删除 -->
            <el-button
              v-if="scope.row.status === 1"
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { 
  getActivityPage, 
  getActivityDetail, 
  createActivity, 
  updateActivity, 
  deleteActivity, 
  closeActivity,
  CouponActivityVO 
} from '@/api/coupon-activity'

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
  sendChannel: undefined,
  startTimeBegin: '',
  startTimeEnd: ''
})

// 表单状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const activityFormRef = ref<FormInstance>()

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
  loading.value = true
  try {
    // 处理搜索时间拆分
    if (dateRange.value && dateRange.value.length === 2) {
      queryParams.startTimeBegin = dateRange.value[0]
      queryParams.startTimeEnd = dateRange.value[1]
    } else {
      queryParams.startTimeBegin = ''
      queryParams.startTimeEnd = ''
    }
    
    const data = await getActivityPage(queryParams)
    activityList.value = data.records
    total.value = data.total
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
  dialogTitle.value = '创建优惠券活动'
  dialogVisible.value = true
}

/** 修改按钮 */
const handleUpdate = async (row: CouponActivityVO) => {
  reset()
  try {
    const data = await getActivityDetail(row.id!)
    Object.assign(form, data)
    // 关键：将 startTime 和 endTime 拼回数组供组件显示
    if (data.startTime && data.endTime) {
      form.timeRange = [data.startTime, data.endTime]
    }
    dialogTitle.value = '修改活动信息'
    dialogVisible.value = true
  } catch (error) {}
}

/** 提交表单 */
const submitForm = async () => {
  activityFormRef.value?.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        // 关键：拆分时间数组
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

/** 手动关闭活动 */
const handleClose = (row: CouponActivityVO) => {
  ElMessageBox.confirm(`确定要提前关闭活动 "${row.activityName}" 吗？关闭后不可恢复。`, '系统警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await closeActivity(row.id!)
    ElMessage.success('活动已手动关闭')
    getList()
  }).catch(() => {})
}

/** 删除操作 */
const handleDelete = (row: CouponActivityVO) => {
  ElMessageBox.confirm(`是否确认删除活动 "${row.activityName}"？`, '系统警告', {
    type: 'warning'
  }).then(async () => {
    await deleteActivity(row.id!)
    getList()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 辅助格式化方法
const getStatusLabel = (val: number) => {
  const item = statusOptions.find(opt => opt.value === val)
  return item ? item.label : '未知'
}

const getStatusTag = (val: number) => {
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
  }

  .header-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
  }

  .time-range-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.4;
    .sep {
      color: #909399;
      font-size: 12px;
      margin: 2px 0;
    }
    .time {
      font-family: monospace;
      color: #606266;
    }
  }

  .flex { display: flex; }
  .justify-between { justify-content: space-between; }
  .items-center { align-items: center; }
  .justify-end { justify-content: flex-end; }
  .mt-4 { margin-top: 1rem; }
  .mb-4 { margin-bottom: 1rem; }
  .p-4 { padding: 1rem; }
}
</style>
