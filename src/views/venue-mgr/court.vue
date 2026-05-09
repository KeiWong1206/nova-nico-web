<template>
  <div class="court-container">
    <!-- 顶部搜索区域 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="queryParams" ref="queryFormRef" class="search-form">
        <el-form-item label="所属门店" prop="venueId">
          <el-select v-model="queryParams.venueId" placeholder="选择门店" clearable style="width: 200px">
            <el-option
              v-for="item in venueOptions"
              :key="item.id"
              :label="item.venueName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="场地名称" prop="name">
          <el-input v-model="queryParams.name" placeholder="请输入场地名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="场地类型" prop="type">
          <el-select v-model="queryParams.type" placeholder="全部类型" clearable style="width: 150px">
            <el-option
              v-for="dict in courtTypeOptions"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格区域 -->
    <el-card class="table-card">
      <template #header>
        <div class="table-header">
          <div class="left">
            <el-button
              type="primary"
              icon="Plus"
              @click="handleAdd"
            >
              新增场地
            </el-button>
          </div>
          <div class="right">
            <el-button icon="Refresh" circle @click="getList" />
          </div>
        </div>
      </template>

      <el-table v-loading="loading" :data="courtList" border stripe style="width: 100%">
        <el-table-column prop="name" label="场地名称" min-width="120" />
        <el-table-column label="所属门店" min-width="150">
          <template #default="scope">
            {{ getVenueName(scope.row.venueId) }}
          </template>
        </el-table-column>
        <el-table-column label="场地类型" width="120" align="center">
          <template #default="scope">
            <el-tag :color="getTypeStyle(scope.row.courtType).color" effect="dark" border>
              {{ getDictLabel(courtTypeOptions, scope.row.courtType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="室内/外" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.isIndoor === 1 ? '' : 'info'">
              {{ scope.row.isIndoor === 1 ? '室内' : '室外' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'danger'">
              {{ scope.row.status === 1 ? '正常' : '维护中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
        <el-table-column label="创建时间" width="170" align="center">
          <template #default="scope">
            <span>{{ scope.row.createTime ? scope.row.createTime.replace('T', ' ') : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="Money" @click="handlePriceRule(scope.row)">定价规则</el-button>
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
            <el-button
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
      <div class="pagination-container">
        <el-pagination
          v-show="total > 0"
          :total="total"
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>

    <!-- 定价规则抽屉 -->
    <price-rule-drawer ref="priceRuleDrawerRef" />

    <!-- 新增/修改对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="500px"
      append-to-body
      @close="cancel"
    >
      <el-form ref="courtFormRef" :model="form" :rules="rules" label-width="100px" style="padding-top: 10px;">
        <el-form-item label="所属门店" prop="venueId">
          <el-select v-model="form.venueId" placeholder="请选择所属门店" style="width: 100%">
            <el-option
              v-for="item in venueOptions"
              :key="item.id"
              :label="item.venueName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="场地名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入场地名称" />
        </el-form-item>
        <el-form-item label="场地类型" prop="courtType">
          <el-select v-model="form.courtType" placeholder="请选择场地类型" style="width: 100%">
            <el-option
              v-for="dict in courtTypeOptions"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="位置类型" prop="isIndoor">
          <el-radio-group v-model="form.isIndoor">
            <el-radio :label="1">室内</el-radio>
            <el-radio :label="0">室外</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="场地状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">维护中</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序号" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" controls-position="right" style="width: 120px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { getCourtPage, getCourt, saveCourt, deleteCourt, Court } from '@/api/court'
import { getVenueList, Venue } from '@/api/venue'
import PriceRuleDrawer from './components/PriceRuleDrawer.vue'

// 业务字典定义
const courtTypeOptions = [
  { label: '羽毛球', value: 1, color: '#409eff' },
  { label: '篮球半场', value: 2, color: '#67c23a' },
  { label: '网球', value: 3, color: '#e6a23c' }
]

// 响应式状态
const loading = ref(false)
const submitLoading = ref(false)
const total = ref(0)
const courtList = ref<Court[]>([])
const venueOptions = ref<Venue[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const queryFormRef = ref<FormInstance>()
const courtFormRef = ref<FormInstance>()

// 组件引用
const priceRuleDrawerRef = ref<InstanceType<typeof PriceRuleDrawer>>()

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  name: '',
  venueId: undefined as number | string | undefined,
  type: undefined as string | number | undefined
})

// 表单对象
const form = reactive<Court>({
  id: undefined,
  venueId: undefined as any, // 初始化为 undefined 避免显示空字符串
  name: '',
  courtType: 1,
  isIndoor: 1,
  status: 1,
  sortOrder: 0
})

// 表单校验规则
const rules = reactive<FormRules>({
  venueId: [{ required: true, message: '请选择所属门店', trigger: 'change' }],
  name: [{ required: true, message: '请输入场地名称', trigger: 'blur' }],
  courtType: [{ required: true, message: '请选择场地类型', trigger: 'change' }]
})

/** 获取门店下拉列表 */
const getVenueOptions = async () => {
  try {
    const data = await getVenueList()
    // 强制将门店 ID 转为字符串，并兼容后端可能的字段名差异 (id 或 venueId)
    venueOptions.value = data.map(item => {
      const actualId = item.id || (item as any).venueId
      return {
        ...item,
        id: actualId ? String(actualId) : ''
      }
    })
  } catch (error) {
    console.error('加载门店列表失败', error)
  }
}

/** 获取场地分页列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await getCourtPage(queryParams)
    // 同样将列表中的 venueId 转为字符串
    courtList.value = data.records.map(item => ({
      ...item,
      venueId: item.venueId ? String(item.venueId) : ''
    }))
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 字典标签映射 */
const getDictLabel = (options: any[], value: any) => {
  const target = options.find(item => String(item.value) === String(value))
  return target ? target.label : value
}

/** 类型颜色映射 */
const getTypeStyle = (value: any) => {
  const target = courtTypeOptions.find(item => String(item.value) === String(value))
  return target || { color: '#909399' }
}

/** 打开定价规则抽屉 */
const handlePriceRule = (row: Court) => {
  priceRuleDrawerRef.value?.openDrawer(String(row.id), row.name)
}

/** 获取门店名称显示 */
const getVenueName = (id: any) => {
  if (!id) return '-'
  const targetId = String(id).trim()
  const venue = venueOptions.value.find(v => String(v.id).trim() === targetId)
  return venue ? venue.venueName : '-'
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

/** 重置查询 */
const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 新增按钮 */
const handleAdd = () => {
  reset()
  dialogTitle.value = '新增场地'
  dialogVisible.value = true
}

/** 修改按钮 */
const handleUpdate = async (row: Court) => {
  reset()
  loading.value = true
  try {
    const data = await getCourt(row.id!)
    // 直接赋值，保持 ID 为字符串，防止精度丢失
    Object.assign(form, data)
    // 再次加固：确保 venueId 是字符串，以便 el-select 正确回显
    if (form.venueId) {
      form.venueId = String(form.venueId)
    }
    
    dialogTitle.value = '修改场地'
    dialogVisible.value = true
  } finally {
    loading.value = false
  }
}

/** 重置表单对象 */
const reset = () => {
  Object.assign(form, {
    id: undefined,
    venueId: undefined,
    name: '',
    courtType: 1,
    isIndoor: 1,
    status: 1,
    sortOrder: 0
  })
}

/** 提交表单 */
const submitForm = async () => {
  courtFormRef.value?.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        await saveCourt(form)
        ElMessage.success('保存成功')
        dialogVisible.value = false
        getList()
      } finally {
        submitLoading.value = false
      }
    }
  })
}

/** 取消按钮 */
const cancel = () => {
  dialogVisible.value = false
  reset()
}

/** 删除操作 */
const handleDelete = (row: Court) => {
  if (!row.id) {
    ElMessage.error('该数据 ID 为空，无法执行删除操作，请检查后端数据！')
    return
  }
  ElMessageBox.confirm(`是否确认删除场地名称为 "${row.name}" 的数据项？`, '系统警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteCourt(row.id!)
    getList()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

onMounted(async () => {
  loading.value = true
  try {
    // 关键：必须先拿到门店列表，再请求场地列表，确保名称能顺序匹配上
    await getVenueOptions()
    await getList()
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.court-container {
  padding: 0px;

  .search-card {
    margin-bottom: 15px;
    border: none;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  }

  .table-card {
    border: none;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

:deep(.el-card__header) {
  padding: 15px 20px;
  border-bottom: 1px solid #f0f2f5;
}
</style>
