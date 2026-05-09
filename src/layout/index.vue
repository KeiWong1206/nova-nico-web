<template>
  <div class="app-wrapper">
    <!-- 左侧侧边栏 -->
    <div class="sidebar-container">
      <div class="logo-container">
        <el-icon class="logo-icon"><Briefcase /></el-icon>
        <transition name="fade">
          <h1 class="logo-title">场馆管理系统</h1>
        </transition>
      </div>
      <Sidebar />
    </div>

    <!-- 右侧主内容区 -->
    <div class="main-container">
      <div class="header-container">
        <Navbar />
      </div>
      <AppMain />
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './components/Sidebar/index.vue'
import Navbar from './components/Navbar.vue'
import AppMain from './components/AppMain.vue'
</script>

<style lang="scss" scoped>
.app-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
}

.sidebar-container {
  transition: width 0.28s;
  width: 220px;
  background-color: #001529;
  height: 100%;
  position: fixed;
  font-size: 0px;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1001;
  overflow: hidden;
  box-shadow: 2px 0 6px rgba(0,21,41,0.35);

  .logo-container {
    height: 60px;
    line-height: 60px;
    background: #002140;
    text-align: center;
    overflow: hidden;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;

    .logo-icon {
      font-size: 24px;
      color: #1890ff;
      margin-right: 12px;
    }

    .logo-title {
      display: inline-block;
      margin: 0;
      color: #fff;
      font-weight: 600;
      line-height: 60px;
      font-size: 16px;
      font-family: Avenir, Helvetica Neue, Arial, Helvetica, sans-serif;
      vertical-align: middle;
    }
  }
}

.main-container {
  min-height: 100%;
  transition: margin-left .28s;
  margin-left: 220px;
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;

  .header-container {
    height: 60px;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,21,41,0.08);
    position: relative;
    z-index: 10;
  }
}
</style>
