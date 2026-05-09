<template>
  <div class="employee-container p-4">
    <!-- 搜索区 -->
    <el-card shadow="never" class="search-card mb-4">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="关键字">
          <el-input
            v-model="queryParams.keyword"
            placeholder="请输入姓名或手机号"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="账号状态" clearable style="width: 120px">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="flex justify-between items-center">
          <div class="header-title">员工列表</div>
          <el-button
            v-hasPermi="['employee:add']"
            type="primary"
            icon="Plus"
            @click="handleAdd"
          >
            新增员工
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="employeeList" border stripe style="width: 100%">
        <el-table-column prop="realName" label="姓名" min-width="120">
          <template #default="scope">
            <span class="mr-2">{{ scope.row.realName }}</span>
            <el-tag v-if="scope.row.isSuperAdmin === 1" type="danger" size="small" effect="dark">
              超级管理员
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="账号" min-width="120" />
        <el-table-column prop="phone" label="手机号" min-width="120" />
        <el-table-column prop="venueName" label="所属门店" min-width="150">
          <template #default="scope">
            {{ scope.row.venueName || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="拥有角色" min-width="180">
          <template #default="scope">
            <div class="flex flex-wrap gap-1">
              <el-tag 
                v-for="role in scope.row.roleNames" 
                :key="role" 
                size="small"
              >
                {{ role }}
              </el-tag>
              <span v-if="!scope.row.roleNames?.length">-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="1"
              :inactive-value="0"
              :disabled="scope.row.isSuperAdmin === 1"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" align="center">
          <template #default="scope">
            {{ scope.row.createTime ? scope.row.createTime.replace('T', ' ') : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" align="center" fixed="right">
          <template #default="scope">
            <template v-if="scope.row.isSuperAdmin !== 1">
              <el-button
                v-hasPermi="['employee:update']"
                link
                type="primary"
                icon="Edit"
                @click="handleUpdate(scope.row)"
              >
                修改
              </el-button>
              <el-button
                v-hasPermi="['employee:delete']"
                link
                type="danger"
                icon="Delete"
                @click="handleDelete(scope.row)"
              >
                删除
              </el-button>
            </template>
            <span v-else class="text-gray-400 text-xs">系统内置不可操作</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/修改对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="550px"
      append-to-body
    >
      <el-form ref="employeeFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="姓名" prop="realName">
          <el-input v-model="form.realName" placeholder="请输入员工真实姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input 
            v-model="form.phone" 
            placeholder="请输入11位手机号" 
            :disabled="!!form.id"
          />
          <div v-if="!form.id" class="form-tip">默认密码为手机号后6位</div>
        </el-form-item>
        <el-form-item label="所属门店" prop="venueId">
          <el-select v-model="form.venueId" placeholder="请选择所属门店" style="width: 100%" clearable>
            <el-option
              v-for="item in venueOptions"
              :key="item.id"
              :label="item.venueName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分配角色" prop="roleIds">
          <el-select
            v-model="form.roleIds"
            multiple
            placeholder="请分配员工角色"
            style="width: 100%"
          >
            <el-option
              v-for="item in roleOptions"
              :key="item.id"
              :label="item.roleName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.id" label="账号状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
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
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { 
  getEmployeePage, 
  getEmployeeDetail, 
  addEmployee, 
  updateEmployee, 
  deleteEmployee,
  EmployeeVO 
} from '@/api/employee'
import { getVenueList, Venue } from '@/api/venue'
import { getRoleList, RoleVO } from '@/api/role'

// 状态定义
const loading = ref(false)
const submitLoading = ref(false)
const employeeList = ref<EmployeeVO[]>([])
const total = ref(0)

const venueOptions = ref<Venue[]>([])
const roleOptions = ref<RoleVO[]>([])

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  keyword: '',
  status: undefined
})

// 表单状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const employeeFormRef = ref<FormInstance>()
const form = reactive<EmployeeVO>({
  id: undefined,
  realName: '',
  phone: '',
  venueId: undefined,
  roleIds: [],
  status: 1
})

const rules = reactive<FormRules>({
  realName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  roleIds: [{ required: true, message: '请至少分配一个角色', trigger: 'change' }]
})

/** 获取员工列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await getEmployeePage(queryParams)
    employeeList.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 获取联动字典数据 */
const getOptions = async () => {
  try {
    // 并行获取门店和角色列表
    const [venues, roles] = await Promise.all([
      getVenueList(),
      getRoleList()
    ])
    venueOptions.value = venues
    roleOptions.value = roles
  } catch (error) {
    console.error('获取基础数据失败', error)
  }
}

/** 搜索与重置 */
const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

const resetQuery = () => {
  queryParams.keyword = ''
  queryParams.status = undefined
  handleQuery()
}

/** 新增按钮 */
const handleAdd = () => {
  reset()
  dialogTitle.value = '新增员工'
  dialogVisible.value = true
}

/** 修改按钮 */
const handleUpdate = async (row: EmployeeVO) => {
  reset()
  try {
    const data = await getEmployeeDetail(row.id!)
    Object.assign(form, data)
    dialogTitle.value = '修改员工'
    dialogVisible.value = true
  } catch (error) {}
}

/** 提交表单 */
const submitForm = async () => {
  employeeFormRef.value?.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (form.id) {
          await updateEmployee(form)
          ElMessage.success('更新成功')
        } else {
          await addEmployee(form)
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

/** 状态修改（Switch快捷切换） */
const handleStatusChange = async (row: EmployeeVO) => {
  try {
    // 调用更新接口，仅更新关键字段（后端通常支持部分更新或VO全字段）
    await updateEmployee({
      id: row.id,
      realName: row.realName,
      phone: row.phone,
      status: row.status,
      roleIds: row.roleIds || [],
      venueId: row.venueId
    })
    ElMessage.success('状态修改成功')
  } catch (error) {
    // 失败时回滚前端状态
    row.status = row.status === 1 ? 0 : 1
  }
}

/** 删除操作 */
const handleDelete = (row: EmployeeVO) => {
  ElMessageBox.confirm(`是否确认删除员工 "${row.realName}"？该操作不可恢复。`, '系统警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteEmployee(row.id!)
    getList()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

/** 分页处理 */
const handleSizeChange = (val: number) => {
  queryParams.pageSize = val
  getList()
}
const handleCurrentChange = (val: number) => {
  queryParams.pageNum = val
  getList()
}

const reset = () => {
  // 1. 彻底重置表单对象数据，确保没有旧数据残留
  form.id = undefined
  form.realName = ''
  form.phone = ''
  form.venueId = undefined
  form.roleIds = []
  form.status = 1
  
  // 2. 清除表单校验状态
  nextTick(() => {
    employeeFormRef.value?.clearValidate()
  })
}

onMounted(() => {
  getList()
  getOptions()
})
</script>

<style lang="scss" scoped>
.employee-container {
  .search-card, .table-card {
    border: none;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  }

  .header-title {
    font-size: 16px;
    font-weight: bold;
    color: #333;
  }

  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    line-height: 1;
  }

  .flex-wrap {
    flex-wrap: wrap;
  }
  .gap-1 {
    gap: 4px;
  }
  .mr-2 {
    margin-right: 8px;
  }
  .text-gray-400 {
    color: #c0c4cc;
  }
  .text-xs {
    font-size: 12px;
  }
}
</style>
