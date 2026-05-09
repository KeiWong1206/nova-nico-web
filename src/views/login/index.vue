<template>
  <div class="login-container">
    <div class="login-box">
      <!-- 左右两列布局：左侧信息区/背景图，右侧表单 -->
      <div class="login-left">
        <div class="welcome-text">
          <h2>欢迎使用</h2>
          <p>多馆复合型体育场馆管理系统</p>
        </div>
      </div>
      <div class="login-right">
        <div class="form-wrapper">
          <div class="logo-area">
            <el-icon class="sys-logo"><Briefcase /></el-icon>
            <h3>租户登录</h3>
          </div>
          
          <el-form 
            ref="loginFormRef" 
            :model="loginForm" 
            :rules="loginRules" 
            class="login-form"
            @keyup.enter="handleLogin"
          >
            <el-form-item prop="username">
              <el-input 
                v-model="loginForm.username" 
                placeholder="请输入11位手机号" 
                size="large"
                :prefix-icon="'User'"
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input 
                v-model="loginForm.password" 
                type="password" 
                placeholder="请输入密码" 
                size="large"
                show-password
                :prefix-icon="'Lock'"
              />
            </el-form-item>

            <div class="form-options">
              <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
              <el-link type="primary" :underline="false">忘记密码？</el-link>
            </div>

            <el-form-item>
              <el-button 
                :loading="loading" 
                type="primary" 
                class="login-btn" 
                size="large" 
                @click.prevent="handleLogin"
              >
                立即登录
              </el-button>
            </el-form-item>

            <div class="login-links">
              <el-link type="info" :underline="false">租户注册</el-link>
              <el-divider direction="vertical" />
              <el-link type="info" :underline="false">租户接收人</el-link>
            </div>
          </el-form>
        </div>
        <div class="copyright">
          Copyright © 2026 体育场馆管理系统 All Rights Reserved.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

// 用户名验证
const checkUsername = (rule: any, value: string, callback: any) => {
  if (!value) {
    return callback(new Error('用户名不能为空'))
  }
  callback()
}

const loginRules = reactive<FormRules>({
  username: [
    { required: true, validator: checkUsername, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '密码不能为空', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ]
})

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        await userStore.login({
          username: loginForm.username,
          password: loginForm.password
        })
        ElMessage.success('登录成功')
        const redirect = route.query.redirect as string || '/'
        router.push(redirect)
      } catch (error: any) {
        ElMessage.error(error.message || '登录失败')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1890ff 0%, #001529 100%);
  
  .login-box {
    width: 900px;
    height: 500px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
    display: flex;
    overflow: hidden;

    .login-left {
      flex: 1;
      background: linear-gradient(180deg, #1890ff 0%, #002140 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      
      .welcome-text {
        text-align: center;
        h2 {
          font-size: 36px;
          margin-bottom: 20px;
          font-weight: 600;
          letter-spacing: 2px;
        }
        p {
          font-size: 18px;
          opacity: 0.8;
          letter-spacing: 1px;
        }
      }
    }

    .login-right {
      width: 450px;
      padding: 40px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .form-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;

        .logo-area {
          text-align: center;
          margin-bottom: 40px;
          
          .sys-logo {
            font-size: 48px;
            color: #1890ff;
            margin-bottom: 10px;
          }
          h3 {
            margin: 0;
            font-size: 24px;
            color: #333;
            font-weight: 500;
          }
        }

        .login-form {
          .form-options {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }

          .login-btn {
            width: 100%;
            height: 44px;
            font-size: 16px;
            border-radius: 4px;
            letter-spacing: 4px;
          }

          .login-links {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 10px;
          }
        }
      }

      .copyright {
        text-align: center;
        font-size: 12px;
        color: #999;
      }
    }
  }
}
</style>
