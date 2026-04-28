// 工资计算工具函数
import { isWeekend, getHoursDiff } from './date.js'

// 计算当日工资（纯日薪制：按日计算，不按小时计算）
export function calculateDailySalary(punchRecord, salarySettings) {
  const { dailySalary, weekendMultiplier } = salarySettings

  // 如果是周末，应用周末倍数；否则按基础日薪
  return punchRecord.isWeekend ? dailySalary * weekendMultiplier : dailySalary
}

// 计算总工作时长
export function calculateWorkHours(clockInTime, clockOutTime) {
  return getHoursDiff(clockInTime, clockOutTime)
}

// 计算加班时长
export function calculateOvertimeHours(clockInTime, clockOutTime, workHours = 8) {
  const actualHours = calculateWorkHours(clockInTime, clockOutTime)
  const overtimeHours = Math.max(0, actualHours - workHours)
  return overtimeHours
}

// 计算月度总工资
export function calculateMonthlySalary(punchRecords, salarySettings) {
  let totalSalary = 0
  let workDays = 0
  let overtimeDays = 0
  let totalOvertimeHours = 0

  punchRecords.forEach(record => {
    totalSalary += record.totalSalary || 0
    if (record.status === 'normal' || record.status === 'late' || record.status === 'early') {
      workDays++
    }
    if (record.isOvertime) {
      overtimeDays++
      totalOvertimeHours += record.overtimeHours || 0
    }
  })

  return {
    totalSalary,
    workDays,
    overtimeDays,
    totalOvertimeHours,
    averageDailySalary: workDays > 0 ? totalSalary / workDays : 0
  }
}

// 生成月度统计
export function generateMonthlySummary(punchRecords, salarySettings) {
  const salaryStats = calculateMonthlySalary(punchRecords, salarySettings)

  // 计算迟到/早退天数
  let lateDays = 0
  let earlyDays = 0
  let absentDays = 0

  punchRecords.forEach(record => {
    if (record.status === 'late') lateDays++
    if (record.status === 'early') earlyDays++
    if (record.status === 'absent') absentDays++
  })

  // 获取月份
  const month = punchRecords.length > 0 ? punchRecords[0].month : '未知'

  return {
    id: month,
    month,
    totalWorkDays: punchRecords.length,
    actualWorkDays: salaryStats.workDays,
    lateDays,
    earlyDays,
    absentDays,
    overtimeDays: salaryStats.overtimeDays,
    totalOvertimeHours: salaryStats.totalOvertimeHours,
    baseSalary: salaryStats.totalSalary,
    totalSalary: salaryStats.totalSalary,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

// 检查是否需要加班（超过8小时）
export function checkOvertime(clockInTime, clockOutTime, workHours = 8) {
  const actualHours = getHoursDiff(clockInTime, clockOutTime)
  return actualHours > workHours
}

// 计算加班工资
export function calculateOvertimeSalary(overtimeHours, dailySalary, multiplier = 1) {
  const hourlyRate = dailySalary / 8
  return hourlyRate * overtimeHours * multiplier
}

// 格式化金额（保留两位小数）
export function formatCurrency(amount) {
  return `¥${amount.toFixed(2)}`
}

// 计算平均日薪
export function calculateAverageDailySalary(totalSalary, workDays) {
  return workDays > 0 ? totalSalary / workDays : 0
}

// 计算预计月薪（基于已出勤天数）
export function estimateMonthlySalary(currentSalary, currentWorkDays, totalWorkDaysInMonth) {
  if (currentWorkDays === 0) return 0
  const averageDailySalary = currentSalary / currentWorkDays
  return averageDailySalary * totalWorkDaysInMonth
}

// 计算周末加班工资
export function calculateWeekendOvertimeSalary(overtimeHours, dailySalary, weekendMultiplier) {
  const hourlyRate = dailySalary / 8
  return hourlyRate * overtimeHours * weekendMultiplier
}

// 验证工资设置
export function validateSalarySettings(settings) {
  const errors = []

  if (!settings.dailySalary || settings.dailySalary <= 0) {
    errors.push('日薪必须大于0')
  }

  if (!settings.weekendMultiplier || settings.weekendMultiplier < 1) {
    errors.push('周末加班倍数必须大于等于1')
  }

  // 验证标准上班时间格式 HH:mm
  if (!settings.standardClockInTime || !/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(settings.standardClockInTime)) {
    errors.push('标准上班时间格式无效，请使用HH:mm格式')
  }

  // 验证标准下班时间格式 HH:mm
  if (!settings.standardClockOutTime || !/^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(settings.standardClockOutTime)) {
    errors.push('标准下班时间格式无效，请使用HH:mm格式')
  }

  // 验证下班时间晚于上班时间
  if (settings.standardClockInTime && settings.standardClockOutTime) {
    const [inHour, inMinute] = settings.standardClockInTime.split(':').map(Number)
    const [outHour, outMinute] = settings.standardClockOutTime.split(':').map(Number)
    const inTotal = inHour * 60 + inMinute
    const outTotal = outHour * 60 + outMinute
    if (outTotal <= inTotal) {
      errors.push('标准下班时间必须晚于标准上班时间')
    }
  }

  return errors
}