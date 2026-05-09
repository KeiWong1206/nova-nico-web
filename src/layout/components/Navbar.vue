<template>
  <div class="navbar">
    <div class="left-menu">
      <el-breadcrumb separator="/" class="breadcrumb-container">
        <transition-group name="breadcrumb">
          <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="item.path">
            <span v-if="item.redirect === 'noRedirect' || index === breadcrumbs.length - 1" class="no-redirect">
              {{ item.meta.title }}
            </span>
            <a v-else @click.prevent="handleLink(item)">{{ item.meta.title }}</a>
          </el-breadcrumb-item>
        </transition-group>
      </el-breadcrumb>
    </div>

    <div class="right-menu">
      <el-dropdown class="avatar-container" trigger="click">
        <div class="avatar-wrapper">
          <el-avatar size="small" style="background-color: #409eff; color: white; margin-right: 8px;">
            {{ userStore.userInfo?.realName?.[0] || 'U' }}
          </el-avatar>
          <span class="user-name">{{ userStore.userInfo?.realName || '张亮-租户资源' }}</span>
          <!-- 身份标识 -->
          <el-tag 
            v-if="userStore.userInfo?.isSuperAdmin" 
            size="small" 
            type="danger" 
            effect="dark"
            class="role-tag"
          >
            超级管理员
          </el-tag>
          <el-tag 
            v-else 
            size="small" 
            type="success" 
            effect="plain"
            class="role-tag"
          >
            普通员工
          </el-tag>
          <el-icon class="el-icon--right"><CaretBottom /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="user-dropdown">
            <router-link to="/">
              <el-dropdown-item>工作台</el-dropdown-item>
            </router-link>
            <a target="_blank" href="https://github.com/">
              <el-dropdown-item>项目地址</el-dropdown-item>
            </a>
            <el-dropdown-item divided @click="logout">
              <span style="display:block;">退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const breadcrumbs = ref<any[]>([])

const getBreadcrumb = () => {
  let matched = route.matched.filter(item => item.meta && item.meta.title)
  // 如果首个不是工作台，可以补一个
  const first = matched[0]
  if (first && first.name !== 'dashboard' && first.path !== '') {
    matched = [{ path: '/dashboard', meta: { title: '首页' } } as any].concat(matched)
  }
  breadcrumbs.value = matched.filter(item => item.meta && item.meta.title && item.meta.breadcrumb !== false)
}

watch(
  () => route.path,
  () => {
    getBreadcrumb()
  },
  { immediate: true }
)

const handleLink = (item: any) => {
  const { redirect, path } = item
  if (redirect) {
    router.push(redirect)
    return
  }
  router.push(path)
}

const logout = async () => {
  await userStore.logout()
  router.push(`/login?redirect=${route.fullPath}`)
}
</script>

<style lang="scss" scoped>
.navbar {
  height: 60px;
  overflow: hidden;
  position: relative;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;

  .left-menu {
    display: flex;
    align-items: center;
    .breadcrumb-container {
      font-size: 14px;
      line-height: 60px;
      margin-left: 8px;

      .no-redirect {
        color: #97a8be;
        cursor: text;
      }
    }
  }

  .right-menu {
    display: flex;
    align-items: center;

    .avatar-container {
      margin-right: 10px;
      cursor: pointer;

      .avatar-wrapper {
        display: flex;
        align-items: center;
        padding: 0 8px;
        transition: background .3s;
        border-radius: 4px;

        &:hover {
          background: rgba(0, 0, 0, .025);
        }

        .user-name {
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }

        .role-tag {
          margin-left: 8px;
          cursor: pointer;
        }
      }
    }
  }
}
</style>
