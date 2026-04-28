<template>
  <div class="settings">
    <div class="header">
      <div class="header-left">
        <h1>设置</h1>
        <span class="header-subtitle">工资配置 & 数据管理</span>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="settings-tabs">
      <!-- ==================== 工资设置 ==================== -->
      <el-tab-pane name="salary">
        <template #label>
          <span class="tab-label">
            <el-icon><SetUp /></el-icon> 工资设置
          </span>
        </template>

        <!-- 配置卡片 grid -->
        <div class="salary-grid">
          <div class="salary-config-card card-daily">
            <div class="config-icon">
              <el-icon><Coin /></el-icon>
            </div>
            <div class="config-body">
              <label class="config-label">日薪（元）</label>
              <el-input-number
                v-model="salaryForm.dailySalary"
                :min="0"
                :step="100"
                controls-position="right"
                class="config-input"
              />
              <span class="config-hint">正常工作日的每日工资</span>
            </div>
          </div>

          <div class="salary-config-card card-weekend">
            <div class="config-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="config-body">
              <label class="config-label">周末加班倍数</label>
              <el-input-number
                v-model="salaryForm.weekendMultiplier"
                :min="1"
                :step="0.5"
                controls-position="right"
                class="config-input"
              />
              <span class="config-hint">周末工资倍数（2 表示双倍）</span>
            </div>
          </div>

          <div class="salary-config-card card-in">
            <div class="config-icon">
              <el-icon><Top /></el-icon>
            </div>
            <div class="config-body">
              <label class="config-label">标准上班时间</label>
              <el-time-picker
                v-model="salaryForm.standardClockInTime"
                placeholder="选择时间"
                value-format="HH:mm"
                class="config-input"
              />
              <span class="config-hint">用于判断迟到</span>
            </div>
          </div>

          <div class="salary-config-card card-out">
            <div class="config-icon">
              <el-icon><Bottom /></el-icon>
            </div>
            <div class="config-body">
              <label class="config-label">标准下班时间</label>
              <el-time-picker
                v-model="salaryForm.standardClockOutTime"
                placeholder="选择时间"
                value-format="HH:mm"
                class="config-input"
              />
              <span class="config-hint">用于判断早退</span>
            </div>
          </div>
        </div>

        <!-- 保存按钮 -->
        <div class="salary-actions">
          <el-button type="primary" size="large" @click="saveSalarySettings" :loading="loading" :icon="Check">
            保存设置
          </el-button>
          <el-button size="large" @click="resetSalaryForm">重置</el-button>
        </div>

        <!-- 工资说明 -->
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>工资计算说明</span>
            </div>
          </template>
          <div class="info-content">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-num">1</span>
                <div><strong>日薪计算</strong><br/>工作日按日薪，周末按 日薪 × 周末倍数</div>
              </div>
              <div class="info-item">
                <span class="info-num">2</span>
                <div><strong>加班工资</strong><br/>超过8小时的部分按 小时工资 × 周末倍数</div>
              </div>
              <div class="info-item">
                <span class="info-num">3</span>
                <div><strong>小时工资</strong><br/>日薪 ÷ 8（8小时工作制）</div>
              </div>
            </div>
            <div class="info-example">
              <span class="info-example-tag">示例</span>
              日薪300元，周末倍数2，工作日加班2小时：基础300 + 加班(300÷8)×2×2=150 = <strong>450元</strong>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- ==================== 数据管理 ==================== -->
      <el-tab-pane name="data">
        <template #label>
          <span class="tab-label">
            <el-icon><FolderOpened /></el-icon> 数据管理
          </span>
        </template>

        <!-- 操作卡片 -->
        <div class="data-actions">
          <div class="data-action-card action-export">
            <div class="action-icon">
              <el-icon><Download /></el-icon>
            </div>
            <h3>数据备份</h3>
            <p>将所有数据导出为 JSON 文件保存到本地</p>
            <el-button type="primary" @click="handleExport" :loading="loading">
              <el-icon><Download /></el-icon> 导出数据
            </el-button>
          </div>

          <div class="data-action-card action-import">
            <div class="action-icon">
              <el-icon><Upload /></el-icon>
            </div>
            <h3>数据恢复</h3>
            <p>从 JSON 文件导入数据（会覆盖现有数据）</p>
            <el-upload
              action=""
              :auto-upload="false"
              :on-change="handleFileChange"
              :show-file-list="false"
            >
              <el-button type="warning">
                <el-icon><FolderOpened /></el-icon> 选择文件
              </el-button>
            </el-upload>
            <div v-if="selectedFile" class="selected-file">
              {{ selectedFile.name }}
              <el-button type="primary" @click="handleImport" :loading="loading" size="small">
                确认导入
              </el-button>
            </div>
          </div>

          <div class="data-action-card action-clear">
            <div class="action-icon">
              <el-icon><WarningFilled /></el-icon>
            </div>
            <h3>数据清除</h3>
            <p>清除所有打卡记录和统计（保留工资设置）</p>
            <el-button type="danger" @click="confirmClearData" :loading="loading">
              <el-icon><Delete /></el-icon> 清除所有记录
            </el-button>
          </div>
        </div>

        <!-- 数据统计 -->
        <div class="data-stats">
          <div class="stat-card">
            <div class="stat-icon stat-icon-total">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ dataStats.totalRecords }}</span>
              <span class="stat-label">总记录数</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-salary">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">¥{{ dataStats.totalSalary?.toFixed(0) || '0' }}</span>
              <span class="stat-label">总工资</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-earliest">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ dataStats.earliestRecord || '-' }}</span>
              <span class="stat-label">最早记录</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-latest">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ dataStats.latestRecord || '-' }}</span>
              <span class="stat-label">最近记录</span>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- ==================== 关于 ==================== -->
      <el-tab-pane name="about">
        <template #label>
          <span class="tab-label">
            <el-icon><InfoFilled /></el-icon> 关于
          </span>
        </template>

        <div class="about-grid">
          <!-- 版本卡片 -->
          <div class="about-version-card">
            <div class="version-badge">v1.1.0</div>
            <div class="version-date">最后更新：2026年4月28日</div>
            <div class="version-author">开发者：Lavanda</div>
          </div>

          <!-- 功能特点 -->
          <el-card class="about-card">
            <template #header>
              <div class="card-header">
                <el-icon><Star /></el-icon>
                <span>功能特点</span>
              </div>
            </template>
            <div class="feature-grid">
              <div class="feature-item">
                <span class="feature-emoji">📅</span>
                <span>每日上下班打卡</span>
              </div>
              <div class="feature-item">
                <span class="feature-emoji">💰</span>
                <span>自动工资计算</span>
              </div>
              <div class="feature-item">
                <span class="feature-emoji">📊</span>
                <span>可视化统计图表</span>
              </div>
              <div class="feature-item">
                <span class="feature-emoji">🗓️</span>
                <span>日历视图打卡</span>
              </div>
              <div class="feature-item">
                <span class="feature-emoji">📝</span>
                <span>日记 & 图片粘贴</span>
              </div>
              <div class="feature-item">
                <span class="feature-emoji">🔄</span>
                <span>Obsidian 双向同步</span>
              </div>
              <div class="feature-item">
                <span class="feature-emoji">⚙️</span>
                <span>灵活工资配置</span>
              </div>
              <div class="feature-item">
                <span class="feature-emoji">💾</span>
                <span>数据导入导出</span>
              </div>
              <div class="feature-item">
                <span class="feature-emoji">🌙</span>
                <span>暗黑模式</span>
              </div>
            </div>
          </el-card>

          <!-- 技术栈 -->
          <el-card class="about-card">
            <template #header>
              <div class="card-header">
                <el-icon><Cpu /></el-icon>
                <span>技术栈</span>
              </div>
            </template>
            <div class="tech-tags">
              <el-tag type="primary" size="large">Vue 3</el-tag>
              <el-tag type="success" size="large">Element Plus</el-tag>
              <el-tag type="warning" size="large">ECharts</el-tag>
              <el-tag type="danger" size="large">Vite 8</el-tag>
              <el-tag type="info" size="large">IndexedDB</el-tag>
              <el-tag type="primary" size="large">Vue Router 5</el-tag>
              <el-tag type="success" size="large">FastAPI</el-tag>
              <el-tag size="large">Python</el-tag>
            </div>
          </el-card>

          <!-- 使用说明 -->
          <el-card class="about-card">
            <template #header>
              <div class="card-header">
                <el-icon><List /></el-icon>
                <span>使用说明</span>
              </div>
            </template>
            <div class="usage-steps">
              <div class="usage-step">
                <span class="step-num">01</span>
                <span>在"工资设置"中配置日薪和上下班时间</span>
              </div>
              <div class="usage-step">
                <span class="step-num">02</span>
                <span>在"打卡"页面进行上下班打卡</span>
              </div>
              <div class="usage-step">
                <span class="step-num">03</span>
                <span>在"日历"页面查看打卡情况、写日记</span>
              </div>
              <div class="usage-step">
                <span class="step-num">04</span>
                <span>在"统计"页面查看工资趋势</span>
              </div>
              <div class="usage-step">
                <span class="step-num">05</span>
                <span>定期备份数据到本地</span>
              </div>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useSalary } from '../composables/useSalary.js'
import { useAttendance } from '../composables/useAttendance.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  SetUp, FolderOpened, InfoFilled, Coin, Money, Top, Bottom,
  Check, Download, Upload, WarningFilled, Delete,
  Document, Clock, Timer, Star, Cpu, List
} from '@element-plus/icons-vue'

const { loadSalarySettings, saveSalarySettings: saveSalarySettingsApi, exportData, importData } = useSalary()
const { getAllRecords } = useAttendance()

const activeTab = ref('salary')
const loading = ref(false)
const selectedFile = ref(null)

const salaryForm = reactive({
  dailySalary: 300,
  weekendMultiplier: 2,
  standardClockInTime: '09:00',
  standardClockOutTime: '18:00'
})

const dataStats = reactive({
  totalRecords: 0,
  totalSalary: 0,
  earliestRecord: '',
  latestRecord: ''
})

onMounted(async () => {
  await loadInitialData()
})

async function loadInitialData() {
  const settingsResult = await loadSalarySettings()
  if (settingsResult.success && settingsResult.settings) {
    salaryForm.dailySalary = settingsResult.settings.dailySalary
    salaryForm.weekendMultiplier = settingsResult.settings.weekendMultiplier
    salaryForm.standardClockInTime = settingsResult.settings.standardClockInTime || '09:00'
    salaryForm.standardClockOutTime = settingsResult.settings.standardClockOutTime || '18:00'
  }
  await loadDataStats()
}

async function loadDataStats() {
  const result = await getAllRecords()
  if (result.success && result.records) {
    const records = result.records
    dataStats.totalRecords = records.length
    dataStats.totalSalary = records.reduce((sum, record) => sum + (record.totalSalary || 0), 0)
    if (records.length > 0) {
      const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date))
      dataStats.earliestRecord = sorted[0].date
      dataStats.latestRecord = sorted[sorted.length - 1].date
    }
  }
}

async function saveSalarySettings() {
  try {
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
    // validation error
  } finally {
    loading.value = false
  }
}

function resetSalaryForm() {
  loadInitialData()
}

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

function handleFileChange(file) {
  selectedFile.value = file.raw
}

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
          await loadInitialData()
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

async function confirmClearData() {
  try {
    await ElMessageBox.confirm(
      '此操作将清除所有打卡记录和统计，但会保留工资设置。是否继续？',
      '警告',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    ElMessage.info('清除数据功能开发中')
  } catch (error) {
    // cancelled
  }
}
</script>

<style scoped>
/* =============================================
   LIGHT MODE
   ============================================= */

.settings {
  padding: 24px 0;
}

/* ---- 头部 ---- */
.header {
  margin-bottom: 28px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.header h1 {
  font-size: 26px;
  color: var(--el-text-color-primary, #303133);
  font-weight: 700;
  margin: 0;
}

.header-subtitle {
  font-size: 16px;
  color: var(--el-text-color-secondary, #909399);
  font-weight: 500;
}

/* ---- 标签页 ---- */
.settings-tabs {
  max-width: 1000px;
  margin: 0 auto;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
}

/* =============================================
   工资设置
   ============================================= */

.salary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.salary-config-card {
  display: flex;
  gap: 16px;
  padding: 20px 22px;
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  background: var(--el-bg-color, #fff);
  transition: box-shadow 0.25s, transform 0.25s;
}

.salary-config-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.07);
}

.config-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.card-daily .config-icon   { background: rgba(99, 102, 241, 0.12); color: #6366f1; }
.card-weekend .config-icon { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.card-in .config-icon      { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.card-out .config-icon     { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

.config-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.config-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}

.config-input {
  width: 100% !important;
}

.config-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

.salary-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

/* ---- 工资说明 ---- */
.info-card {
  border-radius: 16px !important;
  border: 1px solid var(--el-border-color-lighter, #ebeef5) !important;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
}

.card-header .el-icon {
  color: var(--app-primary, #6366f1);
}

.info-content {
  line-height: 1.6;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px 16px;
  background: var(--el-fill-color-lighter, #fafafa);
  border-radius: 12px;
}

.info-num {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--app-primary, #6366f1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

.info-example {
  padding: 14px 18px;
  background: var(--el-color-primary-light-9, #ecf5ff);
  border-radius: 12px;
  font-size: 14px;
  border-left: 3px solid var(--app-primary, #6366f1);
}

.info-example-tag {
  display: inline-block;
  background: var(--app-primary, #6366f1);
  color: #fff;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  margin-right: 8px;
}

/* =============================================
   数据管理
   ============================================= */

.data-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.data-action-card {
  padding: 24px 20px;
  border-radius: 16px;
  text-align: center;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  background: var(--el-bg-color, #fff);
  transition: box-shadow 0.25s, transform 0.25s;
}

.data-action-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.action-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin: 0 auto 14px;
}

.action-export .action-icon { background: rgba(99, 102, 241, 0.12); color: #6366f1; }
.action-import .action-icon { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.action-clear .action-icon  { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

.data-action-card h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--el-text-color-primary, #303133);
}

.data-action-card p {
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
  margin: 0 0 16px;
  min-height: 36px;
}

.selected-file {
  margin-top: 12px;
  padding: 10px 14px;
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

/* ---- 数据统计 ---- */
.data-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: box-shadow 0.25s;
}

.stat-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
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

.stat-icon-total    { background: rgba(99, 102, 241, 0.12); color: #6366f1; }
.stat-icon-salary   { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.stat-icon-earliest { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.stat-icon-latest   { background: rgba(107, 114, 128, 0.12); color: #6b7280; }

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

/* =============================================
   关于
   ============================================= */

.about-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 版本卡片 */
.about-version-card {
  text-align: center;
  padding: 32px 24px;
  background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
  border-radius: 16px;
  color: #fff;
}

.version-badge {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.version-date,
.version-author {
  font-size: 14px;
  opacity: 0.85;
}

/* 功能特点 */
.about-card {
  border-radius: 16px !important;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--el-fill-color-lighter, #fafafa);
  border-radius: 12px;
  font-size: 14px;
  color: var(--el-text-color-regular, #606266);
}

.feature-emoji {
  font-size: 20px;
}

/* 技术栈 */
.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

/* 使用步骤 */
.usage-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.usage-step {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: var(--el-fill-color-lighter, #fafafa);
  border-radius: 12px;
  font-size: 14px;
  color: var(--el-text-color-regular, #606266);
}

.step-num {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--app-primary, #6366f1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}

/* =============================================
   DARK MODE
   ============================================= */

html.dark .header h1 {
  color: var(--el-text-color-primary, #e5eaf3);
}

html.dark .header-subtitle {
  color: var(--el-text-color-secondary, #a3a6ad);
}

html.dark .config-label,
html.dark .about-card h3,
html.dark .data-action-card h3 {
  color: var(--el-text-color-primary, #e5eaf3);
}

html.dark .config-hint,
html.dark .data-action-card p {
  color: var(--el-text-color-secondary, #a3a6ad);
}

html.dark .salary-config-card,
html.dark .data-action-card,
html.dark .stat-card {
  background: var(--el-bg-color, #1d1e1f);
  border-color: var(--el-border-color-light, #414243);
}

html.dark .salary-config-card:hover,
html.dark .data-action-card:hover,
html.dark .stat-card:hover {
  border-color: var(--el-color-primary, #409eff);
}

html.dark .info-item,
html.dark .feature-item,
html.dark .usage-step,
html.dark .selected-file {
  background: var(--el-fill-color-lighter, #1a1a1b);
}

html.dark .info-example {
  background: rgba(99, 102, 241, 0.08);
}

html.dark .feature-item {
  color: var(--el-text-color-regular, #cfd3dc);
}

html.dark .stat-value,
html.dark .info-content {
  color: var(--el-text-color-primary, #e5eaf3);
}

html.dark .stat-label {
  color: var(--el-text-color-secondary, #a3a6ad);
}

/* ---- 响应式 ---- */
@media (max-width: 768px) {
  .salary-grid {
    grid-template-columns: 1fr;
  }
  .data-actions {
    grid-template-columns: 1fr;
  }
  .data-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .about-version-card {
    padding: 24px 16px;
  }
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
