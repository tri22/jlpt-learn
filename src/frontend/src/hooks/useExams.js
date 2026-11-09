import { useEffect, useState } from 'react'
import { fetchExam, fetchExams } from '../api/exams.js'

/** Danh sách đề thi từ API, có trạng thái loading/error. */
export function useExams() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetchExams()
      .then((data) => {
        if (!cancelled) setExams(data ?? [])
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { exams, loading, error }
}

/**
 * Chi tiết một đề thi theo id.
 *
 * `loading` được suy ra từ việc còn đang chờ dữ liệu cho examId hiện tại, thay vì
 * lưu trong state — nếu không sẽ có một render với `exam === null` và
 * `loading === false`, khiến phần gọi render màn hình làm bài với dữ liệu rỗng.
 *
 * `error` cũng được gắn theo id để lỗi của đề trước không lọt sang đề đang xem.
 */
export function useExam(examId) {
  const [exam, setExam] = useState(null)
  const [error, setError] = useState(null)
  const [loadedId, setLoadedId] = useState(null)

  useEffect(() => {
    if (!examId) return undefined

    let cancelled = false

    fetchExam(examId)
      .then((data) => {
        if (cancelled) return
        setExam(data)
        setError(null)
        setLoadedId(examId)
      })
      .catch((err) => {
        if (!cancelled) setError(err)
      })

    return () => {
      cancelled = true
    }
  }, [examId])

  const loading = Boolean(examId) && !error && loadedId !== examId

  return { exam, loading, error }
}
