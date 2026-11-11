import { useEffect, useState } from 'react'
import { fetchExam, fetchExams } from '../api/exams.js'

/** Exam catalog from the API with loading and error states. */
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
 * Exam details by ID.
 *
 * `loading` is derived from whether the current examId is still pending rather
 * than stored in state. Otherwise, one render would have `exam === null` and
 * `loading === false`, causing the caller to render an empty exam screen.
 *
 * `error` is also associated with an ID so an earlier exam's error cannot leak
 * into the current exam.
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
