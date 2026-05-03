export interface HealthResponse {
  status: string
  version: string
}

export type ApiError = {
  detail: string
}

export interface User {
  id: number
  email: string
  role: 'admin' | 'analyst' | 'viewer'
}

export interface TokenResponse {
  access_token: string
  token_type: string
}
