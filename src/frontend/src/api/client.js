/**
 * Client HTTP tập trung cho backend.
 *
 * Mọi request đi qua `/api/v1/*` — ở production đó là Nginx (load balancer),
 * ở dev là Vite proxy. Frontend không bao giờ biết địa chỉ instance backend.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export class ApiError extends Error {
  constructor(message, { status, code, details, retryAfter } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.retryAfter = retryAfter
  }
}

async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    throw new ApiError('Không kết nối được tới máy chủ', { status: 0, code: 'network_error' })
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const error = payload?.error ?? {}
    throw new ApiError(error.message ?? `Lỗi ${response.status}`, {
      status: response.status,
      code: error.code ?? 'unknown_error',
      details: error.details ?? null,
      retryAfter: error.retry_after_ms ?? null,
    })
  }

  return payload?.data ?? null
}

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}
