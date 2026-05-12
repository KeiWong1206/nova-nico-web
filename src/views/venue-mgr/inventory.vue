<template>
  <div class="inventory-container p-4">
    <!-- 搜索区 -->
    <el-card shadow="never" class="search-card mb-4">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <!-- 只有超管能切换场馆 -->
        <el-form-item label="所属场馆" v-if="userStore.userInfo?.isSuperAdmin">
          <el-select 
            v-model="queryParams.venueId" 
            placeholder="请选择场馆" 
            clearable 
            style="width: 200px"
            @change="handleVenueChange"
          >
            <el-option 
              v-for="item in venueOptions" 
              :key="item.id" 
              :label="item.venueName" 
              :value="item.id" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="所属场地">
          <el-select 
            v-model="queryParams.courtId" 
            placeholder="请选择场地" 
            clearable 
            style="width: 180px"
            :disabled="!queryParams.venueId"
          >
            <el-option 
              v-for="item in courtOptions" 
              :key="item.id" 
              :label="item.name" 
              :value="item.id" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="库存日期">
          <div class="flex items-center gap-2">
            <el-date-picker
              v-model="queryParams.inventoryDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              :clearable="false"
              style="width: 160px"
              @change="handleQuery"
            />
            <el-button-group>
              <el-button icon="ArrowLeft" @click="handleDateOffset(-1)" />
              <el-button icon="ArrowRight" @click="handleDateOffset(1)" />
            </el-button-group>
          </div>
        </el-form-item>

        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="锁定" :value="0" />
            <el-option label="可售" :value="1" />
            <el-option label="已售" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleQuery">查询</el-button>
          <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表区 -->
    <el-card shadow="never" class="table-card">
      <el-table v-loading="loading" :data="inventoryList" border stripe style="width: 100%">
        <el-table-column prop="inventoryDate" label="库存日期" width="120" align="center" />
        <el-table-column label="时段" width="180" align="center">
          <template #default="scope">
            <span class="font-mono">{{ scope.row.startTime }} - {{ scope.row.endTime }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="venueName" label="所属场馆" min-width="150" show-overflow-tooltip />
        <el-table-column prop="courtName" label="所属场地" min-width="120" show-overflow-tooltip />
        <el-table-column label="售价" width="120" align="center">
          <template #default="scope">
            <span class="price-text text-lg font-bold">¥ {{ scope.row.price?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)" effect="dark">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="scope">
            <el-button 
              link 
              type="primary" 
              icon="PriceTag" 
              @click="handleUpdatePrice(scope.row)"
            >
              改价
            </el-button>
            <el-button 
              link 
              :type="scope.row.status === 0 ? 'success' : 'warning'" 
              :icon="scope.row.status === 0 ? 'Unlock' : 'Lock'"
              @click="handleStatusChange(scope.row)"
            >
              {{ scope.row.status === 0 ? '解锁' : '锁定' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getInventoryPage, 
  InventoryVO, 
  changeInventoryStatus, 
  updateInventoryPrice 
} from '@/api/inventory'
import { getVenueList, Venue } from '@/api/venue'
import { getCourtPage } from '@/api/court'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

// 获取今天日期
const getToday = () => dayjs().format('YYYY-MM-DD')

// 状态字典
const statusMap: Record<number, { label: string; type: string }> = {
  0: { label: '锁定', type: 'danger' },
  1: { label: '可售', type: 'success' },
  2: { label: '已售', type: 'info' }
}

// 响应式数据
const loading = ref(false)
const inventoryList = ref<InventoryVO[]>([])
const total = ref(0)
const venueOptions = ref<Venue[]>([])
const courtOptions = ref<any[]>([])

const queryParams = reactive({
  pageNum: 1,
  pageSize: 20,
  venueId: undefined as any,
  courtId: undefined as any,
  status: undefined as any,
  inventoryDate: getToday()
})

/** 加载场馆列表 */
const loadVenues = async () => {
  try {
    const data = await getVenueList()
    venueOptions.value = data.map(item => {
      const actualId = item.id || (item as any).venueId
      return { ...item, id: actualId ? String(actualId) : '' }
    })
    
    // 非超管逻辑：自动锁定第一个场馆并加载其场地
    if (!userStore.userInfo?.isSuperAdmin && venueOptions.value.length > 0) {
      queryParams.venueId = venueOptions.value[0].id
      handleVenueChange(queryParams.venueId)
    }
  } catch (error) {
    console.error('加载场馆列表失败', error)
  }
}

/** 场馆变更逻辑 */
const handleVenueChange = async (val: any) => {
  queryParams.courtId = undefined
  courtOptions.value = []
  if (val) {
    try {
      const res = await getCourtPage({ venueId: String(val), pageNum: 1, pageSize: 100 })
      courtOptions.value = res.records
    } catch (error) {}
  }
}

/** 日期快捷切换 */
const handleDateOffset = (offset: number) => {
  queryParams.inventoryDate = dayjs(queryParams.inventoryDate).add(offset, 'day').format('YYYY-MM-DD')
  handleQuery()
}

/** 获取列表数据 */
const getList = async () => {
  loading.value = true
  try {
    const data = await getInventoryPage(queryParams)
    inventoryList.value = data.records
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 查询与重置 */
const handleQuery = () => {
  queryParams.pageNum = 1
  getList()
}

const resetQuery = () => {
  queryParams.venueId = undefined
  queryParams.courtId = undefined
  queryParams.status = undefined
  queryParams.inventoryDate = getToday()
  courtOptions.value = []
  
  // 非管理员重置后，需要重新锁定场馆
  if (!userStore.userInfo?.isSuperAdmin && venueOptions.value.length > 0) {
    queryParams.venueId = venueOptions.value[0].id
    handleVenueChange(queryParams.venueId)
  }
  
  handleQuery()
}

// 状态映射函数
const getStatusLabel = (status: number) => statusMap[status]?.label || '未知'
const getStatusTag = (status: number) => statusMap[status]?.type || 'info'

/** 锁定/解锁状态切换 */
const handleStatusChange = (row: InventoryVO) => {
  const isLock = row.status !== 0
  const actionText = isLock ? '锁定' : '解锁'
  const targetStatus = isLock ? 0 : 1

  ElMessageBox.confirm(`确定要${actionText}该时段的库存吗？`, '系统提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: isLock ? 'warning' : 'success'
  }).then(async () => {
    try {
      await changeInventoryStatus(row.id, targetStatus)
      ElMessage.success(`${actionText}成功`)
      getList()
    } catch (error) {}
  }).catch(() => {})
}

/** 改价逻辑 */
const handleUpdatePrice = (row: InventoryVO) => {
  ElMessageBox.prompt('请输入新的销售价格', '修改价格', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^\d+(\.\d{1,2})?$/,
    inputErrorMessage: '请输入有效的价格数字',
    inputValue: String(row.price)
  }).then(async ({ value }) => {
    try {
      await updateInventoryPrice(row.id, Number(value))
      ElMessage.success('价格修改成功')
      getList()
    } catch (error) {}
  }).catch(() => {})
}

onMounted(async () => {
  loading.value = true
  try {
    await loadVenues()
    await getList()
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.inventory-container {
  .search-card, .table-card { border: none; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05); }
  .price-text { color: #f56c6c; }
  .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  .flex { display: flex; }
  .items-center { align-items: center; }
  .gap-2 { gap: 0.5rem; }
  .justify-end { justify-content: flex-end; }
  .mt-4 { margin-top: 1rem; }
}
:deep(.el-button-group) { .el-button { padding: 8px 12px; } }
</style>
