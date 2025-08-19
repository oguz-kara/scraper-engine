'use client'

import { useJobsQuery } from '@/graphql/generated/hooks'
import { JobCard } from './job-card'
import { Skeleton } from '@/components/ui/skeleton'

export function JobList() {
  // ALWAYS use generated hooks
  const { data, loading, error } = useJobsQuery({
    pollInterval: 5000, // Poll every 5 seconds for updates
  })

  console.log({ data })

  if (loading) return <JobListSkeleton />
  if (error) return <JobListError error={error} />

  return (
    <div className="space-y-4">
      {data?.jobs.edges.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
      {data?.jobs.edges.length === 0 && (
        <div className="text-center py-12 text-slate-500">No jobs found. Create your first job to get started.</div>
      )}
    </div>
  )
}

function JobListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border rounded-lg p-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-48" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

function JobListError({ error }: { error: Error }) {
  return (
    <div className="text-center py-12">
      <p className="text-red-500">Error loading jobs: {error.message}</p>
    </div>
  )
}
