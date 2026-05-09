<template>
  <div class="venue-container">
    <el-card class="box-card">
      <!-- 顶部工具栏 -->
      <template #header>
        <div class="card-header">
          <div class="left">
            <span class="title">门店列表</span>
          </div>
          <div class="right">
            <el-button 
              v-hasPermi="['venue:add']"
              type="primary" 
              icon="Plus" 
              @click="handleAdd"
            >
              新增门店
            </el-button>
            <el-button icon="Refresh" @click="getList">刷新</el-button>
          </div>
        </div>
      </template>

      <!-- 数据表格 -->
      <el-table 
        v-loading="loading" 
        :data="venueList" 
        style="width: 100%" 
        stripe
        border
      >
        <el-table-column label="门店Logo" width="100" align="center">
          <template #default="scope">
            <el-image 
              style="width: 50px; height: 50px; border-radius: 4px;"
              :src="scope.row.venueLogo" 
              fit="cover"
            >
              <template #error>
                <div class="image-slot">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </template>
        </el-table-column>
        <el-table-column prop="venueName" label="门店名称" min-width="150" show-overflow-tooltip />
        <el-table-column label="所属区域" width="200">
          <template #default="scope">
            {{ scope.row.province }} {{ scope.row.city }} {{ scope.row.district }}
          </template>
        </el-table-column>
        <el-table-column prop="address" label="详细地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="contactPhone" label="联系电话" width="130" />
        <el-table-column label="营业时间" width="180">
          <template #default="scope">
            {{ scope.row.openTime }} - {{ scope.row.closeTime }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : scope.row.status === 2 ? 'warning' : 'info'">
              {{ scope.row.status === 1 ? '营业中' : scope.row.status === 2 ? '在建中' : '停业' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" sortable />
        
        <!-- 操作列 -->
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="scope">
            <el-button 
              type="primary" 
              link 
              icon="Edit" 
              @click="handleUpdate(scope.row)"
            >
              修改
            </el-button>
            <el-button 
              v-hasPermi="['venue:delete']"
              type="danger" 
              link 
              icon="Delete" 
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 (预留) -->
      <div class="pagination-container">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="venueList.length"
          :page-size="10"
        />
      </div>
    </el-card>

    <!-- 新增/修改表单弹窗 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogType === 'add' ? '新增门店' : '修改门店'" 
      width="700px"
      append-to-body
      @close="resetForm"
    >
      <el-form 
        ref="venueFormRef" 
        :model="form" 
        :rules="rules" 
        label-width="100px"
        class="venue-form"
      >
        <!-- 门店 Logo 上传 -->
        <el-form-item label="门店 Logo" prop="venueLogo">
          <el-upload
            class="avatar-uploader"
            :action="uploadAction"
            :show-file-list="false"
            :headers="uploadHeaders"
            :before-upload="beforeAvatarUpload"
            :on-success="handleAvatarSuccess"
          >
            <img v-if="form.venueLogo" :src="form.venueLogo" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="el-upload__tip">只能上传 jpg/png 文件，且不超过 5MB</div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="门店名称" prop="venueName">
              <el-input v-model="form.venueName" placeholder="请输入门店名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="form.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="省份" prop="province">
              <el-input v-model="form.province" placeholder="省" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="城市" prop="city" label-width="60px">
              <el-input v-model="form.city" placeholder="市" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="区县" prop="district" label-width="60px">
              <el-input v-model="form.district" placeholder="区" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="详细地址" prop="address">
          <el-input 
            v-model="form.address" 
            type="textarea" 
            :rows="2" 
            placeholder="请输入详细地址" 
          />
        </el-form-item>

        <!-- 经纬度选点 -->
        <el-form-item label="经纬度">
          <div style="display: flex; gap: 10px; width: 100%;">
            <el-input v-model="form.longitude" placeholder="经度" readonly>
              <template #prefix>经</template>
            </el-input>
            <el-input v-model="form.latitude" placeholder="纬度" readonly>
              <template #prefix>纬</template>
            </el-input>
            <el-button type="primary" icon="Location" @click="openMapPicker">地图选点</el-button>
          </div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="营业时间" prop="openTime">
              <el-time-select
                v-model="form.openTime"
                start="00:00"
                step="00:30"
                end="23:30"
                placeholder="开始时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="闭店时间" prop="closeTime">
              <el-time-select
                v-model="form.closeTime"
                start="00:00"
                step="00:30"
                end="23:30"
                placeholder="结束时间"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="场馆设施" prop="facilities">
          <el-select
            v-model="form.facilities"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请选择或输入设施(如: 停车场, 淋浴)"
            style="width: 100%"
          >
            <el-option label="停车场" value="停车场" />
            <el-option label="淋浴间" value="淋浴间" />
            <el-option label="更衣室" value="更衣室" />
            <el-option label="空调" value="空调" />
            <el-option label="WIFI" value="WIFI" />
          </el-select>
        </el-form-item>

        <el-form-item label="门店状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">营业中</el-radio>
            <el-radio :label="0">停业</el-radio>
            <el-radio :label="2">在建中</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="门店描述" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入门店描述信息" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="submitForm">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 地图选点弹窗 (真实对接) -->
    <el-dialog 
      v-model="mapDialogVisible" 
      title="地图选点" 
      width="800px"
      append-to-body
      @opened="initMap"
    >
      <div class="map-wrapper">
        <div id="amap-container" style="height: 450px; width: 100%;"></div>
        <div class="map-info-bar" v-if="tempLocation.lng">
          当前选择坐标：<el-tag type="success">{{ tempLocation.lng }}, {{ tempLocation.lat }}</el-tag>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="mapDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="confirmLocation">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'
import { getVenueList, deleteVenue, saveVenue, getVenueById, Venue } from '@/api/venue'
import { useUserStore } from '@/store/modules/user'
import AMapLoader from '@amap/amap-jsapi-loader'

// 高德地图配置 (请替换为您自己的 Key)
// 注意：2.0 API 必须配置安全密钥 JSCODE
window._AMapSecurityConfig = {
  securityJsCode: 'cc112e970a49fea44209e0d2e0a913de', // 例如: 123456...
}
const AMAP_KEY = '2277ebf9dc63b4440fd607376f05ba06' // 例如: abcde123...

// 权限与上传配置
const userStore = useUserStore()
const uploadAction = (import.meta.env.VITE_APP_BASE_API || '/api') + '/tenant/upload/oss'
const uploadHeaders = {
  Authorization: 'Bearer ' + userStore.token
}

// 列表相关状态
const venueList = ref<Venue[]>([])
const loading = ref(false)

// 表单弹窗状态
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'update'>('add')
const submitLoading = ref(false)
const venueFormRef = ref<FormInstance>()

// 地图实例与选点状态
const mapDialogVisible = ref(false)
const tempLocation = reactive({ lng: '', lat: '' })
let mapInstance: any = null
let markerInstance: any = null

/** 初始化地图 */
const initMap = () => {
  AMapLoader.load({
    key: AMAP_KEY,
    version: '2.0',
    plugins: ['AMap.Marker'],
  }).then((AMap) => {
    // 如果已有实例则销毁重创或重置
    if (mapInstance) mapInstance.destroy()
    
    mapInstance = new AMap.Map('amap-container', {
      zoom: 13,
      center: [116.397428, 39.90923], // 默认中心点：北京
    })

    // 如果表单已有经纬度，打开时自动标记
    if (form.longitude && form.latitude) {
      const position = [Number(form.longitude), Number(form.latitude)]
      mapInstance.setCenter(position)
      addMarker(AMap, position)
      tempLocation.lng = form.longitude
      tempLocation.lat = form.latitude
    }

    // 绑定点击事件
    mapInstance.on('click', (e: any) => {
      const lng = e.lnglat.getLng()
      const lat = e.lnglat.getLat()
      tempLocation.lng = lng.toFixed(6)
      tempLocation.lat = lat.toFixed(6)
      addMarker(AMap, [lng, lat])
    })
  }).catch(e => {
    console.error('地图加载失败:', e)
    ElMessage.error('地图加载失败，请检查网络或配置')
  })
}

/** 添加/更新标记点 */
const addMarker = (AMap: any, position: number[]) => {
  if (markerInstance) {
    markerInstance.setPosition(position)
  } else {
    markerInstance = new AMap.Marker({
      position: position,
      map: mapInstance,
    })
  }
}

// 表单对象
const form = reactive<Venue>({
  id: undefined,
  venueName: '',
  venueLogo: '',
  contactPhone: '',
  province: '',
  city: '',
  district: '',
  address: '',
  longitude: '',
  latitude: '',
  openTime: '09:00',
  closeTime: '22:00',
  facilities: [],
  status: 1,
  description: ''
})

// 表单校验规则
const rules = reactive<FormRules>({
  venueName: [{ required: true, message: '请输入门店名称', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的11位手机号', trigger: 'blur' }
  ],
  province: [{ required: true, message: '请输入省份', trigger: 'blur' }],
  city: [{ required: true, message: '请输入城市', trigger: 'blur' }],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
  openTime: [{ required: true, message: '请选择营业时间', trigger: 'change' }],
  closeTime: [{ required: true, message: '请选择闭店时间', trigger: 'change' }]
})

/** 获取列表数据 */
const getList = async () => {
  loading.value = true
  try {
    venueList.value = await getVenueList()
  } finally {
    loading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  if (!venueFormRef.value) return
  venueFormRef.value.resetFields()
  Object.assign(form, {
    id: undefined,
    venueName: '',
    venueLogo: '',
    contactPhone: '',
    province: '',
    city: '',
    district: '',
    address: '',
    longitude: '',
    latitude: '',
    openTime: '09:00',
    closeTime: '22:00',
    facilities: [],
    status: 1,
    description: ''
  })
  // 同时重置临时经纬度
  tempLocation.lng = ''
  tempLocation.lat = ''
  markerInstance = null
}

/** Logo上传前的校验 */
const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
  if (!allowedTypes.includes(rawFile.type)) {
    ElMessage.error('只能上传 JPG/PNG 格式的图片!')
    return false
  } else if (rawFile.size / 1024 / 1024 > 5) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

/** Logo上传成功回调 */
const handleAvatarSuccess: UploadProps['onSuccess'] = (response) => {
  // 兼容：如果 response 是字符串则直接使用；如果是对象则取其 data 属性
  const url = typeof response === 'string' ? response : response.data
  if (url) {
    form.venueLogo = url
    ElMessage.success('Logo 上传成功')
  } else {
    console.warn('上传接口返回格式异常:', response)
  }
}

/** 打开地图选点 */
const openMapPicker = () => {
  mapDialogVisible.value = true
}

/** 确认地图选点 */
const confirmLocation = () => {
  if (!tempLocation.lng) {
    ElMessage.warning('请先在地图上点击选择一个位置')
    return
  }
  form.longitude = tempLocation.lng
  form.latitude = tempLocation.lat
  mapDialogVisible.value = false
  ElMessage.success('位置获取成功')
}

/** 新增按钮 */
const handleAdd = () => {
  dialogType.value = 'add'
  dialogVisible.value = true
}

/** 修改按钮 */
const handleUpdate = async (row: Venue) => {
  dialogType.value = 'update'
  loading.value = true
  try {
    const detail = await getVenueById(row.id!)
    Object.assign(form, detail)
    dialogVisible.value = true
  } finally {
    loading.value = false
  }
}

/** 提交表单 */
const submitForm = async () => {
  if (!venueFormRef.value) return
  await venueFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        await saveVenue(form)
        ElMessage.success(dialogType.value === 'add' ? '新增成功' : '修改成功')
        dialogVisible.value = false
        getList()
      } finally {
        submitLoading.value = false
      }
    }
  })
}

/** 删除操作 */
const handleDelete = (row: Venue) => {
  ElMessageBox.confirm(
    `确定要删除门店 "${row.venueName}" 吗？`,
    '系统警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    await deleteVenue(row.id!)
    ElMessage.success('删除成功')
    getList()
  }).catch(() => {})
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.venue-container {
  .box-card {
    border: none;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }
    }
  }

  .pagination-container {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}

.venue-form {
  padding: 10px 20px 0;
}

/* Avatar Uploader 样式 */
.avatar-uploader {
  :deep(.el-upload) {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);
    width: 100px;
    height: 100px;
    display: flex;
    justify-content: center;
    align-items: center;

    &:hover {
      border-color: var(--el-color-primary);
    }
  }
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
}

/* 地图样式 */
.map-wrapper {
  position: relative;
  #amap-container {
    border: 1px solid #e4e7ed;
    border-radius: 8px;
  }
  .map-info-bar {
    margin-top: 15px;
    padding: 10px;
    background: #fdf6ec;
    border-left: 5px solid #e6a23c;
    font-size: 14px;
    color: #606266;
  }
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 20px;
}
</style>
