<template>
  <div class="statistics">
    <!-- 头部 -->
    <div class="header">
      <div class="header-left">
        <h1>统计报表</h1>
        <span class="header-subtitle">{{ selectedMonthLabel }}</span>
      </div>
      <div class="controls">
        <el-select v-model="selectedMonth" placeholder="选择月份" @change="loadMonthData" class="month-select">
          <el-option
            v-for="month in monthOptions"
            :key="month.value"
            :label="month.label"
            :value="month.value"
          />
        </el-select>
        <el-button type="primary" @click="exportData" :icon="Download">导出数据</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="stat-card card-salary">
        <div class="stat-card-icon">
          <el-icon><Money /></el-icon>
        </div>
        <div class="stat-card-body">
          <span class="stat-card-value">¥{{ monthlyStats.totalSalary?.toFixed(0) || '0' }}</span>
          <span class="stat-card-label">总工资</span>
        </div>
      </div>
      <div class="stat-card card-days">
        <div class="stat-card-icon">
          <el-icon><Calendar /></el-icon>
        </div>
        <div class="stat-card-body">
          <span class="stat-card-value">{{ monthlyStats.workDays || 0 }} <small>天</small></span>
          <span class="stat-card-label">工作天数</span>
        </div>
      </div>
      <div class="stat-card card-avg">
        <div class="stat-card-icon">
          <el-icon><Coin /></el-icon>
        </div>
        <div class="stat-card-body">
          <span class="stat-card-value">¥{{ monthlyStats.averageDailySalary?.toFixed(0) || '0' }}</span>
          <span class="stat-card-label">平均日薪</span>
        </div>
      </div>
      <div class="stat-card card-overtime">
        <div class="stat-card-icon">
          <el-icon><Timer /></el-icon>
        </div>
        <div class="stat-card-body">
          <span class="stat-card-value">{{ monthlyStats.totalOvertimeHours?.toFixed(1) || '0' }} <small>h</small></span>
          <span class="stat-card-label">加班时长</span>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts">
      <div class="chart-card">
        <div class="chart-header">
          <el-icon><TrendCharts /></el-icon>
          <span>工资趋势</span>
        </div>
        <div id="salaryChart" ref="salaryChart" class="chart-body"></div>
      </div>
      <div class="chart-card">
        <div class="chart-header">
          <el-icon><Calendar /></el-icon>
          <span>出勤热力图</span>
        </div>
        <!-- 自定义日历热力图 -->
        <div class="heatmap-container">
          <!-- 星期头 -->
          <div class="heatmap-weekdays">
            <span v-for="d in weekHeaders" :key="d" class="heatmap-weekday">{{ d }}</span>
          </div>
          <!-- 日期网格 -->
          <div class="heatmap-grid">
            <div
              v-for="(cell, idx) in heatmapCells"
              :key="idx"
              class="heatmap-cell"
              :class="{
                'cell-empty': cell.empty,
                'cell-normal': cell.status === 'normal',
                'cell-late': cell.status === 'late',
                'cell-early': cell.status === 'early',
                'cell-absent': cell.status === 'absent',
                'cell-today': cell.isToday,
                'cell-weekend': cell.isWeekend
              }"
              :title="cell.tooltip"
            >
              <span class="cell-day">{{ cell.day }}</span>
              <span class="cell-salary" v-if="cell.salary">¥{{ cell.salary }}</span>
            </div>
          </div>
          <!-- 图例 -->
          <div class="heatmap-legend">
            <span class="legend-item"><i class="legend-dot dot-empty"></i>无记录</span>
            <span class="legend-item"><i class="legend-dot dot-normal"></i>正常</span>
            <span class="legend-item"><i class="legend-dot dot-late"></i>迟到</span>
            <span class="legend-item"><i class="legend-dot dot-early"></i>早退</span>
            <span class="legend-item"><i class="legend-dot dot-absent"></i>缺勤</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 心情天气统计 -->
    <div class="mood-weather-card" v-if="hasMoodWeatherData">
      <div class="mw-section">
        <div class="mw-title">天气分布</div>
        <div class="mw-tags" v-if="weatherStats.length">
          <span class="mw-tag" v-for="w in weatherStats" :key="w.value">
            {{ w.emoji }} {{ w.label }} ×{{ w.count }}
          </span>
        </div>
        <span class="mw-empty" v-else>本月无天气数据</span>
      </div>
      <el-divider direction="vertical" />
      <div class="mw-section">
        <div class="mw-title">心情分布</div>
        <div class="mw-tags" v-if="moodStats.length">
          <span class="mw-tag" v-for="m in moodStats" :key="m.value">
            {{ m.emoji }} {{ m.label }} ×{{ m.count }}
          </span>
        </div>
        <span class="mw-empty" v-else>本月无心情数据</span>
      </div>
    </div>

    <!-- 详细记录 -->
    <div class="table-card">
      <div class="table-header">
        <div class="table-header-left">
          <el-icon><List /></el-icon>
          <span>详细记录</span>
        </div>
        <el-button @click="refreshData" link type="primary" :icon="Refresh">刷新</el-button>
      </div>
      <el-table
        :data="monthRecords"
        v-loading="loading"
        class="record-table"
        stripe
        row-class-name="table-row"
      >
        <el-table-column prop="date" label="日期" width="130">
          <template #default="{ row }">
            <span class="col-date">{{ row.date }}</span>
            <span class="col-weekday">{{ getWeekday(row.date) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="clockInTimeDisplay" label="上班" width="90" />
        <el-table-column prop="clockOutTimeDisplay" label="下班" width="90" />
        <el-table-column prop="workHours" label="工时" width="80">
          <template #default="{ row }">
            {{ row.workHours ? row.workHours.toFixed(1) + 'h' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <span class="status-pill" :class="'pill-' + (row.status || 'normal')">
              {{ statusLabel(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="totalSalary" label="日薪" width="100">
          <template #default="{ row }">
            <span class="col-salary">
              {{ row.totalSalary ? '¥' + row.totalSalary.toFixed(0) : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="overtimeHours" label="加班" width="70">
          <template #default="{ row }">
            {{ row.overtimeHours || 0 }}h
          </template>
        </el-table-column>
        <el-table-column prop="isWeekend" label="周末" width="70">
          <template #default="{ row }">
            <el-tag v-if="row.isWeekend" type="warning" size="small" effect="plain">是</el-tag>
            <span v-else class="col-no">否</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import { useAttendance } from '../composables/useAttendance.js'
import { useSalary } from '../composables/useSalary.js'
import { getMonthString, getWeekdayChinese } from '../utils/date.js'
import { ElMessage } from 'element-plus'
import {
  Money, Calendar, Coin, Timer,
  TrendCharts, List, Refresh, Download
} from '@element-plus/icons-vue'

const { getMonthlyRecords } = useAttendance()
const { calculateMonthSalary, exportData: exportDataApi } = useSalary()

const selectedMonth = ref(getMonthString(new Date()))
const monthOptions = ref([])
const monthRecords = ref([])
const monthlyStats = ref({})
const loading = ref(false)

const salaryChart = ref(null)
let salaryChartInstance = null

const weekHeaders = ['一', '二', '三', '四', '五', '六', '日']

const selectedMonthLabel = computed(() => {
  const opt = monthOptions.value.find(o => o.value === selectedMonth.value)
  return opt ? opt.label : ''
})

const weatherOptions = [
  { value: 'sunny', emoji: '☀️', label: '晴' },
  { value: 'cloudy', emoji: '⛅', label: '多云' },
  { value: 'overcast', emoji: '☁️', label: '阴' },
  { value: 'rainy', emoji: '🌧️', label: '雨' },
  { value: 'snowy', emoji: '🌨️', label: '雪' },
  { value: 'foggy', emoji: '🌫️', label: '雾' },
  { value: 'stormy', emoji: '⛈️', label: '雷雨' }
]

const moodOptions = [
  { value: 'happy', emoji: '😊', label: '开心' },
  { value: 'calm', emoji: '😌', label: '平静' },
  { value: 'energetic', emoji: '🤩', label: '精力' },
  { value: 'neutral', emoji: '😐', label: '一般' },
  { value: 'stressed', emoji: '😤', label: '压力' },
  { value: 'tired', emoji: '😴', label: '疲惫' },
  { value: 'sad', emoji: '😢', label: '难过' }
]

const hasMoodWeatherData = computed(() => {
  return monthRecords.value.some(r => r.weather || r.mood)
})

const weatherStats = computed(() => {
  const counts = {}
  monthRecords.value.forEach(r => {
    if (r.weather) counts[r.weather] = (counts[r.weather] || 0) + 1
  })
  return Object.entries(counts)
    .map(([value, count]) => {
      const opt = weatherOptions.find(w => w.value === value)
      return { value, count, emoji: opt?.emoji || '', label: opt?.label || value }
    })
    .sort((a, b) => b.count - a.count)
})

const moodStats = computed(() => {
  const counts = {}
  monthRecords.value.forEach(r => {
    if (r.mood) counts[r.mood] = (counts[r.mood] || 0) + 1
  })
  return Object.entries(counts)
    .map(([value, count]) => {
      const opt = moodOptions.find(m => m.value === value)
      return { value, count, emoji: opt?.emoji || '', label: opt?.label || value }
    })
    .sort((a, b) => b.count - a.count)
})

const heatmapCells = computed(() => {
  const [y, m] = selectedMonth.value.split('-').map(Number)
  const daysInMonth = new Date(y, m, 0).getDate()
  const firstDay = new Date(y, m - 1, 1).getDay() // 0=Sun
  const startOffset = firstDay === 0 ? 6 : firstDay - 1 // 周一=0

  const recordMap = {}
  monthRecords.value.forEach(r => {
    recordMap[r.date] = r
  })

  const todayStr = new Date().toISOString().substring(0, 10)
  const cells = []

  // 前置空白格
  for (let i = 0; i < startOffset; i++) {
    cells.push({ empty: true, day: '', status: '', tooltip: '', salary: '', isToday: false, isWeekend: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const rec = recordMap[dateStr]
    const dow = new Date(y, m - 1, d).getDay() // 0=Sun
    const isWeekend = dow === 0 || dow === 6

    let status = ''
    let tooltip = `${dateStr} 无记录`
    let salary = ''

    if (rec) {
      status = rec.status || 'normal'
      const statusLabels = { normal: '正常', late: '迟到', early: '早退', absent: '缺勤' }
      tooltip = `${dateStr} ${statusLabels[status] || status}`
      if (rec.clockInTimeDisplay) tooltip += ` | 上班 ${rec.clockInTimeDisplay}`
      if (rec.clockOutTimeDisplay) tooltip += ` | 下班 ${rec.clockOutTimeDisplay}`
      if (rec.totalSalary) {
        tooltip += ` | ¥${rec.totalSalary.toFixed(0)}`
        salary = rec.totalSalary.toFixed(0)
      }
    }

    cells.push({
      empty: false,
      day: d,
      status: rec ? status : '',
      tooltip,
      salary,
      isToday: dateStr === todayStr,
      isWeekend
    })
  }

  return cells
})

function generateMonthOptions() {
  const options = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = getMonthString(date)
    options.push({ value, label: `${date.getFullYear()}年${date.getMonth() + 1}月` })
  }
  monthOptions.value = options
}

async function loadMonthData() {
  try {
    loading.value = true
    const recordsResult = await getMonthlyRecords(selectedMonth.value)
    if (recordsResult.success) {
      monthRecords.value = recordsResult.records || []
    }
    const salaryResult = await calculateMonthSalary(selectedMonth.value)
    if (salaryResult.success && salaryResult.salaryStats) {
      monthlyStats.value = salaryResult.salaryStats
    }
    nextTick(() => { renderCharts() })
  } catch (error) {
    console.error('加载月度数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

function renderCharts() {
  if (salaryChart.value) {
    if (!salaryChartInstance) salaryChartInstance = echarts.init(salaryChart.value)
    renderSalaryChart()
  }
}

function renderSalaryChart() {
  if (!monthRecords.value.length) {
    salaryChartInstance.clear()
    return
  }
  const sorted = [...monthRecords.value].sort((a, b) => a.date.localeCompare(b.date))
  const dates = sorted.map(r => r.date.substring(8, 10))
  const salaries = sorted.map(r => r.totalSalary || 0)

  salaryChartInstance.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}日: ¥{c}' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
    xAxis: { type: 'category', data: dates, axisLabel: { color: '#909399' } },
    yAxis: { type: 'value', name: '元', axisLabel: { color: '#909399' } },
    series: [{
      name: '日薪', type: 'line', data: salaries, smooth: true,
      lineStyle: { color: '#6366f1', width: 3 },
      itemStyle: { color: '#6366f1' },
      symbol: 'circle', symbolSize: 5,
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(99,102,241,0.28)' },
        { offset: 1, color: 'rgba(99,102,241,0.02)' }
      ])}
    }]
  })
}

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

function refreshData() { loadMonthData() }
function getWeekday(date) { return getWeekdayChinese(date) }

function statusLabel(status) {
  switch (status) {
    case 'normal': return '正常'
    case 'late': return '迟到'
    case 'early': return '早退'
    case 'absent': return '缺勤'
    default: return '正常'
  }
}

onMounted(() => {
  generateMonthOptions()
  loadMonthData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (salaryChartInstance) salaryChartInstance.dispose()
})

function handleResize() {
  if (salaryChartInstance) salaryChartInstance.resize()
}
</script>

<style scoped>
/* =============================================
   LIGHT MODE
   ============================================= */

.statistics {
  padding: 24px 0;
}

/* ---- 头部 ---- */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.header h1 {
  font-size: 26px;
  font-weight: 700;
  color: var(--el-text-color-primary, #303133);
  margin: 0;
}

.header-subtitle {
  font-size: 16px;
  color: var(--el-text-color-secondary, #909399);
  font-weight: 500;
}

.controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.month-select {
  width: 160px;
}

/* ---- 统计卡片 ---- */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 16px;
  padding: 20px 22px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: box-shadow 0.25s, transform 0.25s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
}

.stat-card-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.card-salary .stat-card-icon   { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.card-days .stat-card-icon     { background: rgba(99, 102, 241, 0.12); color: #6366f1; }
.card-avg .stat-card-icon      { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.card-overtime .stat-card-icon { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

.stat-card-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-card-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary, #303133);
  line-height: 1.2;
}

.stat-card-value small {
  font-size: 14px;
  font-weight: 400;
  color: var(--el-text-color-secondary, #909399);
}

.stat-card-label {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
}

/* ---- 图表区 ---- */
.charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 16px;
  padding: 20px 22px;
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
  margin-bottom: 12px;
}

.chart-header .el-icon {
  color: var(--app-primary, #6366f1);
}

.chart-body {
  width: 100%;
  height: 320px;
}

/* ---- 自定义日历热力图 ---- */
.heatmap-container {
  padding: 4px 0;
}

.heatmap-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 6px;
}

.heatmap-weekday {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary, #909399);
  padding: 4px 0;
}

.heatmap-weekday:nth-child(6),
.heatmap-weekday:nth-child(7) {
  color: var(--el-color-danger-light-3, #f89898);
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.heatmap-cell {
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: default;
  transition: transform 0.15s, box-shadow 0.15s;
  position: relative;
  min-width: 0;
}

.heatmap-cell:hover {
  transform: scale(1.12);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  z-index: 2;
}

.cell-empty {
  background: transparent;
  pointer-events: none;
}

.cell-normal {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.cell-late {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.cell-early {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
}

.cell-absent {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #6b7280;
}

/* 无记录 — 浅灰 */
.heatmap-cell:not(.cell-empty):not(.cell-normal):not(.cell-late):not(.cell-early):not(.cell-absent) {
  background: var(--el-fill-color-lighter, #f9fafb);
  color: var(--el-text-color-placeholder, #c0c4cc);
}

/* 今日标记 */
.cell-today {
  box-shadow: 0 0 0 2px var(--app-primary, #6366f1);
}

.cell-today .cell-day {
  font-weight: 800;
}

.cell-day {
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
}

.cell-salary {
  font-size: 10px;
  font-weight: 500;
  opacity: 0.75;
  margin-top: 1px;
  line-height: 1;
}

/* 周末文字色 */
.cell-weekend .cell-day {
  opacity: 0.7;
}

/* ---- 图例 ---- */
.heatmap-legend {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.dot-empty  { background: var(--el-fill-color-lighter, #f3f4f6); border: 1px solid #e5e7eb; }
.dot-normal { background: linear-gradient(135deg, #d1fae5, #a7f3d0); }
.dot-late   { background: linear-gradient(135deg, #fef3c7, #fde68a); }
.dot-early  { background: linear-gradient(135deg, #fee2e2, #fecaca); }
.dot-absent { background: linear-gradient(135deg, #f3f4f6, #e5e7eb); }

/* ---- 心情天气统计 ---- */
.mood-weather-card {
  display: flex;
  align-items: flex-start;
  gap: 0;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 24px;
}

.mw-section {
  flex: 1;
}

.mw-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-secondary, #909399);
  margin-bottom: 10px;
}

.mw-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mw-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  background: var(--el-fill-color-lighter, #fafafa);
  border-radius: 20px;
  font-size: 14px;
  color: var(--el-text-color-primary, #303133);
}

.mw-empty {
  font-size: 13px;
  color: var(--el-text-color-placeholder, #c0c4cc);
}

/* ---- 表格区 ---- */
.table-card {
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 16px;
  padding: 0 0 4px;
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 22px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
}

.table-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}

.table-header-left .el-icon {
  color: var(--app-primary, #6366f1);
}

/* 表格内元素 */
.col-date {
  font-weight: 500;
  color: var(--el-text-color-primary, #303133);
}

.col-weekday {
  display: block;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
  margin-top: 2px;
}

.col-salary {
  font-weight: 600;
  color: var(--el-color-success, #10b981);
}

.col-no {
  color: var(--el-text-color-secondary, #909399);
}

/* 状态药丸 */
.status-pill {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.pill-normal { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.pill-late   { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.pill-early  { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.pill-absent { background: rgba(107, 114, 128, 0.12); color: #6b7280; }

/* =============================================
   DARK MODE
   ============================================= */

html.dark .header h1,
html.dark .chart-header,
html.dark .table-header-left,
html.dark .stat-card-value,
html.dark .col-date,
html.dark .mw-tag {
  color: var(--el-text-color-primary, #e5eaf3);
}

html.dark .header-subtitle,
html.dark .stat-card-label,
html.dark .stat-card-value small,
html.dark .col-weekday,
html.dark .mw-title {
  color: var(--el-text-color-secondary, #a3a6ad);
}

html.dark .stat-card,
html.dark .chart-card,
html.dark .table-card,
html.dark .mood-weather-card {
  background: var(--el-bg-color, #1d1e1f);
  border-color: var(--el-border-color-light, #414243);
}

html.dark .table-header {
  border-bottom-color: var(--el-border-color-light, #414243);
}

html.dark .mw-tag {
  background: var(--el-fill-color-lighter, #1a1a1b);
}

/* 暗色热力图 */
html.dark .cell-normal {
  background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
  color: #6ee7b7;
}

html.dark .cell-late {
  background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
  color: #fcd34d;
}

html.dark .cell-early {
  background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
  color: #fca5a5;
}

html.dark .cell-absent {
  background: linear-gradient(135deg, #374151 0%, #4b5563 100%);
  color: #d1d5db;
}

html.dark .heatmap-cell:not(.cell-empty):not(.cell-normal):not(.cell-late):not(.cell-early):not(.cell-absent) {
  background: var(--el-fill-color-lighter, #1f2937);
  color: var(--el-text-color-placeholder, #6b7280);
}

html.dark .dot-empty  { background: var(--el-fill-color-lighter, #374151); border-color: #4b5563; }
html.dark .dot-normal { background: linear-gradient(135deg, #064e3b, #065f46); }
html.dark .dot-late   { background: linear-gradient(135deg, #78350f, #92400e); }
html.dark .dot-early  { background: linear-gradient(135deg, #7f1d1d, #991b1b); }
html.dark .dot-absent { background: linear-gradient(135deg, #374151, #4b5563); }

html.dark .cell-today {
  box-shadow: 0 0 0 2px var(--app-primary, #818cf8);
}

/* ---- 响应式 ---- */
@media (max-width: 768px) {
  .stat-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts {
    grid-template-columns: 1fr;
  }
  .mood-weather-card {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
