import type { HealthResponse, TokenResponse, User } from '@/types'

const API_BASE = '/api'

let _accessToken: string | null = null
let _refreshPromise: Promise<string | null> | null = null

export function setAccessToken(token: string | null): void {
  _accessToken = token
}

class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new ApiRequestError(res.status, `API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

async function _doRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) return null
    const data = (await res.json()) as TokenResponse
    _accessToken = data.access_token
    return _accessToken
  } catch {
    return null
  }
}

function _refreshOnce(): Promise<string | null> {
  if (!_refreshPromise) {
    _refreshPromise = _doRefresh().finally(() => {
      _refreshPromise = null
    })
  }
  return _refreshPromise
}

async function authFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const buildHeaders = (token: string | null): HeadersInit => ({
    'Content-Type': 'application/json',
    ...init?.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  })

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: buildHeaders(_accessToken),
  })

  if (res.status === 401) {
    const newToken = await _refreshOnce()
    if (!newToken) {
      throw new ApiRequestError(401, 'Session expired')
    }
    const retry = await fetch(`${API_BASE}${path}`, {
      ...init,
      credentials: 'include',
      headers: buildHeaders(newToken),
    })
    if (!retry.ok) {
      const text = await retry.text()
      throw new ApiRequestError(retry.status, `API ${retry.status}: ${text}`)
    }
    return retry.json() as Promise<T>
  }

  if (!res.ok) {
    const text = await res.text()
    throw new ApiRequestError(res.status, `API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  health: {
    get: () => apiFetch<HealthResponse>('/health'),
  },
  auth: {
    login: (email: string, password: string) =>
      apiFetch<TokenResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    refresh: () =>
      apiFetch<TokenResponse>('/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      }),
    logout: () =>
      apiFetch<{ ok: boolean }>('/auth/logout', {
        method: 'POST',
        credentials: 'include',
      }),
    me: () => authFetch<User>('/auth/me'),
  },
}

export { ApiRequestError }
