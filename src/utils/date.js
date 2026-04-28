// 日期工具函数

// 格式化日期为YYYY-MM-DD
export function formatDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化时间为HH:MM
export function formatTime(date) {
  const d = new Date(date)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

// 获取今天的日期字符串（YYYY-MM-DD）
export function getToday() {
  return formatDate(new Date())
}

// 判断是否为周末（周六或周日）
export function isWeekend(date) {
  const d = new Date(date)
  const day = d.getDay() // 0=周日, 1=周一, ..., 6=周六
  return day === 0 || day === 6
}

// 判断是否为同一天
export function isSameDay(date1, date2) {
  return formatDate(date1) === formatDate(date2)
}

// 获取月份字符串（YYYY-MM）
export function getMonthString(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

// 获取月份的第一天
export function getFirstDayOfMonth(date) {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

// 获取月份的最后一天
export function getLastDayOfMonth(date) {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

// 获取月份的所有日期
export function getDaysInMonth(year, month) {
  const date = new Date(year, month - 1, 1)
  const days = []
  while (date.getMonth() === month - 1) {
    days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  return days
}

// 计算两个时间之间的小时差
export function getHoursDiff(startTime, endTime) {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diffMs = end - start
  return diffMs / (1000 * 60 * 60) // 转换为小时
}

// 获取当前时间戳
export function getCurrentTimestamp() {
  return new Date().toISOString()
}

// 解析日期字符串为Date对象
export function parseDate(dateString) {
  // 支持YYYY-MM-DD格式
  const parts = dateString.split('-')
  if (parts.length === 3) {
    return new Date(parts[0], parts[1] - 1, parts[2])
  }
  return new Date(dateString)
}

// 获取日期的星期几（中文）
export function getWeekdayChinese(date) {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const d = new Date(date)
  return weekdays[d.getDay()]
}

// 获取日期的星期几（英文缩写）
export function getWeekdayAbbr(date) {
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const d = new Date(date)
  return weekdays[d.getDay()]
}

// 计算工作天数（排除周末）
export function calculateWorkdays(startDate, endDate) {
  let count = 0
  const current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) { // 不是周末
      count++
    }
    current.setDate(current.getDate() + 1)
  }

  return count
}

// 日期加减天数
export function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// 将日期字符串和时间字符串组合为ISO时间戳
export function combineDateTime(dateStr, timeStr) {
  // dateStr格式: YYYY-MM-DD, timeStr格式: HH:mm
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)

  const date = new Date(year, month - 1, day, hours, minutes, 0, 0)
  return date.toISOString()
}

// 从时间戳获取时间字符串（HH:mm）
export function getTimeFromTimestamp(timestamp) {
  const date = new Date(timestamp)
  return formatTime(date)
}

// 验证时间字符串格式（HH:mm）
export function isValidTimeString(timeStr) {
  const regex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
  return regex.test(timeStr)
}

// 验证日期字符串格式（YYYY-MM-DD）
export function isValidDateString(dateStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateStr)) return false

  const date = new Date(dateStr)
  return date instanceof Date && !isNaN(date.getTime())
}