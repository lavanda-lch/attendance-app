<template>
  <div class="home">
    <!-- Hero 欢迎区域 -->
    <div class="hero">
      <div class="hero-greeting">
        <span class="greeting-emoji">{{ greetingEmoji }}</span>
        <span class="greeting-text">{{ greetingText }}</span>
      </div>
      <div class="hero-clock">{{ currentTime }}</div>
      <div class="hero-date">{{ currentDate }}</div>
    </div>

    <!-- 打卡状态卡片 -->
    <el-row :gutter="24" class="status-row">
      <el-col :span="8">
        <el-card class="status-card status-card--status">
          <div class="status-card-inner">
            <div class="status-icon">
              <el-icon :size="28"><Odometer /></el-icon>
            </div>
            <div class="status-body">
              <div class="status-label">今日状态</div>
              <div class="status-value">
                <el-tag :type="getStatusTagType(todayStatus)" size="large" round>
                  {{ getStatusText(todayStatus) }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="status-card status-card--hours">
          <div class="status-card-inner">
            <div class="status-icon">
              <el-icon :size="28"><Timer /></el-icon>
            </div>
            <div class="status-body">
              <div class="status-label">工作时长</div>
              <div class="status-value">{{ todayWorkHours.toFixed(1) }} <span class="unit">小时</span></div>
              <div class="status-sub" v-if="todayRecord?.clockInTime">上班：{{ todayRecord.clockInTimeDisplay }}</div>
              <div class="status-sub" v-else>尚未打卡</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="status-card status-card--income">
          <div class="status-card-inner">
            <div class="status-icon">
              <el-icon :size="28"><Coin /></el-icon>
            </div>
            <div class="status-body">
              <div class="status-label">今日收入</div>
              <div class="status-value">{{ todaySalary }} <span class="unit">元</span></div>
              <div class="status-sub" v-if="todayRecord?.totalSalary">已计算</div>
              <div class="status-sub" v-else>待计算</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 打卡按钮 -->
    <div class="punch-section">
      <div class="punch-buttons">
        <button
          class="punch-btn punch-btn--in"
          :class="{ 'is-done': todayRecord?.clockInTime }"
          :disabled="!!todayRecord?.clockInTime || loading"
          @click="handleClockIn"
        >
          <span class="punch-btn-icon">
            <el-icon :size="28"><CircleCheck /></el-icon>
          </span>
          <span class="punch-btn-text">
            {{ todayRecord?.clockInTime ? '已上班打卡' : '上班打卡' }}
          </span>
        </button>

        <button
          class="punch-btn punch-btn--out"
          :class="{ 'is-done': todayRecord?.clockOutTime }"
          :disabled="!todayRecord?.clockInTime || !!todayRecord?.clockOutTime || loading"
          @click="handleClockOut"
        >
          <span class="punch-btn-icon">
            <el-icon :size="28"><CircleCheck /></el-icon>
          </span>
          <span class="punch-btn-text">
            {{ todayRecord?.clockOutTime ? '已下班打卡' : '下班打卡' }}
          </span>
        </button>

        <button class="punch-btn punch-btn--extra" @click="openManualPunchDialog">
          <span class="punch-btn-icon">
            <el-icon :size="24"><Edit /></el-icon>
          </span>
          <span class="punch-btn-text">补打卡</span>
        </button>
      </div>
    </div>

    <!-- 最近记录 -->
    <el-card class="recent-records">
      <template #header>
        <div class="card-header">
          <span class="card-title">最近打卡记录</span>
          <el-button type="primary" link size="small" @click="loadRecentRecords" :loading="loading">刷新</el-button>
        </div>
      </template>
      <el-table :data="recentRecords" style="width: 100%" v-loading="loading" class="record-table"
        :cell-style="{ textAlign: 'center', verticalAlign: 'middle' }"
        :header-cell-style="{ textAlign: 'center', verticalAlign: 'middle', background: 'var(--el-fill-color-light)' }">
        <el-table-column prop="date" label="日期" width="120" align="center">
          <template #default="{ row }">
            <div class="date-cell">
              <span class="date-text">{{ row.date }}</span>
              <span class="date-weekday">{{ getWeekday(row.date) }}</span>
            </div>
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
            <el-tag :type="getRecordStatusTag(row.status)" size="small" round>
              {{ row.status || '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalSalary" label="日薪" width="100" align="center">
          <template #default="{ row }">
            <span class="salary-text" v-if="row.totalSalary">¥{{ row.totalSalary.toFixed(2) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="editRecord(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="deleteRecord(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="table-empty" v-if="!loading && recentRecords.length === 0">
        <el-empty description="暂无打卡记录，快去打卡吧" />
      </div>
    </el-card>

    <!-- 编辑/补打卡对话框 -->
    <el-dialog v-model="editDialogVisible" :title="editForm.isNew ? '补打卡' : '编辑打卡记录'" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="日期">
          <el-date-picker
            v-model="editForm.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled="!editForm.isNew"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="上班时间" required>
          <el-time-picker
            v-model="editForm.clockInTime"
            placeholder="选择上班时间"
            value-format="HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="下班时间">
          <el-time-picker
            v-model="editForm.clockOutTime"
            placeholder="选择下班时间（可选）"
            value-format="HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="正常" value="normal" />
            <el-option label="迟到" value="late" />
            <el-option label="早退" value="early" />
            <el-option label="缺勤" value="absent" />
          </el-select>
        </el-form-item>
        <el-form-item label="日薪（元）">
          <el-input-number
            v-model="editForm.totalSalary"
            :min="0"
            :step="50"
            controls-position="right"
            style="width: 100%"
          />
          <div class="form-help" v-if="!editForm.isNew">留空或设为0则按设置中的日薪自动计算</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEdit" :loading="loading">
            {{ editForm.isNew ? '补打卡' : '保存' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAttendance } from '../composables/useAttendance.js'
import { formatDate, getWeekdayChinese } from '../utils/date.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Odometer, Timer, Coin, CircleCheck, Edit } from '@element-plus/icons-vue'

const {
  todayRecord,
  loading,
  todayStatus,
  todayWorkHours,
  clockIn,
  clockOut,
  addManualRecord,
  editRecord: editRecordApi,
  getAllRecords,
  deleteRecord: deleteRecordApi,
  loadTodayRecord
} = useAttendance()

const recentRecords = ref([])
const editDialogVisible = ref(false)
const editForm = ref({
  date: '',
  clockInTime: '',
  clockOutTime: '',
  status: 'normal',
  totalSalary: 0,
  isNew: false
})

/* 实时时钟 */
const currentTime = ref('')
let clockTimer = null

function updateClock() {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  currentTime.value = `${h}:${m}:${s}`
}

onMounted(() => {
  updateClock()
  clockTimer = setInterval(updateClock, 1000)
})

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer)
})

/* 问候语 */
const greetingEmoji = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '🌙'
  if (h < 12) return '☀️'
  if (h < 18) return '🌤️'
  return '🌆'
})

const greetingText = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了，注意休息'
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

/* 日期 */
const currentDate = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const weekday = weekdays[now.getDay()]
  return `${year}年${month}月${day}日 ${weekday}`
})

const todaySalary = computed(() => {
  if (todayRecord.value?.totalSalary) {
    return todayRecord.value.totalSalary.toFixed(2)
  }
  return '0.00'
})

// 加载数据
onMounted(async () => {
  await loadTodayRecord()
  await loadRecentRecords()
})

async function loadRecentRecords() {
  const result = await getAllRecords()
  if (result.success) {
    recentRecords.value = result.records
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10)
  } else {
    console.error('加载打卡记录失败:', result.message)
    ElMessage.error('加载打卡记录失败，请重试')
  }
}

function openManualPunchDialog() {
  const today = formatDate(new Date())
  editForm.value = {
    date: today,
    clockInTime: '',
    clockOutTime: '',
    status: 'normal',
    totalSalary: 0,
    isNew: true
  }
  editDialogVisible.value = true
}

async function handleClockIn() {
  const result = await clockIn()
  if (result.success) {
    ElMessage.success('✅ 上班打卡成功')
    await loadRecentRecords()
  } else {
    ElMessage.error(result.message || '打卡失败')
  }
}

async function handleClockOut() {
  const result = await clockOut()
  if (result.success) {
    ElMessage.success('✅ 下班打卡成功')
    await loadRecentRecords()
  } else {
    ElMessage.error(result.message || '打卡失败')
  }
}

function editRecord(record) {
  editForm.value = {
    date: record.date,
    clockInTime: record.clockInTimeDisplay || '',
    clockOutTime: record.clockOutTimeDisplay || '',
    status: record.status || 'normal',
    totalSalary: record.totalSalary || 0,
    isNew: false
  }
  editDialogVisible.value = true
}

async function saveEdit() {
  try {
    const { date, clockInTime, clockOutTime, status, isNew } = editForm.value

    if (!date) {
      ElMessage.error('请选择日期')
      return
    }

    if (!clockInTime) {
      ElMessage.error('请填写上班时间')
      return
    }

    if (clockOutTime) {
      const [inHour, inMinute] = clockInTime.split(':').map(Number)
      const [outHour, outMinute] = clockOutTime.split(':').map(Number)

      const inTotal = inHour * 60 + inMinute
      const outTotal = outHour * 60 + outMinute

      if (outTotal <= inTotal) {
        ElMessage.error('下班时间必须晚于上班时间')
        return
      }
    }

    let result
    if (isNew) {
      result = await addManualRecord(date, clockInTime, clockOutTime || '', status)
    } else {
      const updates = {
        clockInTime,
        clockOutTime: clockOutTime || '',
        status
      }
      if (editForm.value.totalSalary > 0) {
        updates.totalSalary = editForm.value.totalSalary
      }
      result = await editRecordApi(date, updates)
    }

    if (result.success) {
      ElMessage.success(isNew ? '补打卡成功' : '编辑成功')
      editDialogVisible.value = false
      await loadTodayRecord()
      await loadRecentRecords()
    } else {
      ElMessage.error(result.message || '操作失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败，请重试')
  }
}

async function deleteRecord(record) {
  try {
    await ElMessageBox.confirm('确定删除这条记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const result = await deleteRecordApi(record.date)
    if (result.success) {
      ElMessage.success('删除成功')
      await loadRecentRecords()
    }
  } catch (error) {
    // 用户取消
  }
}

function getWeekday(date) {
  return getWeekdayChinese(date)
}

function getStatusTagType(status) {
  if (status.includes('已完成')) return 'success'
  if (status.includes('已上班')) return 'warning'
  return 'info'
}

function getStatusText(status) {
  return status
}

function getRecordStatusTag(status) {
  switch (status) {
    case 'normal': return 'success'
    case 'late': return 'warning'
    case 'early': return 'danger'
    case 'absent': return 'info'
    default: return ''
  }
}
</script>

<style scoped>
.home {
  padding: 12px 0;
}

/* ===== Hero 区域 ===== */
.hero {
  text-align: center;
  padding: 48px 0 40px;
}

.hero-greeting {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 12px;
}

.greeting-emoji {
  font-size: 32px;
}

.greeting-text {
  font-size: 22px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.hero-clock {
  font-size: 72px;
  font-weight: 700;
  letter-spacing: 4px;
  background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-primary-light) 50%, #a78bfa 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
  margin-bottom: 8px;
  font-variant-numeric: tabular-nums;
}

.hero-date {
  font-size: 18px;
  color: var(--el-text-color-secondary);
}

html.dark .hero-clock {
  background: linear-gradient(135deg, #818cf8 0%, #a78bfa 50%, #c4b5fd 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* ===== 状态卡片 ===== */
.status-row {
  margin-bottom: 32px;
}

.status-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.status-card:hover {
  transform: translateY(-4px);
}

.status-card-inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 4px;
}

.status-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 三张卡片不同主题色 */
.status-card--status .status-icon {
  background: var(--app-primary-bg);
  color: var(--app-primary);
}

.status-card--hours .status-icon {
  background: var(--app-success-bg);
  color: var(--app-success);
}

.status-card--income .status-icon {
  background: var(--app-warning-bg);
  color: var(--app-warning);
}

.status-body {
  flex: 1;
  min-width: 0;
}

.status-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}

.status-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.status-value .unit {
  font-size: 14px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
  margin-left: 2px;
}

.status-sub {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
}

/* ===== 打卡按钮 ===== */
.punch-section {
  margin: 40px 0;
}

.punch-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.punch-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 200px;
  height: 88px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-family: inherit;
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.punch-btn:not(:disabled):hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.18);
}

.punch-btn:not(:disabled):active {
  transform: translateY(-1px);
}

.punch-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* 上班打卡按钮 */
.punch-btn--in {
  background: linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
}

.punch-btn--in.is-done {
  background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
  box-shadow: 0 4px 16px rgba(107, 114, 128, 0.25);
}

/* 下班打卡按钮 */
.punch-btn--out {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #fb923c 100%);
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
}

.punch-btn--out.is-done {
  background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
  box-shadow: 0 4px 16px rgba(107, 114, 128, 0.25);
}

/* 补打卡按钮 */
.punch-btn--extra {
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  border: 2px dashed var(--el-border-color-darker);
  box-shadow: none;
}

.punch-btn--extra:hover {
  border-color: var(--app-primary);
  color: var(--app-primary);
  background: var(--app-primary-bg);
}

.punch-btn-icon {
  display: flex;
  align-items: center;
}

.punch-btn-text {
  font-size: 15px;
}

/* ===== 记录表格 ===== */
.recent-records {
  margin-top: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 17px;
  font-weight: 600;
}

.recent-records :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.date-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.date-weekday {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.salary-text {
  font-weight: 600;
  color: var(--app-warning);
}

/* 表格居中 */
.record-table :deep(.el-table__header-wrapper th .cell) {
  text-align: center;
}

.record-table :deep(.el-table__body-wrapper td .cell) {
  display: flex;
  justify-content: center;
  align-items: center;
}

.record-table :deep(.el-table__cell .el-tag) {
  margin: 0 auto;
}

.table-empty {
  padding: 32px 0;
}

.form-help {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .hero-clock {
    font-size: 48px;
  }

  .punch-btn {
    width: 160px;
    height: 76px;
  }

  .status-card-inner {
    flex-direction: column;
    text-align: center;
  }
}
</style>
