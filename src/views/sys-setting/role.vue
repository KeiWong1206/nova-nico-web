<template>
  <div class="role-container p-4">
    <el-card shadow="never" class="search-card mb-4">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="角色名称">
          <el-input
            v-model="queryParams.roleName"
            placeholder="请输入角色名称"
            clearable
            @keyup.enter="handleQuery"
          />
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
          <div class="header-title">角色列表</div>
          <el-button
            v-hasPermi="['role:add']"
            type="primary"
            icon="Plus"
            @click="handleAdd"
          >
            新增角色
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="filteredRoleList" border stripe style="width: 100%">
        <el-table-column prop="roleName" label="角色名称" min-width="150" />
        <el-table-column prop="roleCode" label="角色编码" min-width="150" />
        <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="scope">
            <el-button
              v-hasPermi="['role:update']"
              link
              type="primary"
              icon="Edit"
              @click="handleUpdate(scope.row)"
            >
              修改
            </el-button>
            <el-button
              v-hasPermi="['role:grant']"
              link
              type="primary"
              icon="Unlock"
              @click="handlePermission(scope.row)"
            >
              分配权限
            </el-button>
            <el-button
              v-hasPermi="['role:delete']"
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
    </el-card>

    <!-- 新增/修改角色对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      append-to-body
    >
      <el-form ref="roleFormRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="roleCode">
          <el-input v-model="form.roleCode" placeholder="请输入角色编码" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            placeholder="请输入备注内容"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 权限分配抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      :title="`分配权限 - ${currentRole?.roleName}`"
      size="450px"
      destroy-on-close
    >
      <div v-loading="treeLoading" class="p-4 drawer-body">
        <el-tree
          ref="treeRef"
          :data="menuOptions"
          show-checkbox
          node-key="id"
          :props="{ label: 'name', children: 'children' }"
          :check-strictly="false"
          default-expand-all
          highlight-current
        />
      </div>
      <template #footer>
        <div class="p-4 border-t flex justify-end">
          <el-button @click="drawerVisible = false">取消</el-button>
          <el-button type="primary" :loading="grantLoading" @click="submitGrant">保存权限</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules, ElTree } from 'element-plus'
import { 
  getRoleList, 
  addRole, 
  updateRole, 
  deleteRole, 
  getMenuTree, 
  getRoleMenuIds, 
  grantRole,
  RoleVO,
  MenuTreeVO 
} from '@/api/role'

// 状态定义
const loading = ref(false)
const allRoles = ref<RoleVO[]>([])
const queryParams = reactive({
  roleName: ''
})

// 表单状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)
const roleFormRef = ref<FormInstance>()
const form = reactive<RoleVO>({
  id: undefined,
  roleName: '',
  roleCode: '',
  remark: ''
})

const rules = reactive<FormRules>({
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }]
})

// 权限抽屉状态
const drawerVisible = ref(false)
const treeLoading = ref(false)
const grantLoading = ref(false)
const currentRole = ref<RoleVO | null>(null)
const menuOptions = ref<MenuTreeVO[]>([])
const treeRef = ref<InstanceType<typeof ElTree>>()

/** 计算属性实现前端本地搜索过滤 */
const filteredRoleList = computed(() => {
  if (!queryParams.roleName) return allRoles.value
  return allRoles.value.filter(item => 
    item.roleName.toLowerCase().includes(queryParams.roleName.toLowerCase())
  )
})

/** 获取角色列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await getRoleList()
    allRoles.value = data
  } finally {
    loading.value = false
  }
}

/** 搜索与重置 */
const handleQuery = () => {
  // 触发 computed 刷新
}

const resetQuery = () => {
  queryParams.roleName = ''
}

/** 新增角色 */
const handleAdd = () => {
  reset()
  dialogTitle.value = '新增角色'
  dialogVisible.value = true
}

/** 修改角色 */
const handleUpdate = (row: RoleVO) => {
  reset()
  Object.assign(form, row)
  dialogTitle.value = '修改角色'
  dialogVisible.value = true
}

/** 提交表单 */
const submitForm = async () => {
  roleFormRef.value?.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (form.id) {
          await updateRole(form)
          ElMessage.success('更新成功')
        } else {
          await addRole(form)
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

/** 删除角色 */
const handleDelete = (row: RoleVO) => {
  ElMessageBox.confirm(`是否确认删除角色名称为 "${row.roleName}" 的数据项？`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteRole(row.id!)
    getList()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

/** 分配权限逻辑 */
const handlePermission = async (row: RoleVO) => {
  currentRole.value = row
  drawerVisible.value = true
  treeLoading.value = true
  
  try {
    // 1. 获取全量菜单树（如果已缓存可跳过，这里演示直接获取）
    if (menuOptions.value.length === 0) {
      menuOptions.value = await getMenuTree()
    }
    
    // 2. 获取当前角色已有的菜单ID
    const checkedIds = await getRoleMenuIds(row.id!)
    
    // 3. 关键：回显处理。为了防止 Tree 的父子联动机制导致全选
    // 我们需要过滤掉所有非叶子节点，让 Tree 自动根据子节点推算父节点状态
    nextTick(() => {
      const leafKeys = filterLeafIds(menuOptions.value, checkedIds)
      treeRef.value?.setCheckedKeys(leafKeys)
    })
  } finally {
    treeLoading.value = false
  }
}

/** 提交权限分配 */
const submitGrant = async () => {
  if (!currentRole.value) return
  
  grantLoading.value = true
  try {
    // 合并全选节点和半选节点（父节点）
    const checkedKeys = treeRef.value?.getCheckedKeys() as number[]
    const halfCheckedKeys = treeRef.value?.getHalfCheckedKeys() as number[]
    const allSelectedIds = [...checkedKeys, ...halfCheckedKeys]
    
    await grantRole(currentRole.value.id!, allSelectedIds)
    ElMessage.success('权限分配成功')
    drawerVisible.value = false
  } finally {
    grantLoading.value = false
  }
}

/** 递归过滤出所有叶子节点的ID（用于 Tree 正确回显） */
const filterLeafIds = (nodes: MenuTreeVO[], checkedIds: number[]): number[] => {
  const result: number[] = []
  const traverse = (nodeList: MenuTreeVO[]) => {
    nodeList.forEach(node => {
      if (!node.children || node.children.length === 0) {
        // 如果是叶子节点且在已勾选列表中，则加入结果
        if (checkedIds.includes(node.id)) {
          result.push(node.id)
        }
      } else {
        // 递归子节点
        traverse(node.children)
      }
    })
  }
  traverse(nodes)
  return result
}

const reset = () => {
  Object.assign(form, {
    id: undefined,
    roleName: '',
    roleCode: '',
    remark: ''
  })
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.role-container {
  height: 100%;
  
  .search-card {
    border: none;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  }

  .table-card {
    border: none;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    
    .header-title {
      font-size: 16px;
      font-weight: bold;
      color: #333;
    }
  }

  .drawer-body {
    height: calc(100vh - 120px);
    overflow-y: auto;
  }
}

.flex {
  display: flex;
}
.justify-between {
  justify-content: space-between;
}
.items-center {
  align-items: center;
}
.p-4 {
  padding: 1rem;
}
.mb-4 {
  margin-bottom: 1rem;
}
.border-t {
  border-top: 1px solid #f0f2f5;
}
.justify-end {
  justify-content: flex-end;
}
</style>
