import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Home from './Home'
import { api } from '@/api/client'

vi.mock('@/api/client', () => ({
  api: {
    health: {
      get: vi.fn(),
    },
  },
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state initially', () => {
    vi.mocked(api.health.get).mockReturnValue(new Promise(() => {}))
    render(<Home />, { wrapper })
    expect(screen.getByText(/connecting to backend/i)).toBeInTheDocument()
  })

  it('shows ok status on success', async () => {
    vi.mocked(api.health.get).mockResolvedValue({ status: 'ok', version: '0.1.0' })
    render(<Home />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText('ok')).toBeInTheDocument()
      expect(screen.getByText('v0.1.0')).toBeInTheDocument()
    })
  })

  it('shows error when backend unreachable', async () => {
    vi.mocked(api.health.get).mockRejectedValue(new Error('Connection refused'))
    render(<Home />, { wrapper })
    await waitFor(() => {
      expect(screen.getByText(/backend unreachable/i)).toBeInTheDocument()
    })
  })
})
