export interface HealthResponse {
  status: string
  version: string
}

export type ApiError = {
  detail: string
}
