/** Các endpoint liên quan đến đề thi. */

import { api } from './client.js'

export function fetchExams() {
  return api.get('/exams')
}

export function fetchExam(examId) {
  return api.get(`/exams/${encodeURIComponent(examId)}`)
}

export function fetchAnswerKey(examId) {
  return api.get(`/exams/${encodeURIComponent(examId)}/answer-key`)
}
