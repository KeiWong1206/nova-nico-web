<template>
  <div class="common-template">
    <el-empty :description="`待开发：当前路径 ${$route.path}`">
      <template #image>
        <el-icon :size="60" color="#409eff"><Compass /></el-icon>
      </template>
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
// 这是一个占位用的组件，专门用来展示未开发页面的路径
</script>

<style scoped>
.common-template {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,21,41,0.08);
}
</style>
