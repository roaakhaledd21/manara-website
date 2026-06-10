// Central API client for the Laravel (Sanctum) backend.
// See `frontend_integration.md` for the full endpoint contract.
//
// Auth model: on login/register the backend returns `{ user, token }`.
// We persist the token under `auth_token` and the user under `auth_user`,
// and attach `Authorization: Bearer <token>` to every protected request.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null
  } catch {
    return null
  }
}
export const setUser = (u) => localStorage.setItem(USER_KEY, JSON.stringify(u))
export const clearUser = () => localStorage.removeItem(USER_KEY)

export const clearAuth = () => {
  clearToken()
  clearUser()
}

// Normalised error so callers can read `.status`, `.message` and `.errors`
// (field-level validation map) per the doc's error-handling conventions.
export class ApiError extends Error {
  constructor(status, data) {
    super((data && data.message) || `Request failed (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.errors = (data && data.errors) || null
  }
}

async function request(path, { method = 'GET', body, isForm = false, auth = true } = {}) {
  const headers = { Accept: 'application/json' }

  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let payload
  if (isForm) {
    // FormData — let the browser set the multipart boundary itself.
    payload = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload })
  } catch {
    // Network / CORS / server-down
    throw new ApiError(0, { message: 'Cannot reach the server. Is the backend running?' })
  }

  // Parse body (may be empty, e.g. 204 No Content)
  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (res.status === 401) {
    // Session expired / invalid token → clear and bounce to login.
    clearAuth()
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
    throw new ApiError(401, data)
  }

  if (!res.ok) throw new ApiError(res.status, data)
  return data
}

export const api = {
  get: (p, opts) => request(p, { ...opts, method: 'GET' }),
  post: (p, body, opts) => request(p, { ...opts, method: 'POST', body }),
  put: (p, body, opts) => request(p, { ...opts, method: 'PUT', body }),
  del: (p, opts) => request(p, { ...opts, method: 'DELETE' }),
  postForm: (p, formData, opts) => request(p, { ...opts, method: 'POST', body: formData, isForm: true }),
}

// ----- Auth -----
export const authApi = {
  login: (email, password) => api.post('/login', { email, password }, { auth: false }),
  register: (payload) => api.post('/register', payload, { auth: false }),
  me: () => api.get('/user'),
  logout: () => api.post('/logout'),
}
