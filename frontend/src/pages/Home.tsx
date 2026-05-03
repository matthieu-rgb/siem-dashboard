import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { api } from '@/api/client'

export default function Home() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['health'],
    queryFn: api.health.get,
    refetchInterval: 30_000,
  })

  return (
    <div className="min-h-screen bg-bg-canvas flex items-center justify-center">
      <div className="bg-bg-surface border border-border-default rounded-lg p-6 w-80 shadow-md">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-bg-surface border border-border-default rounded-md flex items-center justify-center">
            <span className="text-xs font-bold text-fg-default font-mono">SD</span>
          </div>
          <div>
            <h1 className="text-md font-semibold text-fg-default">SIEM Dashboard</h1>
            <p className="text-xs text-fg-subtle">Lightweight Wazuh interface</p>
          </div>
        </div>

        <div className="border-t border-border-subtle pt-4">
          {isLoading && (
            <div className="flex items-center gap-2 text-fg-muted text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting to backend...
            </div>
          )}

          {isError && (
            <div className="flex items-start gap-2 text-severity-critical text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Backend unreachable
                <br />
                <span className="text-xs text-fg-subtle font-mono">
                  {error instanceof Error ? error.message : 'Unknown error'}
                </span>
              </span>
            </div>
          )}

          {data && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-status-active shrink-0" />
              <span className="text-fg-muted">
                Status:{' '}
                <span className="text-status-active font-mono font-medium">{data.status}</span>
              </span>
              <span className="ml-auto text-xs text-fg-subtle font-mono">v{data.version}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
