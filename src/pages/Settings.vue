<template>
  <div class="settings">
    <div class="header">
      <h1>设置</h1>
    </div>

    <el-tabs v-model="activeTab" class="settings-tabs">
      <!-- 工资设置 -->
      <el-tab-pane label="工资设置" name="salary">
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <span>工资参数</span>
            </div>
          </template>
          <el-form
            ref="salaryFormRef"
            :model="salaryForm"
            :rules="salaryRules"
            label-width="120px"
            class="salary-form"
          >
            <el-form-item label="日薪（元）" prop="dailySalary">
              <el-input-number
                v-model="salaryForm.dailySalary"
                :min="0"
                :step="100"
                controls-position="right"
                style="width: 200px;"
              />
              <div class="form-help">正常工作日的每日工资</div>
            </el-form-item>

            <el-form-item label="周末加班倍数" prop="weekendMultiplier">
              <el-input-number
                v-model="salaryForm.weekendMultiplier"
                :min="1"
                :step="0.5"
                controls-position="right"
                style="width: 200px;"
              />
              <div class="form-help">周末工作的工资倍数（例如：2表示双倍工资）</div>
            </el-form-item>

            <el-form-item label="标准上班时间" prop="standardClockInTime">
              <el-time-picker
                v-model="salaryForm.standardClockInTime"
                placeholder="选择标准上班时间"
                value-format="HH:mm"
                style="width: 200px;"
              />
              <div class="form-help">用于判断迟到的时间（格式：HH:mm）</div>
            </el-form-item>

            <el-form-item label="标准下班时间" prop="standardClockOutTime">
              <el-time-picker
                v-model="salaryForm.standardClockOutTime"
                placeholder="选择标准下班时间"
                value-format="HH:mm"
                style="width: 200px;"
              />
              <div class="form-help">用于判断早退的时间（格式：HH:mm）</div>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveSalarySettings" :loading="loading">
                保存设置
              </el-button>
              <el-button @click="resetSalaryForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 工资说明 -->
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>工资计算说明</span>
            </div>
          </template>
          <div class="info-content">
            <p>1. <strong>日薪计算</strong>：工作日按日薪计算，周末按日薪 × 周末倍数计算</p>
            <p>2. <strong>加班工资</strong>：每日工作超过8小时的部分按小时工资 × 周末倍数计算</p>
            <p>3. <strong>小时工资</strong>：日薪 ÷ 8（假设8小时工作制）</p>
            <p>4. <strong>示例</strong>：日薪300元，周末倍数2，工作日加班2小时：</p>
            <ul>
              <li>基础日薪：300元</li>
              <li>加班工资：(300 ÷ 8) × 2 × 2 = 150元</li>
              <li>总工资：450元</li>
            </ul>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 数据管理 -->
      <el-tab-pane label="数据管理" name="data">
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <span>数据备份与恢复</span>
            </div>
          </template>
          <div class="data-management">
            <div class="data-section">
              <h3>数据备份</h3>
              <p>将当前所有数据导出为JSON文件</p>
              <el-button type="primary" @click="handleExport" :loading="loading">
                导出数据
              </el-button>
            </div>

            <el-divider />

            <div class="data-section">
              <h3>数据恢复</h3>
              <p>从JSON文件导入数据（会覆盖现有数据）</p>
              <el-upload
                class="upload-demo"
                action=""
                :auto-upload="false"
                :on-change="handleFileChange"
                :show-file-list="false"
              >
                <el-button type="warning">选择文件</el-button>
                <template #tip>
                  <div class="el-upload__tip">仅支持JSON格式文件</div>
                </template>
              </el-upload>
              <div v-if="selectedFile" class="selected-file">
                已选择文件：{{ selectedFile.name }}
                <el-button type="primary" @click="handleImport" :loading="loading" size="small">
                  导入
                </el-button>
              </div>
            </div>

            <el-divider />

            <div class="data-section">
              <h3>数据清除</h3>
              <p>清除所有打卡记录和统计（工资设置不会被清除）</p>
              <el-button type="danger" @click="confirmClearData" :loading="loading">
                清除所有记录
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- 数据统计 -->
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>数据统计</span>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="总记录数">
              {{ dataStats.totalRecords }} 条
            </el-descriptions-item>
            <el-descriptions-item label="总工资">
              ¥{{ dataStats.totalSalary?.toFixed(2) || '0.00' }}
            </el-descriptions-item>
            <el-descriptions-item label="最早记录">
              {{ dataStats.earliestRecord || '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="最近记录">
              {{ dataStats.latestRecord || '无' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-tab-pane>

      <!-- 关于 -->
      <el-tab-pane label="关于" name="about">
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <span>关于上班打卡小程序</span>
            </div>
          </template>
          <div class="about-content">
            <h3>版本信息</h3>
            <p>版本号：1.0.0</p>
            <p>最后更新：2026年4月19日</p>

            <h3>功能特点</h3>
            <ul>
              <li>📅 每日上下班打卡记录</li>
              <li>💰 自动计算工资（支持周末倍数和加班）</li>
              <li>📊 数据可视化统计图表</li>
              <li>🗓️ 日历视图查看打卡情况</li>
              <li>⚙️ 灵活的工资参数设置</li>
              <li>💾 数据导入导出功能</li>
            </ul>

            <h3>技术栈</h3>
            <ul>
              <li>前端：Vue 3 + Element Plus + ECharts</li>
              <li>存储：IndexedDB（浏览器本地存储）</li>
              <li>构建：Vite</li>
            </ul>

            <h3>使用说明</h3>
            <ol>
              <li>在"工资设置"中配置日薪和周末倍数</li>
              <li>在"打卡"页面进行上下班打卡</li>
              <li>在"日历"页面查看月度打卡情况</li>
              <li>在"统计"页面查看工资趋势和出勤分布</li>
              <li>定期使用"数据管理"功能备份数据</li>
            </ol>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useSalary } from '../composables/useSalary.js'
import { useAttendance } from '../composables/useAttendance.js'
import { ElMessage, ElMessageBox } from 'element-plus'

const { loadSalarySettings, saveSalarySettings: saveSalarySettingsApi, exportData, importData } = useSalary()
const { getAllRecords } = useAttendance()

const activeTab = ref('salary')
const loading = ref(false)
const selectedFile = ref(null)
const salaryFormRef = ref(null)

// 工资表单
const salaryForm = reactive({
  dailySalary: 300,
  weekendMultiplier: 2,
  standardClockInTime: '09:00',
  standardClockOutTime: '18:00'
})

// 表单验证规则
const salaryRules = {
  dailySalary: [
    { required: true, message: '请输入日薪', trigger: 'blur' },
    { type: 'number', min: 0, message: '日薪必须大于0', trigger: 'blur' }
  ],
  weekendMultiplier: [
    { required: true, message: '请输入周末加班倍数', trigger: 'blur' },
    { type: 'number', min: 1, message: '周末加班倍数必须大于等于1', trigger: 'blur' }
  ],
  standardClockInTime: [
    { required: true, message: '请输入标准上班时间', trigger: 'blur' },
    { pattern: /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/, message: '时间格式无效，请使用HH:mm格式', trigger: 'blur' }
  ],
  standardClockOutTime: [
    { required: true, message: '请输入标准下班时间', trigger: 'blur' },
    { pattern: /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/, message: '时间格式无效，请使用HH:mm格式', trigger: 'blur' }
  ]
}

// 数据统计
const dataStats = reactive({
  totalRecords: 0,
  totalSalary: 0,
  earliestRecord: '',
  latestRecord: ''
})

// 加载设置和数据
onMounted(async () => {
  await loadInitialData()
})

async function loadInitialData() {
  // 加载工资设置
  const settingsResult = await loadSalarySettings()
  if (settingsResult.success && settingsResult.settings) {
    salaryForm.dailySalary = settingsResult.settings.dailySalary
    salaryForm.weekendMultiplier = settingsResult.settings.weekendMultiplier
    salaryForm.standardClockInTime = settingsResult.settings.standardClockInTime || '09:00'
    salaryForm.standardClockOutTime = settingsResult.settings.standardClockOutTime || '18:00'
  }

  // 加载数据统计
  await loadDataStats()
}

async function loadDataStats() {
  const result = await getAllRecords()
  if (result.success && result.records) {
    const records = result.records
    dataStats.totalRecords = records.length

    // 计算总工资
    dataStats.totalSalary = records.reduce((sum, record) => sum + (record.totalSalary || 0), 0)

    // 最早和最晚记录
    if (records.length > 0) {
      const sortedByDate = [...records].sort((a, b) => a.date.localeCompare(b.date))
      dataStats.earliestRecord = sortedByDate[0].date
      dataStats.latestRecord = sortedByDate[sortedByDate.length - 1].date
    }
  }
}

// 保存工资设置
async function saveSalarySettings() {
  if (!salaryFormRef.value) return

  try {
    await salaryFormRef.value.validate()
    loading.value = true

    const result = await saveSalarySettingsApi({
      dailySalary: salaryForm.dailySalary,
      weekendMultiplier: salaryForm.weekendMultiplier,
      standardClockInTime: salaryForm.standardClockInTime,
      standardClockOutTime: salaryForm.standardClockOutTime
    })

    if (result.success) {
      ElMessage.success('工资设置保存成功')
    } else {
      ElMessage.error(result.message || '保存失败')
    }
  } catch (error) {
    // 验证失败
  } finally {
    loading.value = false
  }
}

// 重置工资表单
function resetSalaryForm() {
  loadInitialData()
}

// 导出数据
async function handleExport() {
  loading.value = true
  try {
    const result = await exportData()
    if (result.success) {
      const dataStr = JSON.stringify(result.data, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `attendance_backup_${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      ElMessage.success('数据导出成功')
    } else {
      ElMessage.error(result.message || '导出失败')
    }
  } catch (error) {
    ElMessage.error('导出过程中出现错误')
  } finally {
    loading.value = false
  }
}

// 文件选择
function handleFileChange(file) {
  selectedFile.value = file.raw
}

// 导入数据
async function handleImport() {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  try {
    loading.value = true
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result)
        const result = await importData(data)
        if (result.success) {
          ElMessage.success('数据导入成功')
          await loadInitialData() // 重新加载数据
          selectedFile.value = null
        } else {
          ElMessage.error(result.message || '导入失败')
        }
      } catch (error) {
        ElMessage.error('文件格式错误')
      } finally {
        loading.value = false
      }
    }
    reader.readAsText(selectedFile.value)
  } catch (error) {
    ElMessage.error('读取文件失败')
    loading.value = false
  }
}

// 清除数据
async function confirmClearData() {
  try {
    await ElMessageBox.confirm(
      '此操作将清除所有打卡记录和统计，但会保留工资设置。是否继续？',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 这里需要实现清除数据的逻辑
    // 由于数据库操作比较复杂，这里先给出提示
    ElMessage.info('清除数据功能开发中')
  } catch (error) {
    // 用户取消
  }
}
</script>

<style scoped>
.settings {
  padding: 24px 0;
}

.header {
  margin-bottom: 32px;
}

.header h1 {
  font-size: 28px;
  margin: 0;
  color: var(--el-text-color-primary, #303133);
}

.settings-tabs {
  max-width: 1000px;
  margin: 0 auto;
}

.settings-card {
  margin-bottom: 24px;
}

.card-header {
  font-weight: 600;
  font-size: 16px;
}

.salary-form {
  max-width: 600px;
}

.form-help {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
  margin-top: 4px;
}

.info-card {
  margin-top: 24px;
}

.info-content {
  line-height: 1.6;
}

.info-content h3 {
  margin-top: 20px;
  margin-bottom: 12px;
  color: var(--el-text-color-primary, #303133);
}

.info-content ul,
.info-content ol {
  margin-left: 20px;
  margin-bottom: 16px;
}

.info-content li {
  margin-bottom: 8px;
}

.data-management {
  max-width: 800px;
}

.data-section {
  margin-bottom: 24px;
}

.data-section h3 {
  margin-bottom: 8px;
  color: var(--el-text-color-primary, #303133);
}

.data-section p {
  margin-bottom: 16px;
  color: var(--el-text-color-regular, #606266);
}

.selected-file {
  margin-top: 16px;
  padding: 12px;
  background-color: var(--el-fill-color-light, #f5f7fa);
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.about-content {
  line-height: 1.6;
}

.about-content h3 {
  margin-top: 24px;
  margin-bottom: 16px;
  color: var(--el-text-color-primary, #303133);
  font-size: 18px;
}

.about-content p {
  margin-bottom: 12px;
}
</style>