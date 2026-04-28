// 打卡相关组合式函数
import { ref, computed } from 'vue'
import attendanceDB from '../db/index.js'
import { formatDate, formatTime, isWeekend, getCurrentTimestamp, getMonthString, combineDateTime, getTimeFromTimestamp, isValidTimeString, isValidDateString } from '../utils/date.js'
import { calculateWorkHours, calculateOvertimeHours, checkOvertime, calculateDailySalary } from '../utils/salary.js'

export function useAttendance() {
  // 状态
  const todayRecord = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // 根据打卡时间判断状态
  function determineStatus(clockInTimeStr, clockOutTimeStr, salarySettings) {
    if (!clockInTimeStr) return 'absent' // 未上班打卡视为缺勤

    const [standardInHour, standardInMinute] = salarySettings.standardClockInTime.split(':').map(Number)
    const standardInTotal = standardInHour * 60 + standardInMinute

    const [actualInHour, actualInMinute] = clockInTimeStr.split(':').map(Number)
    const actualInTotal = actualInHour * 60 + actualInMinute

    // 上班打卡晚于标准上班时间视为迟到
    if (actualInTotal > standardInTotal) {
      return 'late'
    }

    // 如果没有下班打卡或下班时间为空字符串
    if (!clockOutTimeStr || clockOutTimeStr.trim() === '') {
      // 只有上班打卡，没有下班打卡，状态取决于是否已过标准下班时间
      const [standardOutHour, standardOutMinute] = salarySettings.standardClockOutTime.split(':').map(Number)
      const standardOutTotal = standardOutHour * 60 + standardOutMinute
      const now = new Date()
      const currentTotal = now.getHours() * 60 + now.getMinutes()
      // 如果当前时间已过标准下班时间，且未打卡下班，视为早退
      if (currentTotal > standardOutTotal) {
        return 'early'
      }
      return 'normal' // 未到下班时间，状态正常
    }

    // 有下班打卡
    const [standardOutHour, standardOutMinute] = salarySettings.standardClockOutTime.split(':').map(Number)
    const standardOutTotal = standardOutHour * 60 + standardOutMinute
    const [actualOutHour, actualOutMinute] = clockOutTimeStr.split(':').map(Number)
    const actualOutTotal = actualOutHour * 60 + actualOutMinute

    // 下班打卡早于标准下班时间视为早退
    if (actualOutTotal < standardOutTotal) {
      return 'early'
    }

    return 'normal'
  }

  // 获取今天的打卡记录
  async function loadTodayRecord() {
    try {
      loading.value = true
      const today = formatDate(new Date())
      const record = await attendanceDB.getPunchRecord(today)
      todayRecord.value = record
      return record
    } catch (err) {
      error.value = err.message
      console.error('加载今日记录失败:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // 上班打卡
  async function clockIn() {
    try {
      loading.value = true
      const now = new Date()
      const today = formatDate(now)
      const currentTime = formatTime(now)

      // 检查是否已打卡
      const existing = await attendanceDB.getPunchRecord(today)
      if (existing && existing.clockInTime) {
        error.value = '今日已上班打卡'
        return { success: false, message: '今日已上班打卡' }
      }

      // 创建打卡记录
      const record = {
        date: today,
        month: getMonthString(now),
        clockInTime: getCurrentTimestamp(),
        clockInTimeDisplay: currentTime,
        isWeekend: isWeekend(now),
        status: 'normal', // 默认正常，下面会重新计算
        isOvertime: false,
        overtimeHours: 0,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
      }

      // 获取工资设置
      const salarySettings = await attendanceDB.getSalarySettings()
      record.dailySalary = salarySettings.dailySalary
      record.weekendMultiplier = salarySettings.weekendMultiplier
      // 根据标准时间判断状态
      record.status = determineStatus(currentTime, null, salarySettings)

      // 保存记录
      await attendanceDB.savePunchRecord(record)
      todayRecord.value = record

      return { success: true, record }
    } catch (err) {
      error.value = err.message
      console.error('上班打卡失败:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  // 下班打卡
  async function clockOut() {
    try {
      loading.value = true
      const now = new Date()
      const today = formatDate(now)
      const currentTime = formatTime(now)

      // 获取今日记录
      const record = await attendanceDB.getPunchRecord(today)
      if (!record) {
        error.value = '请先上班打卡'
        return { success: false, message: '请先上班打卡' }
      }

      if (record.clockOutTime) {
        error.value = '今日已下班打卡'
        return { success: false, message: '今日已下班打卡' }
      }

      // 更新下班时间
      record.clockOutTime = getCurrentTimestamp()
      record.clockOutTimeDisplay = currentTime
      record.updatedAt = getCurrentTimestamp()

      // 计算工作时长
      const workHours = calculateWorkHours(record.clockInTime, record.clockOutTime)
      record.workHours = workHours

      // 检查是否加班
      record.isOvertime = checkOvertime(record.clockInTime, record.clockOutTime)
      if (record.isOvertime) {
        record.overtimeHours = calculateOvertimeHours(record.clockInTime, record.clockOutTime) // 假设8小时工作制
      }

      // 计算当日工资
      const salarySettings = await attendanceDB.getSalarySettings()
      record.totalSalary = calculateDailySalary(record, salarySettings)

      // 更新状态
      // 根据标准时间判断迟到/早退
      record.status = determineStatus(record.clockInTimeDisplay, record.clockOutTimeDisplay, salarySettings)

      // 保存记录
      await attendanceDB.savePunchRecord(record)
      todayRecord.value = record

      return { success: true, record }
    } catch (err) {
      error.value = err.message
      console.error('下班打卡失败:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  // 手动添加打卡记录（补打卡）
  async function addManualRecord(date, clockInTime, clockOutTime, status = 'normal', weather = '', mood = '') {
    try {
      loading.value = true

      // 验证输入
      if (!isValidDateString(date)) {
        error.value = '日期格式无效'
        return { success: false, message: '日期格式无效，请使用YYYY-MM-DD格式' }
      }

      if (!isValidTimeString(clockInTime)) {
        error.value = '上班时间格式无效'
        return { success: false, message: '上班时间格式无效，请使用HH:mm格式' }
      }

      if (clockOutTime && !isValidTimeString(clockOutTime)) {
        error.value = '下班时间格式无效'
        return { success: false, message: '下班时间格式无效，请使用HH:mm格式' }
      }

      // 检查是否为未来日期
      const today = formatDate(new Date())
      if (date > today) {
        error.value = '不能补打卡未来的日期'
        return { success: false, message: '不能补打卡未来的日期' }
      }

      // 检查是否已存在该日期的记录
      const existing = await attendanceDB.getPunchRecord(date)
      if (existing) {
        error.value = '该日期已有打卡记录'
        return { success: false, message: '该日期已有打卡记录，请使用编辑功能' }
      }

      // 创建打卡记录对象
      const recordDate = new Date(date)
      const record = {
        date: date,
        month: getMonthString(recordDate),
        clockInTime: combineDateTime(date, clockInTime),
        clockInTimeDisplay: clockInTime,
        isWeekend: isWeekend(recordDate),
        status: status, // 临时值，后面会根据标准时间重新判断
        weather: weather,
        mood: mood,
        isOvertime: false,
        overtimeHours: 0,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp()
      }

      // 如果有下班时间，添加下班时间并计算工作时长
      if (clockOutTime) {
        record.clockOutTime = combineDateTime(date, clockOutTime)
        record.clockOutTimeDisplay = clockOutTime

        // 计算工作时长
        const workHours = calculateWorkHours(record.clockInTime, record.clockOutTime)
        record.workHours = workHours

        // 检查是否加班
        record.isOvertime = checkOvertime(record.clockInTime, record.clockOutTime)
        if (record.isOvertime) {
          record.overtimeHours = calculateOvertimeHours(record.clockInTime, record.clockOutTime) // 假设8小时工作制
        }
      }

      // 获取工资设置并计算工资
      const salarySettings = await attendanceDB.getSalarySettings()
      record.dailySalary = salarySettings.dailySalary
      record.weekendMultiplier = salarySettings.weekendMultiplier
      // 如果状态是'normal'，根据标准时间自动判断迟到/早退
      if (status === 'normal') {
        record.status = determineStatus(clockInTime, clockOutTime, salarySettings)
      }
      record.totalSalary = calculateDailySalary(record, salarySettings)

      // 保存记录
      await attendanceDB.savePunchRecord(record)

      // 如果是今天的记录，更新本地状态
      if (date === formatDate(new Date())) {
        todayRecord.value = record
      }

      return { success: true, record }
    } catch (err) {
      error.value = err.message
      console.error('添加手动记录失败:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  // 批量补打卡
  async function addBatchRecords(records) {
    try {
      loading.value = true
      error.value = null

      // 验证所有记录
      const validatedRecords = []
      for (const record of records) {
        const { date, clockInTime, clockOutTime, status = 'normal' } = record

        // 验证输入
        if (!isValidDateString(date)) {
          error.value = `日期格式无效: ${date}`
          return { success: false, message: `日期格式无效: ${date}` }
        }

        if (!isValidTimeString(clockInTime)) {
          error.value = `上班时间格式无效: ${clockInTime}`
          return { success: false, message: `上班时间格式无效: ${clockInTime}` }
        }

        if (clockOutTime && !isValidTimeString(clockOutTime)) {
          error.value = `下班时间格式无效: ${clockOutTime}`
          return { success: false, message: `下班时间格式无效: ${clockOutTime}` }
        }

        // 检查是否为未来日期
        const today = formatDate(new Date())
        if (date > today) {
          error.value = `不能补打卡未来的日期: ${date}`
          return { success: false, message: `不能补打卡未来的日期: ${date}` }
        }

        // 检查是否已存在该日期的记录
        const existing = await attendanceDB.getPunchRecord(date)
        if (existing) {
          error.value = `该日期已有打卡记录: ${date}`
          return { success: false, message: `该日期已有打卡记录: ${date}` }
        }

        // 创建打卡记录对象
        const recordDate = new Date(date)
        const punchRecord = {
          date: date,
          month: getMonthString(recordDate),
          clockInTime: combineDateTime(date, clockInTime),
          clockInTimeDisplay: clockInTime,
          isWeekend: isWeekend(recordDate),
          status: status,
          isOvertime: false,
          overtimeHours: 0,
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp()
        }

        // 如果有下班时间，添加下班时间并计算工作时长
        if (clockOutTime) {
          punchRecord.clockOutTime = combineDateTime(date, clockOutTime)
          punchRecord.clockOutTimeDisplay = clockOutTime

          // 计算工作时长
          const workHours = calculateWorkHours(punchRecord.clockInTime, punchRecord.clockOutTime)
          punchRecord.workHours = workHours

          // 检查是否加班
          punchRecord.isOvertime = checkOvertime(punchRecord.clockInTime, punchRecord.clockOutTime)
          if (punchRecord.isOvertime) {
            punchRecord.overtimeHours = calculateOvertimeHours(punchRecord.clockInTime, punchRecord.clockOutTime) // 假设8小时工作制
          }
        }

        validatedRecords.push(punchRecord)
      }

      // 获取工资设置并计算工资
      const salarySettings = await attendanceDB.getSalarySettings()
      validatedRecords.forEach(record => {
        record.dailySalary = salarySettings.dailySalary
        record.weekendMultiplier = salarySettings.weekendMultiplier

        // 如果状态是'normal'，根据标准时间自动判断迟到/早退
        if (record.status === 'normal') {
          record.status = determineStatus(record.clockInTimeDisplay, record.clockOutTimeDisplay, salarySettings)
        }

        record.totalSalary = calculateDailySalary(record, salarySettings)
      })

      // 批量保存记录
      await attendanceDB.savePunchRecords(validatedRecords)

      return { success: true, count: validatedRecords.length }
    } catch (err) {
      error.value = err.message
      console.error('批量补打卡失败:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  // 手动编辑打卡记录
  async function editRecord(date, updates) {
    try {
      loading.value = true

      // 验证日期格式
      if (!isValidDateString(date)) {
        error.value = '日期格式无效'
        return { success: false, message: '日期格式无效，请使用YYYY-MM-DD格式' }
      }

      const record = await attendanceDB.getPunchRecord(date)
      if (!record) {
        error.value = '记录不存在'
        return { success: false, message: '记录不存在' }
      }

      // 获取工资设置用于状态判断
      const salarySettings = await attendanceDB.getSalarySettings()

      // 处理时间更新
      if (updates.clockInTime) {
        if (!isValidTimeString(updates.clockInTime)) {
          error.value = '上班时间格式无效'
          return { success: false, message: '上班时间格式无效，请使用HH:mm格式' }
        }
        record.clockInTime = combineDateTime(date, updates.clockInTime)
        record.clockInTimeDisplay = updates.clockInTime
      }

      if (updates.clockOutTime !== undefined) {
        if (updates.clockOutTime === '' || updates.clockOutTime === null) {
          // 清空下班时间
          record.clockOutTime = null
          record.clockOutTimeDisplay = ''
          record.workHours = 0
          record.isOvertime = false
          record.overtimeHours = 0
        } else if (isValidTimeString(updates.clockOutTime)) {
          record.clockOutTime = combineDateTime(date, updates.clockOutTime)
          record.clockOutTimeDisplay = updates.clockOutTime

          // 重新计算工作时长（需要上班时间）
          const clockInTime = record.clockInTime || combineDateTime(date, '09:00') // 默认9点
          const workHours = calculateWorkHours(clockInTime, record.clockOutTime)
          record.workHours = workHours

          // 检查是否加班
          record.isOvertime = checkOvertime(clockInTime, record.clockOutTime)
          if (record.isOvertime) {
            record.overtimeHours = calculateOvertimeHours(clockInTime, record.clockOutTime) // 假设8小时工作制
          }
        } else {
          error.value = '下班时间格式无效'
          return { success: false, message: '下班时间格式无效，请使用HH:mm格式' }
        }
      }

      // 如果传入了自定义工资，直接使用
      if (updates.totalSalary !== undefined) {
        record.totalSalary = updates.totalSalary
      }

      // 更新其他字段
      if (updates.status) {
        // 如果用户明确设置了状态，使用用户设置
        // 但如果用户设置为'normal'，则根据标准时间自动判断
        if (updates.status === 'normal') {
          // 根据标准时间自动判断迟到/早退
          record.status = determineStatus(
            record.clockInTimeDisplay,
            record.clockOutTimeDisplay,
            salarySettings
          )
        } else {
          record.status = updates.status
        }
      } else {
        // 用户没有设置状态，但可能更新了时间，需要重新判断状态
        if (updates.clockInTime !== undefined || updates.clockOutTime !== undefined) {
          record.status = determineStatus(
            record.clockInTimeDisplay,
            record.clockOutTimeDisplay,
            salarySettings
          )
        }
        // 否则保持原有状态
      }

      // 更新天气和心情
      if (updates.weather !== undefined) {
        record.weather = updates.weather
      }
      if (updates.mood !== undefined) {
        record.mood = updates.mood
      }

      record.updatedAt = getCurrentTimestamp()

      // 如果没有手动设置工资，则自动重新计算
      if (updates.totalSalary === undefined) {
        record.totalSalary = calculateDailySalary(record, salarySettings)
      }

      await attendanceDB.savePunchRecord(record)

      // 如果是今天的记录，更新本地状态
      if (date === formatDate(new Date())) {
        todayRecord.value = record
      }

      return { success: true, record }
    } catch (err) {
      error.value = err.message
      console.error('编辑记录失败:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  // 获取月度记录
  async function getMonthlyRecords(yearMonth) {
    try {
      loading.value = true
      const records = await attendanceDB.getPunchRecordsByMonth(yearMonth)
      return { success: true, records }
    } catch (err) {
      error.value = err.message
      console.error('获取月度记录失败:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  // 获取所有记录
  async function getAllRecords() {
    try {
      loading.value = true
      const records = await attendanceDB.getAllPunchRecords()
      return { success: true, records }
    } catch (err) {
      error.value = err.message
      console.error('获取所有记录失败:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  // 删除记录
  async function deleteRecord(date) {
    try {
      loading.value = true
      const record = await attendanceDB.getPunchRecord(date)
      if (!record) {
        error.value = '记录不存在'
        return { success: false, message: '记录不存在' }
      }

      await attendanceDB.delete(attendanceDB.STORES.PUNCH_RECORDS, record.id)

      // 如果是今天的记录，清空本地状态
      if (date === formatDate(new Date())) {
        todayRecord.value = null
      }

      return { success: true }
    } catch (err) {
      error.value = err.message
      console.error('删除记录失败:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  // 计算今日状态
  const todayStatus = computed(() => {
    const record = todayRecord.value
    if (!record) return '未打卡'

    if (record.clockInTime && !record.clockOutTime) {
      return '已上班，未下班'
    }

    if (record.clockInTime && record.clockOutTime) {
      return '已完成打卡'
    }

    return '未知状态'
  })

  // 计算今日工作时长
  const todayWorkHours = computed(() => {
    const record = todayRecord.value
    if (!record || !record.clockInTime) return 0

    const endTime = record.clockOutTime ? new Date(record.clockOutTime) : new Date()
    const hours = (endTime - new Date(record.clockInTime)) / (1000 * 60 * 60)
    return hours
  })

  return {
    // 状态
    todayRecord,
    loading,
    error,

    // 计算属性
    todayStatus,
    todayWorkHours,

    // 方法
    loadTodayRecord,
    clockIn,
    clockOut,
    addManualRecord,
    addBatchRecords,
    editRecord,
    getMonthlyRecords,
    getAllRecords,
    deleteRecord
  }
}