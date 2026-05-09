<template>
  <el-scrollbar wrap-class="scrollbar-wrapper">
    <el-menu
      :default-active="activeMenu"
      :background-color="variables.menuBg"
      :text-color="variables.menuText"
      :unique-opened="false"
      :active-text-color="variables.menuActiveText"
      mode="vertical"
    >
      <sidebar-item
        v-for="route in permissionStore.routes"
        :key="route.path"
        :item="route"
        :base-path="route.path"
      />
    </el-menu>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePermissionStore } from '@/store/modules/permission'
import SidebarItem from './SidebarItem.vue'

const route = useRoute()
const permissionStore = usePermissionStore()

// 样式变量 (模拟 scss 变量注入)
const variables = {
  menuBg: '#001529',
  menuText: '#bfcbd9',
  menuActiveText: '#409EFF'
}

const activeMenu = computed(() => {
  const { meta, path } = route
  // 这里以后可以处理 activeMenu 逻辑，如果是隐藏路由高亮父级等
  return path
})
</script>

<style lang="scss" scoped>
:deep(.el-menu) {
  border-right: none;
}
:deep(.el-scrollbar__wrap) {
  overflow-x: hidden !important;
}
</style>
