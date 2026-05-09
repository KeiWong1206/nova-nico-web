import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as loginApi, LoginParams } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  // 初始化时尝试从本地存储读取用户信息
  const userInfo = ref<any>(JSON.parse(localStorage.getItem('userInfo') || 'null'))
  const permissions = ref<string[]>([])

  // 登录操作
  const login = async (loginForm: LoginParams) => {
    try {
      const data = await loginApi(loginForm)
      const { accessToken, realName, isSuperAdmin, tenantId } = data

      token.value = accessToken
      localStorage.setItem('token', accessToken)

      const info = {
        realName,
        isSuperAdmin,
        tenantId
      }
      userInfo.value = info
      // 持久化保存用户信息
      localStorage.setItem('userInfo', JSON.stringify(info))

      return data
    } catch (error) {
      return Promise.reject(error)
    }
  }

  // 退出登录
  const logout = async () => {
    token.value = ''
    userInfo.value = null
    permissions.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return {
    token,
    userInfo,
    permissions,
    login,
    logout
  }
})
