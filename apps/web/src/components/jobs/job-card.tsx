'use client'

import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { JobStatusBadge } from './job-status-badge'
import { JobProgressBar } from './job-progress'
import { Job } from '@/graphql/generated/sdk'
import { ArrowRight, Calendar, Package, Copy, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  const hasProgress = job.progressPercentage > 0
  const itemsCount = job.itemsScraped || 0
  const isRunning = job.status === 'RUNNING'
  const isCompleted = job.status === 'COMPLETED'
  const isFailed = job.status === 'FAILED'

  // Calculate status indicators
  const getStatusIcon = () => {
    if (isRunning) return <Clock className="w-3 h-3 text-blue-500" />
    if (isCompleted) return <CheckCircle className="w-3 h-3 text-green-500" />
    if (isFailed) return <AlertCircle className="w-3 h-3 text-red-500" />
    return null
  }

  // Get last activity time
  const getLastActiveTime = () => {
    if (job.completedAt) return formatDistanceToNow(new Date(job.completedAt), { addSuffix: true })
    if (job.startedAt) return formatDistanceToNow(new Date(job.startedAt), { addSuffix: true })
    return formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })
  }

  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-3">
                Job {job.id.slice(-8)}
                <JobStatusBadge status={job.status} />
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {job.provider}
                </Badge>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(job.createdAt), 'MMM dd, yyyy HH:mm')}
                </span>
              </CardDescription>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          {hasProgress && (
            <div className="mb-4">
              <JobProgressBar 
                current={job.progressPercentage} 
                total={100} 
                showPercentage 
              />
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Package className="w-3 h-3" />
                <span>Items</span>
              </div>
              <div className="font-medium">{itemsCount}</div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                {getStatusIcon()}
                <span>Status</span>
              </div>
              <div className="font-medium text-xs">
                {isRunning ? 'Processing...' : 
                 isCompleted ? 'Completed' : 
                 isFailed ? 'Failed' :
                 'Pending'}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1 text-muted-foreground mb-1">
                <Clock className="w-3 h-3" />
                <span>Last Active</span>
              </div>
              <div className="font-medium text-xs">{getLastActiveTime()}</div>
            </div>
          </div>

          {/* Additional Info for Running Jobs */}
          {isRunning && job.currentInput && (
            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs">
              <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                <Clock className="w-3 h-3 animate-pulse" />
                Currently processing search terms...
              </div>
            </div>
          )}

          {/* Error indicator for failed jobs */}
          {isFailed && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/20 rounded text-xs">
              <div className="flex items-center gap-1 text-red-700 dark:text-red-300">
                <AlertCircle className="w-3 h-3" />
                Job failed - click to view details
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
