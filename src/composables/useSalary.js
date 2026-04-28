// 工资相关组合式函数
import { ref, computed } from 'vue'
import attendanceDB from '../db/index.js'
import { calculateMonthlySalary, generateMonthlySummary, validateSalarySettings } from '../utils/salary.js'
import { getMonthString, getFirstDayOfMonth, getLastDayOfMonth, calculateWorkdays } from '../utils/date.js'

export function useSalary() {
  // 状态
  const salarySettings = ref(null)
  const monthlySummaries = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 加载工资设置
  async function loadSalarySettings() {
    try {
      loading.value = true
      const settings = await attendanceDB.getSalarySettings()
      salarySettings.value = settings
      return { success: true, settings }
    } catch (err) {
      error.value = err.message
      console.error('加载工资设置失败:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  // 保存工资设置
  async function saveSalarySettings(newSettings) {
    try {
      loading.value = true

      // 验证设置
      const validationErrors = validateSalarySettings(newSettings)
      if (validationErrors.length > 0) {
        error.value = validationErrors.join(', ')
        return { success: false, message: validationErrors.join(', ') }
      }

      // 保存到数据库
      await attendanceDB.saveSalarySettings(newSettings)
      salarySettings.value = newSettings

      return { success: true, settings: newSettings }
    } catch (err) {
      error.value = err.message
      console.error('保存工资设置失败:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  // 计算月度工资
  async function calculateMonthSalary(yearMonth) {
    try {
      loading.value = true

      // 获取该月打卡记录
      const records = await attendanceDB.getPunchRecordsByMonth(yearMonth)
      if (!records || records.length === 0) {
        return { success: true, summary: null }
      }

      // 获取工资设置
      const settings = salarySettings.value || await attendanceDB.getSalarySettings()

      // 计算月度工资
      const salaryStats = calculateMonthlySalary(records, settings)

      // 生成月度统计
      const summary = generateMonthlySummary(records, settings)

      // 保存月度统计
      await attendanceDB.saveMonthlySummary(summary)

      return { success: true, summary, records, salaryStats }
    } catch (err) {
      error.value = err.message
      console.error('计算月度工资失败:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  // 获取月度统计
  async function getMonthlySummary(yearMonth) {
    try {
      loading.value = true
      const summary = await attendanceDB.getMonthlySummary(yearMonth)
      return { success: true, summary }
    } catch (err) {
      error.value = err.message
      console.error('获取月度统计失败:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  // 获取所有月度统计
  async function loadAllMonthlySummaries() {
    try {
      loading.value = true
      const summaries = await attendanceDB.getAll(attendanceDB.STORES.MONTHLY_SUMMARIES)
      monthlySummaries.value = summaries
      return { success: true, summaries }
    } catch (err) {
      error.value = err.message
      console.error('加载月度统计失败:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  // 计算预计月薪
  function estimateMonthlySalary(currentDate = new Date()) {
    if (!salarySettings.value) return 0

    const monthStart = getFirstDayOfMonth(currentDate)
    const monthEnd = getLastDayOfMonth(currentDate)
    const today = new Date()

    // 计算本月总工作天数
    const totalWorkdays = calculateWorkdays(monthStart, monthEnd)

    // 计算已过工作天数
    const passedWorkdays = calculateWorkdays(monthStart, today > monthEnd ? monthEnd : today)

    // 计算已出勤天数（需要从数据库获取）
    // 这里简化处理，假设已出勤天数等于已过工作天数
    const attendedDays = passedWorkdays

    // 计算已得工资（需要从数据库获取本月记录计算）
    // 这里简化处理，假设每天都是正常日薪
    const earnedSalary = attendedDays * salarySettings.value.dailySalary

    // 计算预计月薪
    if (attendedDays === 0) return 0
    const averageDailySalary = earnedSalary / attendedDays
    const estimatedSalary = averageDailySalary * totalWorkdays

    return estimatedSalary
  }

  // 计算当前月至今的工资
  async function calculateCurrentMonthToDate() {
    try {
      loading.value = true

      const currentMonth = getMonthString(new Date())
      const records = await attendanceDB.getPunchRecordsByMonth(currentMonth)

      if (!records || records.length === 0) {
        return { success: true, totalSalary: 0, workDays: 0 }
      }

      const settings = salarySettings.value || await attendanceDB.getSalarySettings()
      const salaryStats = calculateMonthlySalary(records, settings)

      return {
        success: true,
        totalSalary: salaryStats.totalSalary,
        workDays: salaryStats.workDays,
        overtimeDays: salaryStats.overtimeDays,
        totalOvertimeHours: salaryStats.totalOvertimeHours
      }
    } catch (err) {
      error.value = err.message
      console.error('计算当月至今工资失败:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  // 导出数据
  async function exportData() {
    try {
      loading.value = true
      const data = await attendanceDB.exportData()
      return { success: true, data }
    } catch (err) {
      error.value = err.message
      console.error('导出数据失败:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  // 导入数据
  async function importData(data) {
    try {
      loading.value = true
      await attendanceDB.importData(data)

      // 重新加载设置和统计
      await loadSalarySettings()
      await loadAllMonthlySummaries()

      return { success: true }
    } catch (err) {
      error.value = err.message
      console.error('导入数据失败:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  // 计算属性：格式化日薪
  const formattedDailySalary = computed(() => {
    if (!salarySettings.value) return '¥0.00'
    return `¥${salarySettings.value.dailySalary.toFixed(2)}`
  })

  // 计算属性：预计月薪
  const estimatedMonthlySalary = computed(() => {
    return estimateMonthlySalary()
  })

  return {
    // 状态
    salarySettings,
    monthlySummaries,
    loading,
    error,

    // 计算属性
    formattedDailySalary,
    estimatedMonthlySalary,

    // 方法
    loadSalarySettings,
    saveSalarySettings,
    calculateMonthSalary,
    getMonthlySummary,
    loadAllMonthlySummaries,
    calculateCurrentMonthToDate,
    estimateMonthlySalary,
    exportData,
    importData
  }
}