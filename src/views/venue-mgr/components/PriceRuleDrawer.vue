<template>
  <el-drawer
    v-model="visible"
    :title="`场地定价规则 - ${courtName}`"
    size="850px"
    destroy-on-close
  >
    <div class="drawer-content">
      <!-- 顶部操作栏 -->
      <div class="table-toolbar">
        <el-button type="primary" icon="Plus" @click="handleAdd">新增规则</el-button>
        <el-button icon="Refresh" @click="getList">刷新</el-button>
      </div>

      <!-- 规则列表表格 -->
      <el-table v-loading="loading" :data="ruleList" border stripe style="width: 100%">
        <el-table-column prop="ruleName" label="规则名称" min-width="120" />
        <el-table-column label="适用星期" min-width="150">
          <template #default="scope">
            <el-tag 
              v-for="day in formatDayOfWeek(scope.row.dayOfWeek)" 
              :key="day"
              size="small"
              class="mr-1"
            >
              {{ day }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="生效时段" width="150" align="center">
          <template #default="scope">
            <el-tag type="warning" effect="plain">
              {{ scope.row.startTime }} - {{ scope.row.endTime }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="售价" width="100" align="right">
          <template #default="scope">
            <span class="price-text">¥{{ scope.row.price.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80" align="center" />
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="scope">
            <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)">修改</el-button>
            <el-divider direction="vertical" />
            <el-button link type="danger" icon="Delete" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 内层对话框：新增/修改表单 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      append-to-body
    >
      <el-form ref="ruleFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="规则名称" prop="ruleName">
          <el-input v-model="form.ruleName" placeholder="如：周末高峰时段" />
        </el-form-item>
        <el-form-item label="适用星期" prop="dayOfWeekArr">
          <el-select
            v-model="form.dayOfWeekArr"
            multiple
            collapse-tags
            placeholder="请选择生效星期"
            style="width: 100%"
          >
            <el-option
              v-for="item in weekOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="生效时段" required>
          <div class="time-range-picker">
            <el-form-item prop="startTime">
              <el-time-select
                v-model="form.startTime"
                start="00:00"
                step="00:30"
                end="23:30"
                placeholder="起始"
              />
            </el-form-item>
            <span class="separator">-</span>
            <el-form-item prop="endTime">
              <el-time-select
                v-model="form.endTime"
                start="00:00"
                step="00:30"
                end="23:30"
                placeholder="截止"
              />
            </el-form-item>
          </div>
        </el-form-item>
        <el-form-item label="售价 (元)" prop="price">
          <el-input-number 
            v-model="form.price" 
            :precision="2" 
            :step="10" 
            :min="0" 
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input-number 
            v-model="form.priority" 
            :min="0" 
            :max="99" 
            style="width: 100%"
          />
          <div class="tip">数值越大，冲突时优先匹配</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { 
  getPriceRuleList, 
  getPriceRuleDetail, 
  addPriceRule, 
  updatePriceRule, 
  deletePriceRule,
  PriceRule 
} from '@/api/priceRule'

// 星期字典
const weekOptions = [
  { label: '周一', value: '1' },
  { label: '周二', value: '2' },
  { label: '周三', value: '3' },
  { label: '周四', value: '4' },
  { label: '周五', value: '5' },
  { label: '周六', value: '6' },
  { label: '周日', value: '7' }
]

// 响应式状态
const visible = ref(false)
const loading = ref(false)
const courtId = ref('')
const courtName = ref('')
const ruleList = ref<PriceRule[]>([])

// 表单弹窗状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const ruleFormRef = ref<FormInstance>()

// 扩展表单模型，增加用于 Select 多选的数组字段
interface PriceRuleForm extends PriceRule {
  dayOfWeekArr: string[]
}

const form = reactive<PriceRuleForm>({
  id: undefined,
  courtId: '',
  ruleName: '',
  dayOfWeek: '',
  dayOfWeekArr: [],
  startTime: '09:00',
  endTime: '22:00',
  price: 0,
  priority: 1
})

const rules = reactive<FormRules>({
  ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  dayOfWeekArr: [{ required: true, message: '请选择适用星期', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  price: [{ required: true, message: '请输入售价', trigger: 'blur' }]
})

/** 暴露方法给父组件 */
const openDrawer = (id: string, name: string) => {
  courtId.value = id
  courtName.value = name
  visible.value = true
  getList()
}

defineExpose({ openDrawer })

/** 获取列表 */
const getList = async () => {
  loading.value = true
  try {
    ruleList.value = await getPriceRuleList(courtId.value)
  } finally {
    loading.value = false
  }
}

/** 格式化星期显示 */
const formatDayOfWeek = (str: string) => {
  if (!str) return []
  return str.split(',').map(val => {
    const target = weekOptions.find(opt => opt.value === val)
    return target ? target.label : val
  })
}

/** 新增按钮 */
const handleAdd = () => {
  reset()
  form.courtId = courtId.value
  dialogTitle.value = '新增定价规则'
  dialogVisible.value = true
}

/** 修改按钮 */
const handleUpdate = async (row: PriceRule) => {
  console.log('Handle Update Clicked:', row)
  reset()
  try {
    const data = await getPriceRuleDetail(row.id!)
    if (data) {
      Object.assign(form, data)
      // 关键：将后端字符串 "1,2,3" 转为 Select 识别的数组
      if (data.dayOfWeek) {
        form.dayOfWeekArr = data.dayOfWeek.split(',')
      }
      dialogTitle.value = '修改定价规则'
      dialogVisible.value = true
    }
  } catch (error) {
    console.error('Fetch Detail Error:', error)
  }
}

/** 提交表单 */
const submitForm = async () => {
  ruleFormRef.value?.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        // 1. 处理星期数据：数组转字符串
        form.dayOfWeek = form.dayOfWeekArr.join(',')
        
        // 2. 关键防御：强制补全 courtId，防止修改时因详情未返回此字段导致更新后数据与场地脱钩
        form.courtId = courtId.value
        
        console.log('正式提交定价规则数据:', JSON.stringify(form))
        
        if (form.id) {
          await updatePriceRule(form)
          ElMessage.success('更新成功')
        } else {
          await addPriceRule(form)
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

/** 删除操作 */
const handleDelete = (row: PriceRule) => {
  console.log('Handle Delete Clicked:', row)
  ElMessageBox.confirm(`确定要删除规则 "${row.ruleName}" 吗？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deletePriceRule(row.id!)
    ElMessage.success('删除成功')
    getList()
  }).catch(() => {
    console.log('Delete canceled')
  })
}

const reset = () => {
  Object.assign(form, {
    id: undefined,
    courtId: '',
    ruleName: '',
    dayOfWeek: '',
    dayOfWeekArr: [],
    startTime: '09:00',
    endTime: '22:00',
    price: 0,
    priority: 1
  })
}
</script>

<style lang="scss" scoped>
.table-toolbar {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
}

.price-text {
  color: #f56c6c;
  font-weight: bold;
}

.mr-1 {
  margin-right: 4px;
  margin-bottom: 4px;
}

.time-range-picker {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  
  .el-form-item {
    margin-bottom: 0;
    flex: 1;
  }
}

.tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>
