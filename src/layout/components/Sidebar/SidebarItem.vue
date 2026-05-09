<template>
  <div v-if="!item.meta?.hidden" class="menu-wrapper">
    <!-- 没有子路由，直接渲染 el-menu-item -->
    <template v-if="!item.children || item.children.length === 0">
      <el-menu-item :index="resolvePath(item.path)" @click="handleClick(resolvePath(item.path))">
        <el-icon v-if="item.meta?.icon">
          <component :is="item.meta.icon" />
        </el-icon>
        <template #title>
          <span>{{ item.meta?.title }}</span>
        </template>
      </el-menu-item>
    </template>

    <!-- 有子路由，渲染 el-sub-menu -->
    <el-sub-menu v-else :index="resolvePath(item.path)">
      <template #title>
        <el-icon v-if="item.meta?.icon">
          <component :is="item.meta.icon" />
        </el-icon>
        <span>{{ item.meta?.title }}</span>
      </template>
      <sidebar-item
        v-for="child in item.children"
        :key="child.path"
        :item="child"
        :base-path="resolvePath(item.path)"
      />
    </el-sub-menu>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  basePath: {
    type: String,
    default: ''
  }
})

const router = useRouter()

// 拼接完整的路径
const resolvePath = (routePath: string) => {
  // 简单处理，如果 routePath 是以 / 开头，说明是绝对路径
  if (routePath.startsWith('/')) {
    return routePath
  }
  // 如果是空，直接返回父路径
  if (!routePath) {
    return props.basePath
  }
  return `${props.basePath}/${routePath}`.replace(/\/\//g, '/')
}

const handleClick = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.menu-wrapper {
  /* ... */
}
</style>
