import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import router from '@/router'

// 创建 Axios 实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API || '/api', // 后端接口前缀占位
  timeout: 10000 // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 每次请求前获取最新 Token 并携带在 Headers 中
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers['Authorization'] = `Bearer ${userStore.token}`
    }
    return config
  },
  (error: AxiosError) => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data

    // 如果接口返回二进制文件
    if (response.request.responseType === 'blob' || response.request.responseType === 'arraybuffer') {
      return response.data
    }

    // 后端统一个返回结构：{ code, msg, data }
    // 假设 200 是唯一成功码，或者是 20000 兼容旧版本
    if (res.code !== 200 && res.code !== 20000) {
      // 业务报错提示
      ElMessage.error(res.msg || res.message || '操作失败')

      // 401: Token 过期或未登录
      if (res.code === 401) {
        ElMessageBox.confirm('您的登录已过期，请重新登录', '系统提示', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          const userStore = useUserStore()
          userStore.logout().then(() => {
            location.reload()
          })
        })
      }
      return Promise.reject(new Error(res.msg || res.message || 'Error'))
    } else {
      // 只要 code 等于 200，就直接返回 data 核心数据，简化页面调用
      return res.data
    }
  },
  (error: AxiosError) => {
    console.error('Response Error:', error)
    const { response } = error
    if (response) {
      switch (response.status) {
        case 401:
          ElMessage.error('登录状态已过期，请重新登录')
          const userStore = useUserStore()
          userStore.logout().then(() => {
            router.push(`/login?redirect=${router.currentRoute.value.fullPath}`)
          })
          break
        case 403:
          ElMessage.error('拒绝访问，您没有此权限')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误，请联系管理员')
          break
        default:
          ElMessage.error(error.message || '网络请求错误')
      }
    } else {
      ElMessage.error('网络连接异常，请检查您的网络')
    }
    return Promise.reject(error)
  }
)

export default service
