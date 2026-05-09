<template>
  <div class="dashboard-container">
    <!-- 顶部数据卡片 -->
    <el-row :gutter="20" class="panel-group">
      <el-col :span="6" class="card-panel-col">
        <div class="card-panel">
          <div class="card-panel-icon-wrapper icon-money">
            <el-icon><Money /></el-icon>
          </div>
          <div class="card-panel-description">
            <div class="card-panel-text">总营收</div>
            <div class="card-panel-num">¥ 128,500</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6" class="card-panel-col">
        <div class="card-panel">
          <div class="card-panel-icon-wrapper icon-shopping">
            <el-icon><ShoppingCart /></el-icon>
          </div>
          <div class="card-panel-description">
            <div class="card-panel-text">订单数</div>
            <div class="card-panel-num">8,124</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6" class="card-panel-col">
        <div class="card-panel">
          <div class="card-panel-icon-wrapper icon-people">
            <el-icon><User /></el-icon>
          </div>
          <div class="card-panel-description">
            <div class="card-panel-text">新增租户</div>
            <div class="card-panel-num">125</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6" class="card-panel-col">
        <div class="card-panel">
          <div class="card-panel-icon-wrapper icon-message">
            <el-icon><DataLine /></el-icon>
          </div>
          <div class="card-panel-description">
            <div class="card-panel-text">今日活跃度</div>
            <div class="card-panel-num">89%</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 中间图表区 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>各项目营收统计</span>
            </div>
          </template>
          <div ref="barChartRef" style="height: 350px; width: 100%;"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>租户续租率</span>
            </div>
          </template>
          <div ref="pieChartRef" style="height: 350px; width: 100%;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 底部数据表格 -->
    <el-row style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>近期大额销售记录</span>
            </div>
          </template>
          <el-table :data="tableData" style="width: 100%" stripe>
            <el-table-column prop="date" label="近期时间" width="180" />
            <el-table-column prop="venue" label="场地" width="180" />
            <el-table-column prop="amount" label="总营收 (¥)" />
            <el-table-column prop="orderCount" label="订单数" />
            <el-table-column prop="tenantTime" label="租户大额时间" width="220" />
            <el-table-column prop="renewTime" label="续租时间" width="180" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const barChartRef = ref<HTMLElement | null>(null)
const pieChartRef = ref<HTMLElement | null>(null)
let barChartInstance: echarts.ECharts | null = null
let pieChartInstance: echarts.ECharts | null = null

// Mock 表格数据
const tableData = [
  { date: '2026-05-08', venue: '1号篮球馆', amount: '12,000.00', orderCount: 24, tenantTime: '2026-05-08 14:00 - 18:00', renewTime: '12个月' },
  { date: '2026-05-07', venue: 'VIP羽毛球场', amount: '8,500.00', orderCount: 16, tenantTime: '2026-05-07 09:00 - 12:00', renewTime: '6个月' },
  { date: '2026-05-06', venue: '奥体游泳中心', amount: '25,600.00', orderCount: 128, tenantTime: '全天包场', renewTime: '全年' },
  { date: '2026-05-05', venue: '室外网球场A', amount: '4,200.00', orderCount: 8, tenantTime: '2026-05-05 18:00 - 22:00', renewTime: '3个月' },
]

const initBarChart = () => {
  if (barChartRef.value) {
    barChartInstance = echarts.init(barChartRef.value)
    const option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: [
        {
          type: 'category',
          data: ['篮球', '游泳', '羽毛球', '网球', '乒乓球', '健身房'],
          axisTick: { alignWithLabel: true }
        }
      ],
      yAxis: [{ type: 'value' }],
      series: [
        {
          name: '营收(元)',
          type: 'bar',
          barWidth: '40%',
          data: [35000, 52000, 20000, 15000, 8000, 45000],
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          }
        }
      ]
    }
    barChartInstance.setOption(option)
  }
}

const initPieChart = () => {
  if (pieChartRef.value) {
    pieChartInstance = echarts.init(pieChartRef.value)
    const option = {
      tooltip: { trigger: 'item' },
      legend: { bottom: '5%', left: 'center' },
      series: [
        {
          name: '租户续租率',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: 20, fontWeight: 'bold' }
          },
          labelLine: { show: false },
          data: [
            { value: 1048, name: '已续租', itemStyle: { color: '#67C23A' } },
            { value: 300, name: '未续租', itemStyle: { color: '#F56C6C' } },
            { value: 150, name: '流失', itemStyle: { color: '#909399' } }
          ]
        }
      ]
    }
    pieChartInstance.setOption(option)
  }
}

const resizeCharts = () => {
  barChartInstance?.resize()
  pieChartInstance?.resize()
}

onMounted(() => {
  initBarChart()
  initPieChart()
  window.addEventListener('resize', resizeCharts)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeCharts)
  barChartInstance?.dispose()
  pieChartInstance?.dispose()
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 0;

  .panel-group {
    .card-panel-col {
      margin-bottom: 0;
    }

    .card-panel {
      height: 108px;
      cursor: pointer;
      font-size: 12px;
      position: relative;
      overflow: hidden;
      color: #666;
      background: #fff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 20px;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        
        .card-panel-icon-wrapper {
          color: #fff;
        }
        .icon-money { background: #40c9c6; }
        .icon-people { background: #36a3f7; }
        .icon-message { background: #f4516c; }
        .icon-shopping { background: #34bfa3; }
      }

      .card-panel-icon-wrapper {
        padding: 16px;
        transition: all 0.3s ease-out;
        border-radius: 6px;
        font-size: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .icon-money { color: #40c9c6; }
      .icon-people { color: #36a3f7; }
      .icon-message { color: #f4516c; }
      .icon-shopping { color: #34bfa3; }

      .card-panel-description {
        font-weight: bold;
        text-align: right;

        .card-panel-text {
          line-height: 18px;
          color: rgba(0, 0, 0, 0.45);
          font-size: 16px;
          margin-bottom: 12px;
        }

        .card-panel-num {
          font-size: 24px;
          color: #333;
        }
      }
    }
  }

  .box-card {
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    border: none;
    
    .card-header {
      font-weight: bold;
      color: #333;
      font-size: 16px;
    }
  }
}
</style>
