import { cn } from '@/lib/utils'

interface JobProgressBarProps {
  current: number
  total: number
  className?: string
}

export function JobProgressBar({ current, total, className }: JobProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Progress</span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
        <div className="bg-primary h-full transition-all duration-300 ease-out" style={{ width: `${percentage}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        {current} of {total} items processed
      </p>
    </div>
  )
}

interface JobProgressProps {
  job: {
    status: string
    totalItems?: number | null
    processedItems?: number | null
    processedInput?: unknown
    remainingInput?: unknown
  }
}

export function JobProgress({ job }: JobProgressProps) {
  if (job.totalItems && job.totalItems > 0) {
    return <JobProgressBar current={job.processedItems || 0} total={job.totalItems} />
  }

  if (job.processedInput || job.remainingInput) {
    const processed = Array.isArray(job.processedInput) ? job.processedInput.length : 0
    const remaining = Array.isArray(job.remainingInput) ? job.remainingInput.length : 0
    const total = processed + remaining

    if (total > 0) {
      return <JobProgressBar current={processed} total={total} />
    }
  }

  return null
}
