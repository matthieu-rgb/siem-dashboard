import { Server } from 'lucide-react'

export default function Agents() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <Server size={48} className="text-fg-subtle mb-4" />
      <p className="text-fg-muted text-base font-medium">No agents yet</p>
      <p className="text-fg-subtle text-sm mt-1">
        Agent management will be available in Phase 3.
      </p>
    </div>
  )
}
