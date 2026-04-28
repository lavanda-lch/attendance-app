// IndexedDB数据库封装
const DB_NAME = 'attendance_db'
const DB_VERSION = 1

// 对象存储名称
const STORES = {
  SALARY_SETTINGS: 'salary_settings',
  PUNCH_RECORDS: 'punch_records',
  MONTHLY_SUMMARIES: 'monthly_summaries'
}

class AttendanceDB {
  constructor() {
    this.db = null
    this.ready = this.init()
  }

  // 初始化数据库
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event) => {
        const db = event.target.result

        // 创建工资设置存储
        if (!db.objectStoreNames.contains(STORES.SALARY_SETTINGS)) {
          const store = db.createObjectStore(STORES.SALARY_SETTINGS, { keyPath: 'id' })
          // 只有一个设置，使用固定id
        }

        // 创建打卡记录存储
        if (!db.objectStoreNames.contains(STORES.PUNCH_RECORDS)) {
          const store = db.createObjectStore(STORES.PUNCH_RECORDS, { keyPath: 'id' })
          store.createIndex('date', 'date', { unique: false })
          store.createIndex('month', 'month', { unique: false })
        }

        // 创建月度统计存储
        if (!db.objectStoreNames.contains(STORES.MONTHLY_SUMMARIES)) {
          const store = db.createObjectStore(STORES.MONTHLY_SUMMARIES, { keyPath: 'id' })
        }
      }

      request.onsuccess = (event) => {
        this.db = event.target.result
        console.log('数据库初始化成功')
        resolve()
      }

      request.onerror = (event) => {
        console.error('数据库初始化失败:', event.target.error)
        reject(event.target.error)
      }
    })
  }

  // 通用添加方法
  async add(storeName, data) {
    await this.ready
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.add(data)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // 批量添加方法
  async addAll(storeName, records) {
    await this.ready
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)

      // 为每条记录生成ID（如果不存在）
      records.forEach(record => {
        if (!record.id) {
          record.id = this.generateId()
        }
        store.add(record)
      })

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }

  // 通用更新方法
  async update(storeName, data) {
    await this.ready
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // 通用获取方法（通过主键）
  async get(storeName, key) {
    await this.ready
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // 通用获取所有方法
  async getAll(storeName) {
    await this.ready
    // 防御性检查
    if (!this.db) {
      console.warn('数据库连接未就绪，重新等待')
      await this.ready
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // 通用删除方法
  async delete(storeName, key) {
    await this.ready
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // 通过索引查询
  async getByIndex(storeName, indexName, value) {
    await this.ready
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const index = store.index(indexName)
      const request = index.getAll(value)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // 工资设置相关方法
  async getSalarySettings() {
    const settings = await this.get(STORES.SALARY_SETTINGS, 'primary')
    if (!settings) {
      // 返回默认设置
      return {
        id: 'primary',
        dailySalary: 300,
        weekendMultiplier: 2,
        standardClockInTime: '09:00', // 标准上班时间
        standardClockOutTime: '18:00', // 标准下班时间
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
    // 确保旧数据也有默认值
    if (!settings.standardClockInTime) {
      settings.standardClockInTime = '09:00'
    }
    if (!settings.standardClockOutTime) {
      settings.standardClockOutTime = '18:00'
    }
    return settings
  }

  async saveSalarySettings(settings) {
    settings.id = 'primary'
    settings.updatedAt = new Date().toISOString()
    if (!settings.createdAt) {
      settings.createdAt = new Date().toISOString()
    }
    return this.update(STORES.SALARY_SETTINGS, settings)
  }

  // 打卡记录相关方法
  async getPunchRecord(date) {
    const records = await this.getByIndex(STORES.PUNCH_RECORDS, 'date', date)
    return records[0] || null
  }

  async savePunchRecord(record) {
    if (!record.id) {
      record.id = this.generateId()
    }
    record.month = record.date.substring(0, 7) // YYYY-MM格式
    record.updatedAt = new Date().toISOString()
    if (!record.createdAt) {
      record.createdAt = new Date().toISOString()
    }
    return this.update(STORES.PUNCH_RECORDS, record)
  }

  // 批量保存打卡记录
  async savePunchRecords(records) {
    // 预处理每条记录
    const processedRecords = records.map(record => {
      if (!record.id) {
        record.id = this.generateId()
      }
      record.month = record.date.substring(0, 7) // YYYY-MM格式
      record.updatedAt = new Date().toISOString()
      if (!record.createdAt) {
        record.createdAt = new Date().toISOString()
      }
      return record
    })

    return this.addAll(STORES.PUNCH_RECORDS, processedRecords)
  }

  async getPunchRecordsByMonth(yearMonth) {
    return this.getByIndex(STORES.PUNCH_RECORDS, 'month', yearMonth)
  }

  async getAllPunchRecords() {
    return this.getAll(STORES.PUNCH_RECORDS)
  }

  // 月度统计相关方法
  async getMonthlySummary(yearMonth) {
    return this.get(STORES.MONTHLY_SUMMARIES, yearMonth)
  }

  async saveMonthlySummary(summary) {
    summary.updatedAt = new Date().toISOString()
    if (!summary.createdAt) {
      summary.createdAt = new Date().toISOString()
    }
    return this.update(STORES.MONTHLY_SUMMARIES, summary)
  }

  // 生成唯一ID
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 导出所有数据
  async exportData() {
    const [salarySettings, punchRecords, monthlySummaries] = await Promise.all([
      this.getSalarySettings(),
      this.getAllPunchRecords(),
      this.getAll(STORES.MONTHLY_SUMMARIES)
    ])

    return {
      salarySettings,
      punchRecords,
      monthlySummaries,
      exportDate: new Date().toISOString()
    }
  }

  // 导入数据
  async importData(data) {
    await this.ready
    const transaction = this.db.transaction(
      [STORES.SALARY_SETTINGS, STORES.PUNCH_RECORDS, STORES.MONTHLY_SUMMARIES],
      'readwrite'
    )

    const salaryStore = transaction.objectStore(STORES.SALARY_SETTINGS)
    const punchStore = transaction.objectStore(STORES.PUNCH_RECORDS)
    const summaryStore = transaction.objectStore(STORES.MONTHLY_SUMMARIES)

    // 清空现有数据
    salaryStore.clear()
    punchStore.clear()
    summaryStore.clear()

    // 添加新数据
    if (data.salarySettings) {
      salaryStore.add(data.salarySettings)
    }

    if (data.punchRecords) {
      data.punchRecords.forEach(record => punchStore.add(record))
    }

    if (data.monthlySummaries) {
      data.monthlySummaries.forEach(summary => summaryStore.add(summary))
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }
}

// 创建单例实例
const attendanceDB = new AttendanceDB()

export default attendanceDB