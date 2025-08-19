'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { JobStatusBadge } from './job-status-badge'
import { JobProgressBar } from './job-progress'
import { Job } from '@/graphql/generated/sdk'
import { ArrowRight, Calendar } from 'lucide-react'

interface JobCardProps {
  job: Job
}

export function JobCard({ job }: JobCardProps) {
  const hasProgress = job.itemsScraped && job.itemsScraped > 0

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
                <span className="font-medium">{job.provider}</span>
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
          {hasProgress && <JobProgressBar current={job.itemsScraped || 0} total={job.itemsScraped || 0} />}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Items Scraped</p>
              <p className="font-medium">{job.itemsScraped || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
