import { ref } from 'vue'
import attendanceDB from '../db/index.js'

export function useDiary() {
  const diaryEntry = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function loadDiaryEntry(date) {
    try {
      loading.value = true
      const entry = await attendanceDB.getDiaryEntry(date)
      diaryEntry.value = entry
      return entry
    } catch (err) {
      error.value = err.message
      console.error('加载日记失败:', err)
      return null
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

      await attendanceDB.saveDiaryEntry(entry)
      diaryEntry.value = entry
      return { success: true, entry }
    } catch (err) {
      error.value = err.message
      console.error('保存日记失败:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  async function deleteDiaryEntry(date) {
    try {
      loading.value = true
      await attendanceDB.deleteDiaryEntry(date)
      diaryEntry.value = null
      return { success: true }
    } catch (err) {
      error.value = err.message
      console.error('删除日记失败:', err)
      return { success: false, message: err.message }
    } finally {
      loading.value = false
    }
  }

  async function getMonthDiaries(yearMonth) {
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
    loadDiaryEntry,
    saveDiaryEntry,
    deleteDiaryEntry,
    getMonthDiaries
  }
}
