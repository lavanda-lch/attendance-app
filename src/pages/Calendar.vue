<template>
  <div class="calendar">
    <!-- 头部 -->
    <div class="header">
      <div class="header-left">
        <h1>打卡日历</h1>
        <span class="header-subtitle">{{ currentMonth }}</span>
      </div>
      <div class="controls">
        <div class="month-nav">
          <el-button @click="prevMonth" :icon="ArrowLeft" circle plain />
          <el-button class="today-btn" @click="goToday">今天</el-button>
          <el-button @click="nextMonth" :icon="ArrowRight" circle plain />
        </div>
        <el-button type="success" @click="openBatchDialog" plain>
          批量补打卡
        </el-button>
      </div>
    </div>

    <!-- 月度统计 -->
    <div class="month-stats">
      <div class="stat-card">
        <div class="stat-icon stat-icon-work">
          <el-icon><Calendar /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ monthStats.workDays || 0 }}</span>
          <span class="stat-label">工作日</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-salary">
          <el-icon><Money /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">¥{{ monthStats.totalSalary.toFixed(0) }}</span>
          <span class="stat-label">总工资</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-overtime">
          <el-icon><Timer /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ monthStats.overtimeDays || 0 }}</span>
          <span class="stat-label">加班天数</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-late">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ monthStats.lateEarlyDays || 0 }}</span>
          <span class="stat-label">迟到/早退</span>
        </div>
      </div>
    </div>

    <!-- 日历 -->
    <div class="calendar-container">
      <div class="weekdays">
        <div
          class="weekday"
          v-for="(day, idx) in weekdays"
          :key="day"
          :class="{ 'weekend-header': idx >= 5 }"
        >{{ day }}</div>
      </div>
      <div class="days">
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="day"
            :class="[
              {
                'current-month': day.isCurrentMonth,
                'today': day.isToday,
                'weekend': day.isWeekend,
                'has-record': day.hasRecord,
                'selected': selectedDay?.dateStr === day.dateStr
              },
              day.record ? 'record-' + day.record.status : ''
            ]"
            @click="selectDay(day)"
          >
            <!-- 天气图标 -->
            <div class="day-weather" v-if="day.record?.weather">
              {{ getWeatherEmoji(day.record.weather) }}
            </div>

            <div class="day-main">
              <div class="day-number">{{ day.date.getDate() }}</div>
              <!-- 状态小圆点 -->
              <div
                class="day-status-dot"
                v-if="day.record?.clockInTime"
                :class="'dot-' + (day.record.status || 'normal')"
              ></div>
            </div>

            <!-- 状态标签 -->
            <div class="day-status" v-if="day.record">
              <span
                class="status-badge"
                :class="'badge-' + (day.record.status || 'normal')"
              >
                {{ getDayStatusText(day.record) }}
              </span>
            </div>

            <!-- 薪资 -->
            <div class="day-salary" v-if="day.record?.totalSalary">
              ¥{{ day.record.totalSalary.toFixed(0) }}
            </div>

            <!-- 心情图标 -->
            <div class="day-mood" v-if="day.record?.mood">
              {{ getMoodEmoji(day.record.mood) }}
            </div>
          </div>
        </div>
      </div>

    <!-- 选中日详情 -->
    <div class="day-detail" v-if="selectedDay">
        <div class="detail-header">
          <div class="detail-date">
            <span class="detail-date-num">{{ selectedDay.dateStr }}</span>
            <el-tag
              v-if="selectedDay.record"
              :type="getDayStatusTag(selectedDay.record)"
              size="small"
            >
              {{ getDayStatusText(selectedDay.record) }}
            </el-tag>
          </div>
          <div class="detail-weather-mood" v-if="selectedDay.record">
            <span class="detail-icon-item" v-if="selectedDay.record.weather">
              {{ getWeatherEmoji(selectedDay.record.weather) }}
              <span class="detail-icon-label">{{ getWeatherLabel(selectedDay.record.weather) }}</span>
            </span>
            <span class="detail-icon-item" v-if="selectedDay.record.mood">
              {{ getMoodEmoji(selectedDay.record.mood) }}
              <span class="detail-icon-label">{{ getMoodLabel(selectedDay.record.mood) }}</span>
            </span>
          </div>
          <div v-else class="detail-no-record">该日无打卡记录</div>
        </div>

        <template v-if="selectedDay.record">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-item-icon"><el-icon><Top /></el-icon></span>
              <div class="detail-item-content">
                <span class="detail-item-label">上班</span>
                <span class="detail-item-value">{{ selectedDay.record.clockInTimeDisplay || '未打卡' }}</span>
              </div>
            </div>
            <div class="detail-item">
              <span class="detail-item-icon"><el-icon><Bottom /></el-icon></span>
              <div class="detail-item-content">
                <span class="detail-item-label">下班</span>
                <span class="detail-item-value">{{ selectedDay.record.clockOutTimeDisplay || '未打卡' }}</span>
              </div>
            </div>
            <div class="detail-item">
              <span class="detail-item-icon"><el-icon><Clock /></el-icon></span>
              <div class="detail-item-content">
                <span class="detail-item-label">工作时长</span>
                <span class="detail-item-value">{{ selectedDay.record.workHours ? selectedDay.record.workHours.toFixed(1) + ' 小时' : '-' }}</span>
              </div>
            </div>
            <div class="detail-item">
              <span class="detail-item-icon"><el-icon><Coin /></el-icon></span>
              <div class="detail-item-content">
                <span class="detail-item-label">日薪</span>
                <span class="detail-item-value">{{ selectedDay.record.totalSalary ? '¥' + selectedDay.record.totalSalary.toFixed(2) : '-' }}</span>
              </div>
            </div>
          </div>
          <div class="detail-actions">
            <el-button type="primary" @click="editDayRecord" :icon="Edit">编辑</el-button>
            <el-button type="danger" @click="deleteDayRecord" :icon="Delete">删除</el-button>
          </div>
        </template>
      </div>

    <!-- 编辑/补打卡对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editForm.isNew ? '补打卡' : '编辑打卡记录'"
      width="550px"
      class="edit-dialog"
    >
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

        <!-- 天气选择 -->
        <el-form-item label="天气">
          <div class="emoji-picker">
            <div
              v-for="w in weatherOptions"
              :key="w.value"
              class="emoji-option"
              :class="{ selected: editForm.weather === w.value }"
              @click="editForm.weather = editForm.weather === w.value ? '' : w.value"
            >
              <span class="emoji-icon">{{ w.emoji }}</span>
              <span class="emoji-label">{{ w.label }}</span>
            </div>
          </div>
        </el-form-item>

        <!-- 心情选择 -->
        <el-form-item label="心情">
          <div class="emoji-picker">
            <div
              v-for="m in moodOptions"
              :key="m.value"
              class="emoji-option"
              :class="{ selected: editForm.mood === m.value }"
              @click="editForm.mood = editForm.mood === m.value ? '' : m.value"
            >
              <span class="emoji-icon">{{ m.emoji }}</span>
              <span class="emoji-label">{{ m.label }}</span>
            </div>
          </div>
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

    <!-- 批量补打卡对话框 -->
    <el-dialog v-model="batchDialogVisible" title="批量补打卡" width="600px">
      <el-form :model="batchForm" label-width="100px">
        <el-form-item label="日期范围" required>
          <el-date-picker
            v-model="batchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="上班时间" required>
          <el-time-picker
            v-model="batchForm.clockInTime"
            placeholder="选择上班时间"
            value-format="HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="下班时间">
          <el-time-picker
            v-model="batchForm.clockOutTime"
            placeholder="选择下班时间（可选）"
            value-format="HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="batchForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="正常" value="normal" />
            <el-option label="迟到" value="late" />
            <el-option label="早退" value="early" />
            <el-option label="缺勤" value="absent" />
          </el-select>
        </el-form-item>
      </el-form>

      <el-card v-if="previewDates.length > 0" class="preview-card">
        <template #header>
          <div class="card-header">
            <span>预览 ({{ previewDates.length }} 天)</span>
          </div>
        </template>
        <div class="preview-list">
          <div v-for="date in previewDates" :key="date" class="preview-item">
            {{ date }}：{{ batchForm.clockInTime }} - {{ batchForm.clockOutTime || '无' }} ({{ batchForm.status }})
          </div>
        </div>
      </el-card>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveBatch" :loading="loading" :disabled="!isBatchFormValid">
            批量创建 ({{ previewDates.length }} 条)
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAttendance } from '../composables/useAttendance.js'
import { formatDate, getMonthString, isWeekend } from '../utils/date.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft, ArrowRight, Calendar, Money, Timer,
  WarningFilled, Top, Bottom, Clock, Coin, Edit, Delete
} from '@element-plus/icons-vue'

const {
  getMonthlyRecords,
  addManualRecord,
  addBatchRecords,
  editRecord: editRecordApi,
  deleteRecord: deleteRecordApi
} = useAttendance()

const currentDate = ref(new Date())
const calendarDays = ref([])
const monthRecords = ref([])
const selectedDay = ref(null)
const editDialogVisible = ref(false)
const loading = ref(false)
const editForm = ref({
  date: '',
  clockInTime: '',
  clockOutTime: '',
  status: 'normal',
  isNew: false,
  weather: '',
  mood: ''
})

const batchDialogVisible = ref(false)
const batchForm = ref({
  dateRange: [],
  clockInTime: '',
  clockOutTime: '',
  status: 'normal'
})
const previewDates = ref([])

const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

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

function getWeatherEmoji(value) {
  return weatherOptions.find(w => w.value === value)?.emoji || ''
}

function getWeatherLabel(value) {
  return weatherOptions.find(w => w.value === value)?.label || ''
}

function getMoodEmoji(value) {
  return moodOptions.find(m => m.value === value)?.emoji || ''
}

function getMoodLabel(value) {
  return moodOptions.find(m => m.value === value)?.label || ''
}

const currentMonth = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth() + 1
  return `${year}年${month}月`
})

const monthStats = computed(() => {
  let workDays = 0
  let totalSalary = 0
  let overtimeDays = 0
  let lateEarlyDays = 0

  monthRecords.value.forEach(record => {
    if (record.clockInTime) workDays++
    if (record.totalSalary) totalSalary += record.totalSalary
    if (record.isOvertime) overtimeDays++
    if (record.status === 'late' || record.status === 'early') lateEarlyDays++
  })

  return { workDays, totalSalary, overtimeDays, lateEarlyDays }
})

const isBatchFormValid = computed(() => {
  const { dateRange, clockInTime } = batchForm.value
  return dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1] && clockInTime
})

watch(() => batchForm.value.dateRange, (dateRange) => {
  if (!dateRange || dateRange.length !== 2 || !dateRange[0] || !dateRange[1]) {
    previewDates.value = []
    return
  }
  const [start, end] = dateRange
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (startDate > endDate) {
    previewDates.value = []
    return
  }
  const dates = []
  const current = new Date(startDate)
  while (current <= endDate) {
    dates.push(formatDate(current))
    current.setDate(current.getDate() + 1)
  }
  previewDates.value = dates
}, { immediate: true })

function generateCalendar() {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const firstDayWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const lastDayWeekday = lastDay.getDay() === 0 ? 6 : lastDay.getDay() - 1
  const days = []

  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i)
    days.push(createDayObject(date, false))
  }

  const daysInMonth = lastDay.getDate()
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i)
    days.push(createDayObject(date, true))
  }

  const nextMonthDays = 7 - lastDayWeekday - 1
  for (let i = 1; i <= nextMonthDays; i++) {
    const date = new Date(year, month + 1, i)
    days.push(createDayObject(date, false))
  }

  calendarDays.value = days
}

function createDayObject(date, isCurrentMonth) {
  const dateStr = formatDate(date)
  const todayStr = formatDate(new Date())
  const record = monthRecords.value.find(r => r.date === dateStr) || null
  return {
    date, dateStr, isCurrentMonth,
    isToday: dateStr === todayStr,
    isWeekend: isWeekend(date),
    hasRecord: !!record,
    record
  }
}

async function loadMonthData() {
  const yearMonth = getMonthString(currentDate.value)
  const result = await getMonthlyRecords(yearMonth)
  if (result.success) {
    monthRecords.value = result.records || []
  }
  generateCalendar()
}

function selectDay(day) {
  selectedDay.value = day
  if (!day.hasRecord) {
    editForm.value = {
      date: day.dateStr,
      clockInTime: '',
      clockOutTime: '',
      status: 'normal',
      totalSalary: 0,
      isNew: true,
      weather: '',
      mood: ''
    }
    editDialogVisible.value = true
  }
}

function prevMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
  loadMonthData()
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
  loadMonthData()
}

function goToday() {
  currentDate.value = new Date()
  loadMonthData()
}

function getDayStatusTag(record) {
  if (!record.clockInTime) return 'info'
  if (record.status === 'late') return 'warning'
  if (record.status === 'early') return 'danger'
  if (record.status === 'absent') return 'info'
  return 'success'
}

function getDayStatusText(record) {
  if (!record.clockInTime) return '未打卡'
  if (record.status === 'late') return '迟到'
  if (record.status === 'early') return '早退'
  if (record.status === 'absent') return '缺勤'
  if (record.clockOutTime) return '已打卡'
  return '已上班'
}

function editDayRecord() {
  if (!selectedDay.value?.record) return
  const record = selectedDay.value.record
  editForm.value = {
    date: record.date,
    clockInTime: record.clockInTimeDisplay || '',
    clockOutTime: record.clockOutTimeDisplay || '',
    status: record.status || 'normal',
    totalSalary: record.totalSalary || 0,
    isNew: false,
    weather: record.weather || '',
    mood: record.mood || ''
  }
  editDialogVisible.value = true
}

async function deleteDayRecord() {
  if (!selectedDay.value?.record) return
  try {
    await ElMessageBox.confirm('确定删除这条记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const result = await deleteRecordApi(selectedDay.value.dateStr)
    if (result.success) {
      ElMessage.success('删除成功')
      await loadMonthData()
      selectedDay.value = null
    } else {
      ElMessage.error(result.message || '删除失败')
    }
  } catch (error) {}
}

async function saveEdit() {
  try {
    loading.value = true
    const { date, clockInTime, clockOutTime, status, isNew, weather, mood } = editForm.value

    if (!date) { ElMessage.error('请选择日期'); return }
    if (!clockInTime) { ElMessage.error('请填写上班时间'); return }

    if (clockOutTime) {
      const [inHour, inMinute] = clockInTime.split(':').map(Number)
      const [outHour, outMinute] = clockOutTime.split(':').map(Number)
      if (outHour * 60 + outMinute <= inHour * 60 + inMinute) {
        ElMessage.error('下班时间必须晚于上班时间')
        return
      }
    }

    let result
    if (isNew) {
      result = await addManualRecord(date, clockInTime, clockOutTime || '', status, weather, mood)
    } else {
      const updates = { clockInTime, clockOutTime: clockOutTime || '', status, weather, mood }
      if (editForm.value.totalSalary > 0) updates.totalSalary = editForm.value.totalSalary
      result = await editRecordApi(date, updates)
    }

    if (result.success) {
      ElMessage.success(isNew ? '补打卡成功' : '编辑成功')
      editDialogVisible.value = false
      await loadMonthData()
      selectedDay.value = null
    } else {
      ElMessage.error(result.message || '操作失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败，请重试')
  } finally {
    loading.value = false
  }
}

function openBatchDialog() {
  batchForm.value = {
    dateRange: [],
    clockInTime: '',
    clockOutTime: '',
    status: 'normal'
  }
  batchDialogVisible.value = true
}

async function saveBatch() {
  try {
    loading.value = true
    const { dateRange, clockInTime, clockOutTime, status } = batchForm.value

    if (!dateRange || dateRange.length !== 2 || !dateRange[0] || !dateRange[1]) {
      ElMessage.error('请选择日期范围'); return
    }
    if (!clockInTime) { ElMessage.error('请填写上班时间'); return }

    if (clockOutTime) {
      const [inHour, inMinute] = clockInTime.split(':').map(Number)
      const [outHour, outMinute] = clockOutTime.split(':').map(Number)
      if (outHour * 60 + outMinute <= inHour * 60 + inMinute) {
        ElMessage.error('下班时间必须晚于上班时间'); return
      }
    }

    const [start, end] = dateRange
    const startDate = new Date(start)
    const endDate = new Date(end)
    const records = []
    const current = new Date(startDate)
    while (current <= endDate) {
      records.push({
        date: formatDate(current),
        clockInTime,
        clockOutTime: clockOutTime || '',
        status
      })
      current.setDate(current.getDate() + 1)
    }

    const result = await addBatchRecords(records)
    if (result.success) {
      ElMessage.success(`批量补打卡成功，共创建 ${result.count} 条记录`)
      batchDialogVisible.value = false
      await loadMonthData()
      selectedDay.value = null
    } else {
      ElMessage.error(result.message || '批量补打卡失败')
    }
  } catch (error) {
    console.error('批量补打卡失败:', error)
    ElMessage.error('批量补打卡失败，请重试')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMonthData()
})
</script>

<style scoped>
/* =============================================
   LIGHT MODE — 明亮模式
   ============================================= */
.calendar {
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
  margin: 0;
  color: var(--el-text-color-primary, #303133);
  font-weight: 700;
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

.month-nav {
  display: flex;
  gap: 6px;
  align-items: center;
  background: var(--el-fill-color-light, #f5f7fa);
  padding: 4px 6px;
  border-radius: 24px;
}

.today-btn {
  font-weight: 600;
}

/* ---- 月度统计 ---- */
.month-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.stat-icon-work {
  background: rgba(64, 158, 255, 0.12);
  color: #409eff;
}
.stat-icon-salary {
  background: rgba(103, 194, 58, 0.12);
  color: #67c23a;
}
.stat-icon-overtime {
  background: rgba(230, 162, 60, 0.12);
  color: #e6a23c;
}
.stat-icon-late {
  background: rgba(245, 108, 108, 0.12);
  color: #f56c6c;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary, #303133);
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
}

/* ---- 星期行 ---- */
.calendar-container {
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 16px;
  overflow: hidden;
  background: var(--el-bg-color, #fff);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: var(--el-fill-color-light, #f5f7fa);
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
}

.weekday {
  padding: 14px 8px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  color: var(--el-text-color-regular, #606266);
}

.weekend-header {
  color: var(--el-color-danger, #f56c6c);
}

/* ---- 日期网格 ---- */
.days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.day {
  position: relative;
  min-height: 110px;
  border-right: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-left: 3px solid transparent;
  padding: 8px 8px 8px 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
}

.day:nth-child(7n) { border-right: none; }

.day:hover {
  background: var(--el-color-primary-light-9, #ecf5ff);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  z-index: 2;
}

.day.current-month {
  background: var(--el-bg-color, #fff);
}

.day:not(.current-month) {
  background: var(--el-fill-color-lighter, #fafafa);
  color: var(--el-text-color-placeholder, #c0c4cc);
}

/* 有记录日期按状态着色：左侧强调条 + 渐变背景 */
.day.record-normal {
  border-left-color: #67c23a;
  background: linear-gradient(135deg, #f0f9ef 0%, #fafdf8 100%);
}
.day.record-late {
  border-left-color: #e6a23c;
  background: linear-gradient(135deg, #fdf6ee 0%, #fefcfa 100%);
}
.day.record-early {
  border-left-color: #f56c6c;
  background: linear-gradient(135deg, #fef0f0 0%, #fef9f9 100%);
}
.day.record-absent {
  border-left-color: #909399;
  background: linear-gradient(135deg, #f2f3f5 0%, #f8f9fa 100%);
}

/* today + record：保留今日蓝框 + 状态左边条 */
.day.today.record-normal,
.day.today.record-late,
.day.today.record-early,
.day.today.record-absent {
  border-top: 2px solid var(--el-color-primary, #409eff);
  border-right: 2px solid var(--el-color-primary, #409eff);
  border-bottom: 2px solid var(--el-color-primary, #409eff);
}

/* selected + record：保留选中蓝框 + 状态左边条 */
.day.selected.record-normal,
.day.selected.record-late,
.day.selected.record-early,
.day.selected.record-absent {
  border-top-color: var(--el-color-primary, #409eff);
  border-right-color: var(--el-color-primary, #409eff);
  border-bottom-color: var(--el-color-primary, #409eff);
}

.day.today {
  border: 2px solid var(--el-color-primary, #409eff);
  background: linear-gradient(135deg, var(--el-color-primary-light-9, #ecf5ff) 0%, var(--el-bg-color, #fff) 60%);
}

.day.weekend.current-month {
  background: var(--el-fill-color-lighter, #f9f9f9);
}

/* 周末 + 打卡：覆盖周末灰色背景，保留打卡渐变 */
.day.weekend.record-normal { background: linear-gradient(135deg, #f0f9ef 0%, #fafdf8 100%); }
.day.weekend.record-late   { background: linear-gradient(135deg, #fdf6ee 0%, #fefcfa 100%); }
.day.weekend.record-early  { background: linear-gradient(135deg, #fef0f0 0%, #fef9f9 100%); }
.day.weekend.record-absent { background: linear-gradient(135deg, #f2f3f5 0%, #f8f9fa 100%); }

.day.selected {
  border-color: var(--el-color-primary, #409eff);
  border-width: 2px;
  background: linear-gradient(135deg, var(--el-color-primary-light-8, #d9ecff) 0%, var(--el-color-primary-light-9, #ecf5ff) 100%);
  box-shadow: 0 0 0 1px var(--el-color-primary, #409eff);
  z-index: 1;
}

/* ---- 天气/心情图标在单元格中 ---- */
.day-weather {
  position: absolute;
  top: 4px;
  right: 6px;
  font-size: 16px;
  line-height: 1;
  opacity: 0.85;
}

.day-mood {
  position: absolute;
  bottom: 4px;
  right: 6px;
  font-size: 14px;
  line-height: 1;
  opacity: 0.8;
}

.day-main {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.day-number {
  font-size: 17px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}

.day:not(.current-month) .day-number {
  opacity: 0.45;
}

.day-status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}
.day.has-record:hover .day-status-dot {
  transform: scale(1.25);
}

.dot-normal { background: #67c23a; box-shadow: 0 0 6px rgba(103, 194, 58, 0.45); }
.dot-late   { background: #e6a23c; box-shadow: 0 0 6px rgba(230, 162, 60, 0.45); }
.dot-early  { background: #f56c6c; box-shadow: 0 0 6px rgba(245, 108, 108, 0.45); }
.dot-absent { background: #909399; box-shadow: 0 0 6px rgba(144, 147, 153, 0.35); }

.day-status {
  margin-bottom: 2px;
}

.status-badge {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  font-weight: 500;
  display: inline-block;
  line-height: 1.6;
}

.badge-normal {
  background: rgba(103, 194, 58, 0.12);
  color: #67c23a;
}
.badge-late {
  background: rgba(230, 162, 60, 0.12);
  color: #e6a23c;
}
.badge-early {
  background: rgba(245, 108, 108, 0.12);
  color: #f56c6c;
}
.badge-absent {
  background: rgba(144, 147, 153, 0.12);
  color: #909399;
}

.day-salary {
  font-size: 12px;
  color: var(--el-color-success, #67c23a);
  font-weight: 500;
}

/* ---- 详情面板 ---- */
.day-detail {
  margin-top: 24px;
  padding: 20px 24px;
  border-radius: 16px;
  border: 1px solid var(--el-border-color-light, #e4e7ed);
  background: var(--el-bg-color, #fff);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-date {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-date-num {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary, #303133);
}

.detail-weather-mood {
  display: flex;
  gap: 16px;
  align-items: center;
}

.detail-icon-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 18px;
}

.detail-icon-label {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
}

.detail-no-record {
  font-size: 14px;
  color: var(--el-text-color-secondary, #909399);
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--el-fill-color-lighter, #fafafa);
  border-radius: 12px;
}

.detail-item-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-primary-light-9, #ecf5ff);
  color: var(--el-color-primary, #409eff);
  font-size: 16px;
  flex-shrink: 0;
}

.detail-item-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-item-label {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

.detail-item-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* ---- emoji 选择器 ---- */
.emoji-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.emoji-option {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 20px;
  cursor: pointer;
  background: var(--el-fill-color-lighter, #fafafa);
}

.emoji-option:hover {
  border-color: var(--el-color-primary-light-5, #a0cfff);
  background: var(--el-color-primary-light-9, #ecf5ff);
}

.emoji-option.selected {
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-8, #d9ecff);
  box-shadow: 0 0 0 1px var(--el-color-primary, #409eff);
}

.emoji-icon {
  font-size: 20px;
  line-height: 1;
}

.emoji-label {
  font-size: 13px;
  color: var(--el-text-color-regular, #606266);
  font-weight: 500;
}

.emoji-option.selected .emoji-label {
  color: var(--el-color-primary, #409eff);
}

/* ---- 其他组件 ---- */
.card-header { font-weight: 600; font-size: 15px; }
.preview-card { margin-top: 16px; }
.preview-list { max-height: 200px; overflow-y: auto; }
.preview-item {
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter, #f0f0f0);
  font-size: 14px;
  color: var(--el-text-color-regular, #606266);
}
.preview-item:last-child { border-bottom: none; }
.preview-item:hover { background: var(--el-fill-color-light, #f5f7fa); }
.form-help { font-size: 12px; color: var(--el-text-color-secondary, #909399); margin-top: 4px; }

/* =============================================
   DARK MODE — 深色模式（简洁高级风）
   ============================================= */

/* ---- 头部 ---- */
html.dark .header h1 {
  color: var(--el-text-color-primary, #e5eaf3);
}

html.dark .header-subtitle {
  color: var(--el-text-color-secondary, #a3a6ad);
}

html.dark .month-nav {
  background: var(--el-fill-color, #262727);
}

/* ---- 月度统计 ---- */
html.dark .stat-card {
  background: var(--el-bg-color, #1d1e1f);
  border-color: var(--el-border-color-light, #414243);
}

html.dark .stat-card:hover {
  border-color: var(--el-color-primary, #409eff);
}

html.dark .stat-value {
  color: var(--el-text-color-primary, #e5eaf3);
}

html.dark .stat-label {
  color: var(--el-text-color-secondary, #a3a6ad);
}

/* ---- 星期行 ---- */
html.dark .calendar-container {
  border-color: var(--el-border-color, #4c4d4f);
  background: var(--el-bg-color, #141414);
}

html.dark .weekdays {
  background: var(--el-fill-color, #262727);
  border-bottom-color: var(--el-border-color, #4c4d4f);
}

html.dark .weekday {
  color: var(--el-text-color-secondary, #a3a6ad);
}

html.dark .weekend-header {
  color: rgba(245, 108, 108, 0.65);
}

/* ---- 日期网格 ---- */
html.dark .day {
  border-right-color: var(--el-border-color-light, #414243);
  border-bottom-color: var(--el-border-color-light, #414243);
}

html.dark .day.current-month {
  background: var(--el-bg-color, #141414);
}

html.dark .day:not(.current-month) {
  background: var(--el-fill-color-lighter, #1a1a1b);
  color: var(--el-text-color-disabled, #6c6e72);
}

html.dark .day.weekend.current-month {
  background: var(--el-fill-color-light, #1e1e1f);
}

html.dark .day:hover {
  background: var(--el-color-primary-light-9, #18222b);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  z-index: 2;
}

/* 有记录按状态着色：左侧强调条 + 渐变背景 */
html.dark .day.record-normal {
  border-left-color: #67c23a;
  background: linear-gradient(135deg, #1a2218 0%, #1d261b 100%);
}
html.dark .day.record-late {
  border-left-color: #e6a23c;
  background: linear-gradient(135deg, #221a16 0%, #261e1a 100%);
}
html.dark .day.record-early {
  border-left-color: #f56c6c;
  background: linear-gradient(135deg, #221617 0%, #261a1b 100%);
}
html.dark .day.record-absent {
  border-left-color: #909399;
  background: linear-gradient(135deg, #1a1d22 0%, #1f2227 100%);
}

/* 今天：干净利落的顶部高亮线 */
html.dark .day.today {
  border-color: var(--el-border-color-light, #414243);
  border-top: 3px solid var(--el-color-primary, #409eff);
  background: var(--el-bg-color, #141414);
}

html.dark .day.today .day-number {
  color: var(--el-color-primary, #409eff);
  font-weight: 700;
}

html.dark .day.selected {
  border-color: var(--el-color-primary, #409eff);
  border-width: 2px;
  background: var(--el-bg-color, #141414);
}

html.dark .day.selected .day-number {
  color: var(--el-color-primary, #409eff);
}

/* 深色：today + record 和 selected + record 保留状态左边条 */
html.dark .day.today.record-normal,
html.dark .day.today.record-late,
html.dark .day.today.record-early,
html.dark .day.today.record-absent {
  border-top: 3px solid var(--el-color-primary, #409eff);
  border-right-color: var(--el-border-color-light, #414243);
  border-bottom-color: var(--el-border-color-light, #414243);
}

html.dark .day.selected.record-normal,
html.dark .day.selected.record-late,
html.dark .day.selected.record-early,
html.dark .day.selected.record-absent {
  border-top-color: var(--el-color-primary, #409eff);
  border-right-color: var(--el-color-primary, #409eff);
  border-bottom-color: var(--el-color-primary, #409eff);
}

/* 深色：周末 + 打卡 */
html.dark .day.weekend.record-normal { background: linear-gradient(135deg, #1a2218 0%, #1d261b 100%); }
html.dark .day.weekend.record-late   { background: linear-gradient(135deg, #221a16 0%, #261e1a 100%); }
html.dark .day.weekend.record-early  { background: linear-gradient(135deg, #221617 0%, #261a1b 100%); }
html.dark .day.weekend.record-absent { background: linear-gradient(135deg, #1a1d22 0%, #1f2227 100%); }

html.dark .day-number {
  color: var(--el-text-color-primary, #e5eaf3);
}

html.dark .day:not(.current-month) .day-number {
  opacity: 0.4;
}

/* ---- 详情面板（简洁实心卡） ---- */
html.dark .day-detail {
  background: var(--el-bg-color, #1d1e1f);
  border-color: var(--el-border-color-light, #414243);
  border-left: 3px solid var(--el-color-primary, #409eff);
}

html.dark .detail-date-num {
  color: var(--el-text-color-primary, #e5eaf3);
}

html.dark .detail-item {
  background: var(--el-fill-color-lighter, #1a1a1b);
}

html.dark .detail-item-icon {
  background: rgba(64, 158, 255, 0.1);
  color: var(--el-color-primary, #409eff);
}

html.dark .detail-item-label {
  color: var(--el-text-color-secondary, #a3a6ad);
}

html.dark .detail-item-value {
  color: var(--el-text-color-primary, #e5eaf3);
}

html.dark .detail-icon-label {
  color: var(--el-text-color-secondary, #a3a6ad);
}

/* ---- emoji 选择器 ---- */
html.dark .emoji-option {
  border-color: var(--el-border-color, #4c4d4f);
  background: var(--el-fill-color-lighter, #1a1a1b);
}

html.dark .emoji-option:hover {
  border-color: var(--el-color-primary-light-5, #2a598a);
  background: var(--el-color-primary-light-9, #18222b);
}

html.dark .emoji-option.selected {
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #18222b);
}

html.dark .emoji-option .emoji-label {
  color: var(--el-text-color-regular, #cfd3dc);
}

html.dark .emoji-option.selected .emoji-label {
  color: var(--el-color-primary, #409eff);
}

/* ---- 预览 & 帮助 ---- */
html.dark .preview-item {
  border-bottom-color: var(--el-border-color-light, #414243);
  color: var(--el-text-color-regular, #cfd3dc);
}

html.dark .preview-item:hover {
  background: var(--el-fill-color-light, #262727);
}

html.dark .form-help {
  color: var(--el-text-color-secondary, #a3a6ad);
}
</style>
