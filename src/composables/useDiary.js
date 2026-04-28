import { ref } from 'vue'
import attendanceDB from '../db/index.js'

const API_BASE = 'http://localhost:8765'

export function useDiary() {
  const diaryEntry = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const backendOnline = ref(false)

  async function checkBackendHealth() {
    try {
      const r = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(2000) })
      backendOnline.value = r.ok
      return r.ok
    } catch {
      backendOnline.value = false
      return false
    }
  }

  // 初始化时检测一次
  checkBackendHealth()

  async function loadDiaryEntry(date) {
    try {
      loading.value = true
      error.value = null

      // 优先从后端读取（.md 文件是 source of truth）
      if (await checkBackendHealth()) {
        const r = await fetch(`${API_BASE}/api/diary/${encodeURIComponent(date)}`)
        const data = await r.json()
        if (data.exists) {
          const entry = {
            id: `remote-${data.date}`,
            date: data.date,
            month: data.date.substring(0, 7),
            tasks: data.tasks,
            content: data.contentHtml || data.content
          }
          diaryEntry.value = entry
          // 同步缓存到 IndexedDB
          try { await attendanceDB.saveDiaryEntry({ ...entry }) } catch {}
          return entry
        } else {
          diaryEntry.value = null
          return null
        }
      }

      // 后端不可用 → 降级到 IndexedDB
      const entry = await attendanceDB.getDiaryEntry(date)
      diaryEntry.value = entry
      return entry
    } catch (err) {
      // 出错时降级到 IndexedDB
      try {
        const entry = await attendanceDB.getDiaryEntry(date)
        diaryEntry.value = entry
        return entry
      } catch (dbErr) {
        error.value = err.message
        console.error('加载日记失败:', err)
        return null
      }
    } finally {
      loading.value = false
    }
  }

  async function saveDiaryEntry(entry) {
    try {
      loading.value = true
      error.value = null

      if (!entry.date) {
        error.value = '日期不能为空'
        return { success: false, message: '日期不能为空' }
      }

      // 优先保存到后端（写入 .md 文件）
      if (await checkBackendHealth()) {
        const r = await fetch(`${API_BASE}/api/diary/${encodeURIComponent(entry.date)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tasks: entry.tasks || '',
            content: entry.content || ''
          })
        })
        const result = await r.json()
        if (!result.success) {
          return { success: false, message: result.detail || '保存失败' }
        }
      }

      // 同时缓存到 IndexedDB
      try {
        await attendanceDB.saveDiaryEntry({
          date: entry.date,
          tasks: entry.tasks || '',
          content: entry.content || ''
        })
      } catch {}

      diaryEntry.value = entry
      return { success: true, entry }
    } catch (err) {
      // 网络错误时只存 IndexedDB
      error.value = err.message
      try {
        await attendanceDB.saveDiaryEntry({
          date: entry.date,
          tasks: entry.tasks || '',
          content: entry.content || ''
        })
        diaryEntry.value = entry
        return { success: true, entry }
      } catch (dbErr) {
        console.error('保存日记失败:', err)
        return { success: false, message: err.message }
      }
    } finally {
      loading.value = false
    }
  }

  async function deleteDiaryEntry(date) {
    try {
      loading.value = true

      if (await checkBackendHealth()) {
        await fetch(`${API_BASE}/api/diary/${encodeURIComponent(date)}`, { method: 'DELETE' })
      }

      try { await attendanceDB.deleteDiaryEntry(date) } catch {}
      diaryEntry.value = null
      return { success: true }
    } catch (err) {
      error.value = err.message
      console.error('删除日记失败:', err)
      // 至少删 IndexedDB
      try { await attendanceDB.deleteDiaryEntry(date) } catch {}
      diaryEntry.value = null
      return { success: true }
    } finally {
      loading.value = false
    }
  }

  async function getMonthDiaries(yearMonth) {
    // 优先后端
    try {
      if (await checkBackendHealth()) {
        const r = await fetch(`${API_BASE}/api/diary/month/${yearMonth}`)
        const data = await r.json()
        return (data.dates || []).map(d => ({ date: d.date }))
      }
    } catch {}

    // 降级 IndexedDB
    try {
      return await attendanceDB.getDiaryEntriesByMonth(yearMonth)
    } catch (err) {
      console.error('获取月度日记失败:', err)
      return []
    }
  }

  return {
    diaryEntry,
    loading,
    error,
    backendOnline,
    checkBackendHealth,
    loadDiaryEntry,
    saveDiaryEntry,
    deleteDiaryEntry,
    getMonthDiaries
  }
}
