'use client'

import { useJobQuery } from '@/graphql/generated/hooks'
import { Job } from '@/graphql/generated/sdk'
import { JobStatusBadge } from './job-status-badge'
import { JobProgress } from './job-progress'
import { JobActions } from './job-actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { format, isValid } from 'date-fns'
import { AlertCircle, Calendar, Clock, Database, FileText, Hash } from 'lucide-react'

// Safe date formatting function
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Not set'

  const date = new Date(dateString)
  if (!isValid(date)) return 'Invalid date'

  return format(date, 'PPp')
}

export function JobDetail({ jobId }: { jobId: string }) {
  // ALWAYS use generated hooks
  const { data, loading, error } = useJobQuery({
    variables: { jobId },
  })

  if (loading) return <JobDetailSkeleton />
  if (error) return <JobDetailError error={error} />
  if (!data?.job) return <JobNotFound />

  const job = data.job

  return (
    <div className="space-y-6">
      <JobHeader job={job} />
      <div className="grid gap-6 md:grid-cols-2">
        <JobMetadata job={job} />
        <JobStats job={job} />
      </div>
      {(job.currentInput || job.remainingInput) && (
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <JobProgress job={job} />
          </CardContent>
        </Card>
      )}
      {job.errorMessage && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{job.errorMessage}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function JobHeader({ job }: { job: Job }) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          Job {job.id.slice(-8)}
          <JobStatusBadge status={job.status} />
        </h1>
        <p className="text-muted-foreground mt-1">Provider: {job.provider}</p>
      </div>
      <JobActions job={job} />
    </div>
  )
}

function JobMetadata({ job }: { job: Job }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">ID:</span>
          <span className="text-sm font-mono">{job.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Created:</span>
          <span className="text-sm">{formatDate(job.createdAt)}</span>
        </div>
        {job.startedAt && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Started:</span>
            <span className="text-sm">{formatDate(job.startedAt)}</span>
          </div>
        )}
        {job.completedAt && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Completed:</span>
            <span className="text-sm">{formatDate(job.completedAt)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function JobStats({ job }: { job: Job }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Items Scraped:</span>
          <span className="text-sm font-medium">{job.itemsScraped || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Progress:</span>
          <span className="text-sm font-medium">{job.progressPercentage.toFixed(1)}%</span>
        </div>
        {job.duration && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Duration:</span>
            <span className="text-sm font-medium">{Math.round(job.duration / 1000)}s</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function JobDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  )
}

function JobDetailError({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-2">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <p className="text-lg font-medium">Error loading job</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  )
}

function JobNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-2">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
        <p className="text-lg font-medium">Job not found</p>
        <p className="text-sm text-muted-foreground">The job you are looking for does not exist.</p>
      </div>
    </div>
  )
}
