<template>
  <div class="statistics">
    <div class="header">
      <h1>统计报表</h1>
      <div class="controls">
        <el-select v-model="selectedMonth" placeholder="选择月份" @change="loadMonthData">
          <el-option
            v-for="month in monthOptions"
            :key="month.value"
            :label="month.label"
            :value="month.value"
          />
        </el-select>
        <el-button type="primary" @click="exportData">导出数据</el-button>
      </div>
    </div>

    <!-- 月度概览 -->
    <el-row :gutter="24" class="overview">
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>总工资</span>
            </div>
          </template>
          <div class="stat-value">¥{{ monthlyStats.totalSalary?.toFixed(2) || '0.00' }}</div>
          <div class="stat-label">当月累计</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>工作天数</span>
            </div>
          </template>
          <div class="stat-value">{{ monthlyStats.workDays || 0 }} 天</div>
          <div class="stat-label">出勤天数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>平均日薪</span>
            </div>
          </template>
          <div class="stat-value">¥{{ monthlyStats.averageDailySalary?.toFixed(2) || '0.00' }}</div>
          <div class="stat-label">日均收入</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>加班时长</span>
            </div>
          </template>
          <div class="stat-value">{{ monthlyStats.totalOvertimeHours?.toFixed(1) || '0.0' }} 小时</div>
          <div class="stat-label">累计加班</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="24" class="charts">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>工资趋势</span>
            </div>
          </template>
          <div id="salaryChart" ref="salaryChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>出勤分布</span>
            </div>
          </template>
          <div id="attendanceChart" ref="attendanceChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据 -->
    <el-card class="detailed-data">
      <template #header>
        <div class="card-header">
          <span>详细记录</span>
          <el-button type="text" @click="refreshData">刷新</el-button>
        </div>
      </template>
      <el-table :data="monthRecords" style="width: 100%" v-loading="loading" class="record-table"
        :cell-style="{ textAlign: 'center', verticalAlign: 'middle' }"
        :header-cell-style="{ textAlign: 'center', verticalAlign: 'middle' }">
        <el-table-column prop="date" label="日期" width="120" align="center">
          <template #default="{ row }">
            {{ row.date }} <br/>
            <small>{{ getWeekday(row.date) }}</small>
          </template>
        </el-table-column>
        <el-table-column prop="clockInTimeDisplay" label="上班时间" width="120" align="center" />
        <el-table-column prop="clockOutTimeDisplay" label="下班时间" width="120" align="center" />
        <el-table-column prop="workHours" label="工作时长" width="100" align="center">
          <template #default="{ row }">
            {{ row.workHours ? row.workHours.toFixed(1) : '-' }} 小时
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ row.status || '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalSalary" label="日薪" width="120" align="center">
          <template #default="{ row }">
            {{ row.totalSalary ? `¥${row.totalSalary.toFixed(2)}` : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="overtimeHours" label="加班时长" width="100" align="center">
          <template #default="{ row }">
            {{ row.overtimeHours || 0 }} 小时
          </template>
        </el-table-column>
        <el-table-column prop="isWeekend" label="周末" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isWeekend" type="warning" size="small">是</el-tag>
            <span v-else>否</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useAttendance } from '../composables/useAttendance.js'
import { useSalary } from '../composables/useSalary.js'
import { getMonthString, getWeekdayChinese, formatDate } from '../utils/date.js'
import { ElMessage } from 'element-plus'

const { getMonthlyRecords } = useAttendance()
const { calculateMonthSalary, exportData: exportDataApi } = useSalary()

const selectedMonth = ref(getMonthString(new Date()))
const monthOptions = ref([])
const monthRecords = ref([])
const monthlyStats = ref({})
const loading = ref(false)

const salaryChart = ref(null)
const attendanceChart = ref(null)
let salaryChartInstance = null
let attendanceChartInstance = null

// 生成最近6个月的选项
function generateMonthOptions() {
  const options = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = getMonthString(date)
    const label = `${date.getFullYear()}年${date.getMonth() + 1}月`
    options.push({ value, label })
  }
  monthOptions.value = options
}

// 加载月度数据
async function loadMonthData() {
  try {
    loading.value = true

    // 获取打卡记录
    const recordsResult = await getMonthlyRecords(selectedMonth.value)
    if (recordsResult.success) {
      monthRecords.value = recordsResult.records || []
    }

    // 计算月度统计
    const salaryResult = await calculateMonthSalary(selectedMonth.value)
    if (salaryResult.success && salaryResult.salaryStats) {
      monthlyStats.value = salaryResult.salaryStats
    }

    // 渲染图表
    nextTick(() => {
      renderCharts()
    })
  } catch (error) {
    console.error('加载月度数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 渲染图表
function renderCharts() {
  if (salaryChart.value) {
    if (!salaryChartInstance) {
      salaryChartInstance = echarts.init(salaryChart.value)
    }
    renderSalaryChart()
  }

  if (attendanceChart.value) {
    if (!attendanceChartInstance) {
      attendanceChartInstance = echarts.init(attendanceChart.value)
    }
    renderAttendanceChart()
  }
}

// 渲染工资趋势图
function renderSalaryChart() {
  if (!monthRecords.value.length) {
    salaryChartInstance.clear()
    return
  }

  const dates = monthRecords.value.map(r => r.date.substring(8, 10)).sort()
  const salaries = monthRecords.value
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => r.totalSalary || 0)

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}日: ¥{c}'
    },
    xAxis: {
      type: 'category',
      data: dates,
      name: '日期'
    },
    yAxis: {
      type: 'value',
      name: '工资（元）'
    },
    series: [
      {
        name: '日薪',
        type: 'line',
        data: salaries,
        smooth: true,
        lineStyle: {
          color: '#409eff'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ])
        }
      }
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    }
  }

  salaryChartInstance.setOption(option)
}

// 渲染出勤分布图
function renderAttendanceChart() {
  if (!monthRecords.value.length) {
    attendanceChartInstance.clear()
    return
  }

  const statusCount = {
    normal: 0,
    late: 0,
    early: 0,
    absent: 0,
    overtime: 0
  }

  monthRecords.value.forEach(record => {
    if (record.status) statusCount[record.status] = (statusCount[record.status] || 0) + 1
    if (record.isOvertime) statusCount.overtime++
  })

  const data = [
    { name: '正常', value: statusCount.normal },
    { name: '迟到', value: statusCount.late },
    { name: '早退', value: statusCount.early },
    { name: '缺勤', value: statusCount.absent },
    { name: '加班', value: statusCount.overtime }
  ].filter(item => item.value > 0)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        name: '出勤状态',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  attendanceChartInstance.setOption(option)
}

// 导出数据
async function exportData() {
  const result = await exportDataApi()
  if (result.success) {
    const dataStr = JSON.stringify(result.data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `attendance_data_${selectedMonth.value}.json`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } else {
    ElMessage.error(result.message || '导出失败')
  }
}

function refreshData() {
  loadMonthData()
}

function getWeekday(date) {
  return getWeekdayChinese(date)
}

function getStatusTag(status) {
  switch (status) {
    case 'normal': return 'success'
    case 'late': return 'warning'
    case 'early': return 'danger'
    case 'absent': return 'info'
    default: return ''
  }
}

// 初始化
onMounted(() => {
  generateMonthOptions()
  loadMonthData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (salaryChartInstance) {
    salaryChartInstance.dispose()
  }
  if (attendanceChartInstance) {
    attendanceChartInstance.dispose()
  }
})

function handleResize() {
  if (salaryChartInstance) {
    salaryChartInstance.resize()
  }
  if (attendanceChartInstance) {
    attendanceChartInstance.resize()
  }
}
</script>

<style scoped>
.statistics {
  padding: 24px 0;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.header h1 {
  font-size: 28px;
  margin: 0;
  color: var(--el-text-color-primary, #303133);
}

.controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.overview {
  margin-bottom: 32px;
}

.stat-card {
  height: 100%;
}

.card-header {
  font-weight: 600;
  font-size: 16px;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: var(--el-color-primary, #409eff);
  text-align: center;
  margin: 20px 0;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-secondary, #909399);
  text-align: center;
}

.charts {
  margin-bottom: 32px;
}

.chart-card {
  height: 100%;
}

.detailed-data {
  margin-top: 32px;
}

/* 表格对齐修复 - 水平和垂直居中 */
.record-table :deep(.el-table th > .cell),
.record-table :deep(.el-table td > .cell) {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

/* 确保表头单元格垂直居中 */
.record-table :deep(.el-table__header-wrapper th) {
  vertical-align: middle;
}

/* 确保内容单元格垂直居中 */
.record-table :deep(.el-table__body-wrapper td) {
  vertical-align: middle;
}

/* 确保标签组件也居中 */
.record-table :deep(.el-table__cell .el-tag) {
  margin: 0 auto;
}
</style>