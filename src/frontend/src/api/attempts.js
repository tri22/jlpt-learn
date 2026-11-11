/** Attempt endpoints exposed by the backend. */

import { api } from './client.js'

export function createAttempt(examId) {
  return api.post('/attempts', { examId })
}

export function submitAttempt(attemptId, answers) {
  return api.post(`/attempts/${encodeURIComponent(attemptId)}/submit`, { answers })
}
